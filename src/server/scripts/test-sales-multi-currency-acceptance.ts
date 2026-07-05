/**
 * Manual acceptance test for Sales Multi-Currency (Phase 2.4).
 * Run: bun run src/server/scripts/test-sales-multi-currency-acceptance.ts
 */

import { db } from "@/server/platform/db/client";
import { customers } from "@/server/platform/db/schema/customers";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const ADMIN = { email: "admin@admin.com", password: "123456" };

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}: ${detail}`);
}

async function jsonFetch(
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<{ status: number; body: unknown }> {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ADMIN),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie
    .split(/,(?=\s*admin-)/)
    .map((p) => p.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
  if (res.status !== 200 || !cookie) throw new Error("Login failed");
  return cookie;
}

async function seedCustomer(suffix: number) {
  const [row] = await db
    .insert(customers)
    .values({
      fullName: `MC Test ${suffix}`,
      phone: `020${String(suffix).slice(-8).padStart(8, "0")}`,
    })
    .returning({ id: customers.id });
  return row!.id;
}

async function createVehicle(cookie: string, suffix: number) {
  const models = await jsonFetch("/api/inventory/models", {}, cookie);
  const colors = await jsonFetch("/api/inventory/colors", {}, cookie);
  const modelId = (Array.isArray(models.body) ? models.body[0] : null) as
    | { id?: string }
    | null;
  const colorId = (Array.isArray(colors.body) ? colors.body[0] : null) as
    | { id?: string }
    | null;
  if (!modelId?.id || !colorId?.id) return undefined;

  const res = await jsonFetch(
    "/api/inventory/vehicles",
    {
      method: "POST",
      body: JSON.stringify({
        modelId: modelId.id,
        colorId: colorId.id,
        chassisNumber: `MC-${suffix}`,
        engineNumber: `MC-EN-${suffix}`,
        costPrice: "5000000",
        listPrice: "6500000",
      }),
    },
    cookie,
  );
  return (res.body as { id?: string })?.id;
}

function printSummary() {
  console.log(`\n📋 Summary: ${results.filter((r) => r.ok).length}/${results.length} passed\n`);
}

async function main() {
  console.log(`\n🧪 Sales Multi-Currency Acceptance @ ${BASE}\n`);

  const cookie = await login();
  pass("Login", "ok");

  const erRes = await jsonFetch("/api/sales/exchange-rates", {}, cookie);
  const rates = erRes.body as unknown[];
  if (erRes.status !== 200 || rates.length < 2) {
    fail("Exchange rates seeded", "run bun run seed:exchange-rates");
    printSummary();
    process.exit(1);
  }
  pass("Exchange rates available", `${rates.length} rates`);

  const convertRes = await jsonFetch(
    "/api/sales/convert-currency",
    {
      method: "POST",
      body: JSON.stringify({
        amount: "21000",
        fromCurrency: "LAK",
        toCurrency: "USD",
      }),
    },
    cookie,
  );
  const converted = convertRes.body as { amount?: string; toCurrency?: string };
  if (convertRes.status === 200 && converted.amount === "1.00") {
    pass("Convert LAK→USD", converted.amount);
  } else {
    fail("Convert LAK→USD", JSON.stringify(convertRes.body));
  }

  const previewRes = await jsonFetch(
    "/api/sales/price-conversions/preview",
    {
      method: "POST",
      body: JSON.stringify({
        amount: "6500000",
        saleCurrency: "LAK",
      }),
    },
    cookie,
  );
  const preview = previewRes.body as {
    conversions?: Array<{ currency: string; amount: string }>;
    exchangeRateUsed?: string;
  };
  if (
    previewRes.status === 200 &&
    preview.conversions?.length === 3 &&
    preview.exchangeRateUsed
  ) {
    pass(
      "Preview price conversions",
      `3 currencies, rate=${preview.exchangeRateUsed}`,
    );
  } else {
    fail("Preview price conversions", JSON.stringify(previewRes.body));
  }

  const suffix = Date.now();
  const customerId = await seedCustomer(suffix);
  const vehicleId = await createVehicle(cookie, suffix);
  if (!vehicleId) {
    fail("Setup vehicle", "failed");
    printSummary();
    process.exit(1);
  }

  const createRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId,
        customerId,
        salePrice: "6500000",
        saleCurrency: "LAK",
        paymentType: "cash",
      }),
    },
    cookie,
  );
  const order = createRes.body as {
    id?: string;
    exchangeRateUsed?: string | null;
  };
  if (createRes.status === 201 && order.id && order.exchangeRateUsed) {
    pass("Snapshot rate on create", order.exchangeRateUsed);
  } else {
    fail("Snapshot rate on create", JSON.stringify(createRes.body));
    printSummary();
    process.exit(1);
  }

  const detailRes = await jsonFetch(
    `/api/sales/orders/${order.id}`,
    {},
    cookie,
  );
  const detail = detailRes.body as {
    priceConversions?: { conversions?: unknown[] };
  };
  if (
    detailRes.status === 200 &&
    (detail.priceConversions?.conversions?.length ?? 0) === 3
  ) {
    pass("Order detail includes price conversions", "3 items");
  } else {
    fail("Order detail includes price conversions", JSON.stringify(detailRes.body));
  }

  const pcRes = await jsonFetch(
    `/api/sales/orders/${order.id}/price-conversions`,
    {},
    cookie,
  );
  const pc = pcRes.body as { conversions?: Array<{ currency: string }> };
  if (pcRes.status === 200 && pc.conversions?.length === 3) {
    pass("GET price-conversions", pc.conversions.map((c) => c.currency).join(", "));
  } else {
    fail("GET price-conversions", JSON.stringify(pcRes.body));
  }

  const confirmRes = await jsonFetch(
    `/api/sales/orders/${order.id}/confirm`,
    { method: "POST" },
    cookie,
  );
  const confirmed = confirmRes.body as {
    status?: string;
    exchangeRateUsed?: string | null;
    soldAt?: string;
  };
  if (
    confirmRes.status === 200 &&
    confirmed.status === "confirmed" &&
    confirmed.exchangeRateUsed
  ) {
    pass("Snapshot rate on confirm", confirmed.exchangeRateUsed);
  } else {
    fail("Snapshot rate on confirm", JSON.stringify(confirmRes.body));
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
