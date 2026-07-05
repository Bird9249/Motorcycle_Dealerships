/**
 * Manual acceptance test for Sales Core (Phase 2.2).
 * Run: bun run src/server/scripts/test-sales-core-acceptance.ts
 *
 * Prerequisites: dev server, seeded inventory master data (bun run seed:inventory)
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
): Promise<{ status: number; body: unknown; setCookie?: string }> {
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
  return {
    status: res.status,
    body,
    setCookie: res.headers.get("set-cookie") ?? undefined,
  };
}

function extractSessionCookie(setCookie?: string): string | undefined {
  if (!setCookie) return undefined;
  return setCookie
    .split(/,(?=\s*admin-)/)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function login(): Promise<string> {
  const res = await jsonFetch("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(ADMIN),
  });
  const cookie = extractSessionCookie(res.setCookie);
  if (res.status !== 200 || !cookie) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return cookie;
}

async function seedCustomer(suffix: number): Promise<string> {
  const [row] = await db
    .insert(customers)
    .values({
      fullName: `Test Buyer ${suffix}`,
      phone: `020${String(suffix).slice(-8).padStart(8, "0")}`,
    })
    .returning({ id: customers.id });
  if (!row) throw new Error("Failed to seed customer");
  return row.id;
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n📋 Summary: ${ok}/${total} passed\n`);
}

async function main() {
  console.log(`\n🧪 Sales Core Acceptance Tests @ ${BASE}\n`);

  let cookie: string;
  try {
    cookie = await login();
    pass("Login", "admin session obtained");
  } catch (e) {
    fail("Login", String(e));
    printSummary();
    process.exit(1);
  }

  const suffix = Date.now();

  const modelsRes = await jsonFetch(
    "/api/inventory/models?limit=1&offset=0",
    {},
    cookie,
  );
  const modelsBody = modelsRes.body;
  const modelsList = Array.isArray(modelsBody)
    ? modelsBody
    : ((modelsBody as { data?: Array<{ id: string }> })?.data ?? []);
  const modelId = modelsList[0]?.id;
  if (!modelId) {
    fail("Setup model", "No models — run bun run seed:inventory");
    printSummary();
    process.exit(1);
  }

  const colorsRes = await jsonFetch(
    "/api/inventory/colors?limit=1&offset=0",
    {},
    cookie,
  );
  const colorsBody = colorsRes.body;
  const colorsList = Array.isArray(colorsBody)
    ? colorsBody
    : ((colorsBody as { data?: Array<{ id: string }> })?.data ?? []);
  const colorId = colorsList[0]?.id;
  if (!colorId) {
    fail("Setup color", "No colors — run bun run seed:inventory");
    printSummary();
    process.exit(1);
  }

  let customerId: string;
  try {
    customerId = await seedCustomer(suffix);
    pass("Seed customer", customerId);
  } catch (e) {
    fail("Seed customer", String(e));
    printSummary();
    process.exit(1);
  }

  async function createVehicle(label: string) {
    const res = await jsonFetch(
      "/api/inventory/vehicles",
      {
        method: "POST",
        body: JSON.stringify({
          modelId,
          colorId,
          chassisNumber: `CH-${label}-${suffix}`,
          engineNumber: `EN-${label}-${suffix}`,
          costPrice: "5000000",
          listPrice: "6500000",
        }),
      },
      cookie,
    );
    const body = res.body as { id?: string; status?: string };
    return { res, body };
  }

  const v1 = await createVehicle("confirm");
  if (v1.res.status === 201 && v1.body.id) {
    pass("Create vehicle (confirm flow)", v1.body.id);
  } else {
    fail(
      "Create vehicle (confirm flow)",
      `${v1.res.status} ${JSON.stringify(v1.body)}`,
    );
    printSummary();
    process.exit(1);
  }

  const v2 = await createVehicle("cancel");
  if (v2.res.status === 201 && v2.body.id) {
    pass("Create vehicle (cancel flow)", v2.body.id);
  } else {
    fail(
      "Create vehicle (cancel flow)",
      `${v2.res.status} ${JSON.stringify(v2.body)}`,
    );
    printSummary();
    process.exit(1);
  }

  const vehicleConfirmId = v1.body.id!;
  const vehicleCancelId = v2.body.id!;

  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const orderNumberPattern = new RegExp(`^SO-${datePart}-\\d{4}$`);

  const createRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: vehicleConfirmId,
        customerId,
        salePrice: "6500000",
        saleCurrency: "LAK",
        paymentType: "cash",
        notes: "acceptance test",
      }),
    },
    cookie,
  );
  const order = createRes.body as {
    id?: string;
    orderNumber?: string;
    status?: string;
    vehicle?: { status?: string };
  };

  if (
    createRes.status === 201 &&
    order.id &&
    order.status === "draft" &&
    order.orderNumber &&
    orderNumberPattern.test(order.orderNumber)
  ) {
    pass("Create sale", `${order.orderNumber} (draft)`);
  } else {
    fail(
      "Create sale",
      `${createRes.status} ${JSON.stringify(createRes.body)}`,
    );
  }

  const orderId = order.id;
  if (!orderId) {
    printSummary();
    process.exit(1);
  }

  const vehicleAfterCreate = await jsonFetch(
    `/api/inventory/vehicles/${vehicleConfirmId}`,
    {},
    cookie,
  );
  const vehCreate = vehicleAfterCreate.body as { status?: string };
  if (vehicleAfterCreate.status === 200 && vehCreate.status === "reserved") {
    pass("Reserve vehicle on create", "status=reserved");
  } else {
    fail(
      "Reserve vehicle on create",
      `${vehicleAfterCreate.status} status=${vehCreate.status}`,
    );
  }

  const updateRes = await jsonFetch(
    `/api/sales/orders/${orderId}`,
    {
      method: "PUT",
      body: JSON.stringify({ salePrice: "6400000", notes: "updated price" }),
    },
    cookie,
  );
  const updated = updateRes.body as { salePrice?: string; notes?: string };
  if (
    updateRes.status === 200 &&
    (updated.salePrice === "6400000.00" || updated.salePrice === "6400000") &&
    updated.notes === "updated price"
  ) {
    pass("Update draft sale", "salePrice + notes updated");
  } else {
    fail("Update draft sale", `${updateRes.status} ${JSON.stringify(updateRes.body)}`);
  }

  const cancelOrderRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: vehicleCancelId,
        customerId,
        salePrice: "6000000",
        paymentType: "cash",
      }),
    },
    cookie,
  );
  const cancelOrder = cancelOrderRes.body as { id?: string };
  if (cancelOrderRes.status === 201 && cancelOrder.id) {
    pass("Create sale (cancel flow)", cancelOrder.id);
  } else {
    fail(
      "Create sale (cancel flow)",
      `${cancelOrderRes.status} ${JSON.stringify(cancelOrderRes.body)}`,
    );
  }

  if (cancelOrder.id) {
    const cancelRes = await jsonFetch(
      `/api/sales/orders/${cancelOrder.id}/cancel`,
      { method: "POST" },
      cookie,
    );
    const cancelled = cancelRes.body as { status?: string };
    if (cancelRes.status === 200 && cancelled.status === "cancelled") {
      pass("Cancel draft sale", "status=cancelled");
    } else {
      fail("Cancel draft sale", `${cancelRes.status} ${JSON.stringify(cancelRes.body)}`);
    }

    const vehAfterCancel = await jsonFetch(
      `/api/inventory/vehicles/${vehicleCancelId}`,
      {},
      cookie,
    );
    const vehCancel = vehAfterCancel.body as { status?: string };
    if (vehAfterCancel.status === 200 && vehCancel.status === "in_stock") {
      pass("Restore vehicle on cancel", "status=in_stock");
    } else {
      fail(
        "Restore vehicle on cancel",
        `status=${vehCancel.status}`,
      );
    }
  }

  const confirmRes = await jsonFetch(
    `/api/sales/orders/${orderId}/confirm`,
    { method: "POST" },
    cookie,
  );
  const confirmed = confirmRes.body as {
    status?: string;
    soldAt?: string | null;
    vehicle?: { status?: string };
  };
  if (confirmRes.status === 200 && confirmed.status === "confirmed" && confirmed.soldAt) {
    pass("Confirm sale", `soldAt=${confirmed.soldAt}`);
  } else {
    fail("Confirm sale", `${confirmRes.status} ${JSON.stringify(confirmRes.body)}`);
  }

  const vehAfterConfirm = await jsonFetch(
    `/api/inventory/vehicles/${vehicleConfirmId}`,
    {},
    cookie,
  );
  const vehSold = vehAfterConfirm.body as { status?: string; soldAt?: string | null };
  if (vehAfterConfirm.status === 200 && vehSold.status === "sold") {
    pass("Vehicle sold after confirm", "status=sold");
  } else {
    fail("Vehicle sold after confirm", `status=${vehSold.status}`);
  }
  if (vehAfterConfirm.status === 200 && vehSold.soldAt) {
    pass("Vehicle soldAt on confirm", vehSold.soldAt);
  } else {
    fail("Vehicle soldAt on confirm", `soldAt=${vehSold.soldAt ?? "null"}`);
  }

  const completeRes = await jsonFetch(
    `/api/sales/orders/${orderId}/complete`,
    { method: "POST" },
    cookie,
  );
  const completed = completeRes.body as { status?: string };
  if (completeRes.status === 200 && completed.status === "completed") {
    pass("Complete sale", "status=completed");
  } else {
    fail("Complete sale", `${completeRes.status} ${JSON.stringify(completeRes.body)}`);
  }

  const duplicateRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: vehicleConfirmId,
        customerId,
        salePrice: "6500000",
        paymentType: "cash",
      }),
    },
    cookie,
  );
  if (
    duplicateRes.status === 409 ||
    duplicateRes.status === 400 ||
    duplicateRes.status === 422
  ) {
    pass("Reject sale on sold vehicle", `status=${duplicateRes.status}`);
  } else {
    fail(
      "Reject sale on sold vehicle",
      `expected 409/400 got ${duplicateRes.status}`,
    );
  }

  const listRes = await jsonFetch(
    "/api/sales/orders?limit=5&offset=0",
    {},
    cookie,
  );
  const listBody = listRes.body as { data?: unknown[]; meta?: { total?: number } };
  if (listRes.status === 200 && (listBody.data?.length ?? 0) > 0) {
    pass("List sales orders", `total=${listBody.meta?.total ?? listBody.data?.length}`);
  } else {
    fail("List sales orders", `${listRes.status}`);
  }

  const auditRes = await jsonFetch(
    "/api/audit?limit=50&offset=0",
    {},
    cookie,
  );
  const audit = auditRes.body as { data?: Array<{ action: string }> };
  const actions = audit.data?.map((a) => a.action) ?? [];
  const needed = [
    "SALES.ORDER.CREATE",
    "SALES.ORDER.UPDATE",
    "SALES.ORDER.CONFIRM",
    "SALES.ORDER.COMPLETE",
    "SALES.ORDER.CANCEL",
  ];
  const missing = needed.filter((a) => !actions.includes(a));
  if (auditRes.status === 200 && missing.length === 0) {
    pass("Audit log", needed.join(", "));
  } else {
    fail(
      "Audit log",
      `missing=${missing.join(", ") || "none"} sample=${actions.slice(0, 8).join(", ")}`,
    );
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
