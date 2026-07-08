/**
 * Manual acceptance test for Reports & Analytics (Phase 5).
 * Run: bun run test:reports
 *
 * Prerequisites: dev server running, rbac:sync applied
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function main() {
  console.log("=== Reports & Analytics Acceptance (Phase 5) ===\n");

  let cookie: string;
  try {
    cookie = await login();
    pass("login", "admin session");
  } catch (error) {
    fail("login", String(error));
    printSummary();
    process.exit(1);
  }

  const unauth = await jsonFetch("/api/reports/dashboard");
  if (unauth.status === 401) {
    pass("auth required", "401 without session");
  } else {
    fail("auth required", `expected 401, got ${unauth.status}`);
  }

  const dashboard = await jsonFetch(
    "/api/reports/dashboard?period=month",
    {},
    cookie,
  );

  if (dashboard.status !== 200) {
    fail("GET dashboard", `status ${dashboard.status}`);
    printSummary();
    process.exit(1);
  }

  const body = dashboard.body;
  if (!isRecord(body)) {
    fail("GET dashboard", "response is not an object");
    printSummary();
    process.exit(1);
  }

  const requiredKeys = [
    "period",
    "inventory",
    "sales",
    "payments",
    "afterSales",
    "trends",
    "recentSales",
  ];

  for (const key of requiredKeys) {
    if (key in body) {
      pass(`shape.${key}`, "present");
    } else {
      fail(`shape.${key}`, "missing");
    }
  }

  if (isRecord(body.inventory) && typeof body.inventory.inStock === "number") {
    pass("inventory.inStock", String(body.inventory.inStock));
  } else {
    fail("inventory.inStock", "invalid");
  }

  if (isRecord(body.sales) && Array.isArray(body.sales.byCurrency)) {
    pass("sales.byCurrency", `array length ${body.sales.byCurrency.length}`);
  } else {
    fail("sales.byCurrency", "invalid");
  }

  if (isRecord(body.payments) && typeof body.payments.pendingCount === "number") {
    pass("payments.pendingCount", String(body.payments.pendingCount));
  } else {
    fail("payments.pendingCount", "invalid");
  }

  if (isRecord(body.trends) && Array.isArray(body.trends.salesByDay)) {
    pass("trends.salesByDay", `array length ${body.trends.salesByDay.length}`);
  } else {
    fail("trends.salesByDay", "invalid");
  }

  if (Array.isArray(body.recentSales)) {
    pass("recentSales", `array length ${body.recentSales.length}`);
  } else {
    fail("recentSales", "invalid");
  }

  const week = await jsonFetch(
    "/api/reports/dashboard?period=week",
    {},
    cookie,
  );
  if (week.status === 200 && isRecord(week.body) && isRecord(week.body.period)) {
    pass("period=week", String(week.body.period.preset));
  } else {
    fail("period=week", `status ${week.status}`);
  }

  const salesReport = await jsonFetch(
    "/api/reports/sales?period=month&limit=10&offset=0",
    {},
    cookie,
  );
  if (salesReport.status !== 200) {
    fail("GET sales report", `status ${salesReport.status}`);
  } else if (isRecord(salesReport.body)) {
    const salesBody = salesReport.body;
    for (const key of ["period", "summary", "data", "meta"]) {
      if (key in salesBody) {
        pass(`sales.${key}`, "present");
      } else {
        fail(`sales.${key}`, "missing");
      }
    }
    if (
      isRecord(salesBody.summary) &&
      Array.isArray(salesBody.summary.byCurrency) &&
      Array.isArray(salesBody.summary.byStatus) &&
      Array.isArray(salesBody.summary.byPaymentType)
    ) {
      pass("sales.summary breakdown", "ok");
    } else {
      fail("sales.summary breakdown", "invalid");
    }
  } else {
    fail("GET sales report", "invalid body");
  }

  const inventoryReport = await jsonFetch(
    "/api/reports/inventory?brandLimit=5",
    {},
    cookie,
  );
  if (inventoryReport.status !== 200) {
    fail("GET inventory report", `status ${inventoryReport.status}`);
  } else if (isRecord(inventoryReport.body)) {
    const inv = inventoryReport.body;
    for (const key of [
      "snapshotAt",
      "totalVehicles",
      "byStatus",
      "byVehicleType",
      "byBrand",
      "costValueByCurrency",
      "listValueByCurrency",
    ]) {
      if (key in inv) pass(`inventory.${key}`, "present");
      else fail(`inventory.${key}`, "missing");
    }
  } else {
    fail("GET inventory report", "invalid body");
  }

  const paymentsReport = await jsonFetch(
    "/api/reports/payments?period=month",
    {},
    cookie,
  );
  if (paymentsReport.status !== 200) {
    fail("GET payments report", `status ${paymentsReport.status}`);
  } else if (isRecord(paymentsReport.body)) {
    const pay = paymentsReport.body;
    for (const key of [
      "period",
      "pendingCount",
      "verifiedByAccount",
      "verifiedByCurrency",
    ]) {
      if (key in pay) pass(`payments.${key}`, "present");
      else fail(`payments.${key}`, "missing");
    }
    if (typeof pay.pendingCount === "number") {
      pass("payments.pendingCount.value", String(pay.pendingCount));
    }
  } else {
    fail("GET payments report", "invalid body");
  }

  const afterSalesReport = await jsonFetch(
    "/api/reports/after-sales?period=month",
    {},
    cookie,
  );
  if (afterSalesReport.status !== 200) {
    fail("GET after-sales report", `status ${afterSalesReport.status}`);
  } else if (isRecord(afterSalesReport.body)) {
    const as = afterSalesReport.body;
    for (const key of [
      "period",
      "expiringWarranties",
      "serviceByType",
      "serviceRecordsInPeriod",
    ]) {
      if (key in as) pass(`afterSales.${key}`, "present");
      else fail(`afterSales.${key}`, "missing");
    }
  } else {
    fail("GET after-sales report", "invalid body");
  }

  async function fetchCsv(path: string, authCookie?: string) {
    const headers = new Headers();
    if (authCookie) headers.set("cookie", authCookie);
    const res = await fetch(`${BASE}${path}`, { headers });
    const text = await res.text();
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      text,
    };
  }

  const salesCsv = await fetchCsv(
    "/api/reports/sales/export?period=month",
    cookie,
  );
  if (salesCsv.status === 200 && salesCsv.contentType?.includes("text/csv")) {
    const firstLine = salesCsv.text.split("\n")[0] ?? "";
    if (firstLine.includes("orderNumber")) {
      pass("sales.export.csv", "headers ok");
    } else {
      fail("sales.export.csv", `bad headers: ${firstLine}`);
    }
  } else {
    fail("sales.export.csv", `status ${salesCsv.status}`);
  }

  const paymentsCsv = await fetchCsv(
    "/api/reports/payments/export?period=month",
    cookie,
  );
  if (
    paymentsCsv.status === 200 &&
    paymentsCsv.contentType?.includes("text/csv")
  ) {
    pass("payments.export.csv", "ok");
  } else {
    fail("payments.export.csv", `status ${paymentsCsv.status}`);
  }

  const inventoryCsv = await fetchCsv("/api/reports/inventory/export", cookie);
  if (
    inventoryCsv.status === 200 &&
    inventoryCsv.contentType?.includes("text/csv")
  ) {
    const firstLine = inventoryCsv.text.split("\n")[0] ?? "";
    if (firstLine.includes("chassisNumber")) {
      pass("inventory.export.csv", "headers ok");
    } else {
      fail("inventory.export.csv", `bad headers: ${firstLine}`);
    }
  } else {
    fail("inventory.export.csv", `status ${inventoryCsv.status}`);
  }

  const exportUnauth = await fetchCsv("/api/reports/sales/export?period=month");
  if (exportUnauth.status === 401) {
    pass("export.auth required", "401 without session");
  } else {
    fail("export.auth required", `expected 401, got ${exportUnauth.status}`);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
