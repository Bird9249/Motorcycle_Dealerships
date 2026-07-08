/**
 * Acceptance test for Payments Reconciliation (Phase 3.4).
 * Run: bun run src/server/scripts/test-payments-reconciliation-acceptance.ts
 */

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

function extractSessionCookie(setCookie?: string): string | undefined {
  if (!setCookie) return undefined;
  return setCookie
    .split(/,(?=\s*admin-)/)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ADMIN),
  });
  const cookie = extractSessionCookie(res.headers.get("set-cookie") ?? undefined);
  if (res.status !== 200 || !cookie) {
    throw new Error(`Login failed: ${res.status}`);
  }
  return cookie;
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n📋 Summary: ${ok}/${results.length} passed\n`);
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log(`\n🧪 Payments Reconciliation Acceptance @ ${BASE}\n`);

  let cookie: string;
  try {
    cookie = await login();
    pass("Login", "ok");
  } catch (e) {
    fail("Login", String(e));
    printSummary();
    process.exit(1);
  }

  const date = todayStr();
  const suffix = Date.now();

  const accountsRes = await jsonFetch(
    "/api/payments/accounts?active=true",
    {},
    cookie,
  );
  const accounts = accountsRes.body as Array<{ id: string; type: string }>;
  const cashAccount = accounts.find((a) => a.type === "cash");
  if (!cashAccount) {
    fail("Setup accounts", "seed:payment-accounts required");
    printSummary();
    process.exit(1);
  }

  const summaryRes = await jsonFetch(
    `/api/payments/reconciliation?date=${date}`,
    {},
    cookie,
  );
  const summary = summaryRes.body as {
    reconciliationDate?: string;
    rows?: Array<{ paymentAccountId: string; expectedAmount: string }>;
  };
  if (
    summaryRes.status === 200 &&
    summary.reconciliationDate === date &&
    (summary.rows?.length ?? 0) >= 1
  ) {
    pass("GET reconciliation summary", `${summary.rows?.length} accounts`);
  } else {
    fail("GET reconciliation summary", JSON.stringify(summaryRes.body));
  }

  const byDateRes = await jsonFetch(
    `/api/payments/reconciliation/${date}`,
    {},
    cookie,
  );
  if (byDateRes.status === 200) {
    pass("GET reconciliation by date path", date);
  } else {
    fail("GET reconciliation by date path", JSON.stringify(byDateRes.body));
  }

  const cashRow = summary.rows?.find(
    (r) => r.paymentAccountId === cashAccount.id,
  );
  const expectedBefore = cashRow?.expectedAmount ?? "0";

  const modelsRes = await jsonFetch("/api/inventory/models?limit=1", {}, cookie);
  const colorsRes = await jsonFetch("/api/inventory/colors?limit=1", {}, cookie);
  const modelId = (
    Array.isArray(modelsRes.body)
      ? modelsRes.body[0]
      : (modelsRes.body as { data?: Array<{ id: string }> })?.data?.[0]
  )?.id;
  const colorId = (
    Array.isArray(colorsRes.body)
      ? colorsRes.body[0]
      : (colorsRes.body as { data?: Array<{ id: string }> })?.data?.[0]
  )?.id;

  if (modelId && colorId) {
    const customerRes = await jsonFetch(
      "/api/sales/customers",
      {
        method: "POST",
        body: JSON.stringify({
          fullName: `Recon Test ${suffix}`,
          phone: `023${String(suffix).slice(-7).padStart(7, "0")}`,
        }),
      },
      cookie,
    );
    const customerId = (customerRes.body as { id?: string })?.id;

    if (customerId) {
      const vehicleRes = await jsonFetch(
        "/api/inventory/vehicles",
        {
          method: "POST",
          body: JSON.stringify({
            modelId,
            colorId,
            chassisNumber: `RECON-${suffix}`,
            engineNumber: `ENG-RECON-${suffix}`,
            costPrice: "5000000",
            listPrice: "6500000",
          }),
        },
        cookie,
      );
      const vehicleId = (vehicleRes.body as { id?: string })?.id;

      if (vehicleId) {
        const orderRes = await jsonFetch(
          "/api/sales/orders",
          {
            method: "POST",
            body: JSON.stringify({
              vehicleId,
              customerId,
              salePrice: "1000000",
              paymentType: "cash",
            }),
          },
          cookie,
        );
        const orderId = (orderRes.body as { id?: string })?.id;
        if (orderId) {
          await jsonFetch(
            `/api/sales/orders/${orderId}/confirm`,
            { method: "POST" },
            cookie,
          );
          const payRes = await jsonFetch(
            "/api/payments",
            {
              method: "POST",
              body: JSON.stringify({
                salesOrderId: orderId,
                paymentAccountId: cashAccount.id,
                amount: "1000000",
                currency: "LAK",
                paymentMethod: "cash",
                paidAt: new Date().toISOString(),
              }),
            },
            cookie,
          );
          const paymentId = (payRes.body as { id?: string })?.id;
          if (paymentId) {
            await jsonFetch(
              `/api/payments/${paymentId}/verify`,
              { method: "POST" },
              cookie,
            );
          }
        }
      }
    }
  }

  const summaryAfterRes = await jsonFetch(
    `/api/payments/reconciliation?date=${date}`,
    {},
    cookie,
  );
  const summaryAfter = summaryAfterRes.body as {
    rows?: Array<{
      paymentAccountId: string;
      expectedAmount: string;
      status: string;
    }>;
  };
  const cashAfter = summaryAfter.rows?.find(
    (r) => r.paymentAccountId === cashAccount.id,
  );
  const expectedNum = Number.parseFloat(cashAfter?.expectedAmount ?? "0");
  const beforeNum = Number.parseFloat(expectedBefore);
  if (
    summaryAfterRes.status === 200 &&
    expectedNum >= beforeNum &&
    expectedNum > 0
  ) {
    pass("Expected amount from verified payments", cashAfter?.expectedAmount ?? "?");
  } else {
    fail(
      "Expected amount from verified payments",
      `before=${expectedBefore} after=${cashAfter?.expectedAmount ?? "?"}`,
    );
  }

  const balancedActual = cashAfter?.expectedAmount ?? "1000000.00";
  const upsertRes = await jsonFetch(
    "/api/payments/reconciliation",
    {
      method: "POST",
      body: JSON.stringify({
        reconciliationDate: `${date}T00:00:00.000Z`,
        items: [
          {
            paymentAccountId: cashAccount.id,
            actualAmount: balancedActual,
            notes: "reconciliation acceptance",
          },
        ],
      }),
    },
    cookie,
  );
  const upsertBody = upsertRes.body as {
    rows?: Array<{
      paymentAccountId: string;
      status: string;
      difference: string | null;
    }>;
  };
  const savedCash = upsertBody.rows?.find(
    (r) => r.paymentAccountId === cashAccount.id,
  );
  if (
    upsertRes.status === 200 &&
    savedCash?.status === "balanced" &&
    Math.abs(Number.parseFloat(savedCash.difference ?? "999")) < 0.01
  ) {
    pass("POST reconciliation balanced", "status=balanced");
  } else {
    fail("POST reconciliation balanced", JSON.stringify(upsertRes.body));
  }

  const discrepancyRes = await jsonFetch(
    "/api/payments/reconciliation",
    {
      method: "POST",
      body: JSON.stringify({
        reconciliationDate: `${date}T00:00:00.000Z`,
        items: [
          {
            paymentAccountId: cashAccount.id,
            actualAmount: "1.00",
            notes: "discrepancy test",
          },
        ],
      }),
    },
    cookie,
  );
  const discrepancyBody = discrepancyRes.body as {
    rows?: Array<{ paymentAccountId: string; status: string }>;
  };
  const discCash = discrepancyBody.rows?.find(
    (r) => r.paymentAccountId === cashAccount.id,
  );
  if (discrepancyRes.status === 200 && discCash?.status === "discrepancy") {
    pass("POST reconciliation discrepancy", "status=discrepancy");
  } else {
    fail("POST reconciliation discrepancy", JSON.stringify(discrepancyRes.body));
  }

  const auditRes = await jsonFetch("/api/audit?limit=50&offset=0", {}, cookie);
  const audit = auditRes.body as { data?: Array<{ action: string }> };
  const hasRecon = audit.data?.some((a) => a.action === "RECONCILIATION.UPSERT");
  if (auditRes.status === 200 && hasRecon) {
    pass("Audit RECONCILIATION.UPSERT", "ok");
  } else {
    fail("Audit RECONCILIATION.UPSERT", "missing");
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
