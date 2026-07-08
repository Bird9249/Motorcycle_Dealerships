/**
 * Manual acceptance test for Payments Core (Phase 3.2).
 * Run: bun run src/server/scripts/test-payments-core-acceptance.ts
 *
 * Prerequisites: dev server, seed:inventory, seed:payment-accounts
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

async function main() {
  console.log(`\n🧪 Payments Core Acceptance @ ${BASE}\n`);

  let cookie: string;
  try {
    cookie = await login();
    pass("Login", "ok");
  } catch (e) {
    fail("Login", String(e));
    printSummary();
    process.exit(1);
  }

  const suffix = Date.now();

  const accountsRes = await jsonFetch(
    "/api/payments/accounts?active=all",
    {},
    cookie,
  );
  const accounts = accountsRes.body as Array<{
    id: string;
    name: string;
    type: string;
    currency: string;
  }>;
  const cashAccount = accounts.find((a) => a.type === "cash");
  const bankAccount = accounts.find((a) => a.type === "bank_transfer");
  if (
    accountsRes.status !== 200 ||
    !cashAccount ||
    !bankAccount
  ) {
    fail("List payment accounts", "run bun run seed:payment-accounts");
    printSummary();
    process.exit(1);
  }
  pass("List payment accounts", `${accounts.length} accounts`);

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
  if (!modelId || !colorId) {
    fail("Setup inventory", "seed:inventory required");
    printSummary();
    process.exit(1);
  }

  const customerRes = await jsonFetch(
    "/api/sales/customers",
    {
      method: "POST",
      body: JSON.stringify({
        fullName: `Pay Test ${suffix}`,
        phone: `022${String(suffix).slice(-7).padStart(7, "0")}`,
      }),
    },
    cookie,
  );
  const customerId = (customerRes.body as { id?: string })?.id;
  if (customerRes.status !== 201 || !customerId) {
    fail("Create customer", JSON.stringify(customerRes.body));
    printSummary();
    process.exit(1);
  }

  async function createVehicle(label: string) {
    return jsonFetch(
      "/api/inventory/vehicles",
      {
        method: "POST",
        body: JSON.stringify({
          modelId,
          colorId,
          chassisNumber: `PAY-${label}-${suffix}`,
          engineNumber: `ENG-${label}-${suffix}`,
          costPrice: "5000000",
          listPrice: "6500000",
        }),
      },
      cookie,
    );
  }

  const cashVehicle = await createVehicle("cash");
  const leaseVehicle = await createVehicle("lease");
  const cashVehicleId = (cashVehicle.body as { id?: string })?.id;
  const leaseVehicleId = (leaseVehicle.body as { id?: string })?.id;
  if (!cashVehicleId || !leaseVehicleId) {
    fail("Create vehicles", JSON.stringify(cashVehicle.body));
    printSummary();
    process.exit(1);
  }
  pass("Create vehicles", `${cashVehicleId}, ${leaseVehicleId}`);

  const cashOrderRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: cashVehicleId,
        customerId,
        salePrice: "6500000",
        paymentType: "cash",
      }),
    },
    cookie,
  );
  const cashOrder = cashOrderRes.body as { id?: string; orderNumber?: string };
  if (cashOrderRes.status !== 201 || !cashOrder.id) {
    fail("Create cash order", JSON.stringify(cashOrderRes.body));
    printSummary();
    process.exit(1);
  }

  await jsonFetch(
    `/api/sales/orders/${cashOrder.id}/confirm`,
    { method: "POST" },
    cookie,
  );

  const cashPayRes = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        salesOrderId: cashOrder.id,
        paymentAccountId: cashAccount.id,
        amount: "6500000",
        currency: "LAK",
        paymentMethod: "cash",
        paidAt: new Date().toISOString(),
        notes: "cash acceptance",
      }),
    },
    cookie,
  );
  const cashPayment = cashPayRes.body as {
    id?: string;
    paymentNumber?: string;
    status?: string;
    slipUrl?: string | null;
  };
  const payNumberPattern = /^PAY-\d{8}-\d{4}$/;
  if (
    cashPayRes.status === 201 &&
    cashPayment.id &&
    cashPayment.status === "pending" &&
    cashPayment.paymentNumber &&
    payNumberPattern.test(cashPayment.paymentNumber)
  ) {
    pass("Record cash payment", cashPayment.paymentNumber);
  } else {
    fail("Record cash payment", JSON.stringify(cashPayRes.body));
  }

  const cashVerifyRes = await jsonFetch(
    `/api/payments/${cashPayment.id}/verify`,
    { method: "POST" },
    cookie,
  );
  const cashVerified = cashVerifyRes.body as { status?: string };
  if (cashVerifyRes.status === 200 && cashVerified.status === "verified") {
    pass("Verify cash payment", "status=verified");
  } else {
    fail("Verify cash payment", JSON.stringify(cashVerifyRes.body));
  }

  const leaseOrderRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: leaseVehicleId,
        customerId,
        salePrice: "6500000",
        paymentType: "in_house_leasing",
        downPayment: "1500000",
        installmentMonths: 12,
        interestRatePercent: "12",
      }),
    },
    cookie,
  );
  const leaseOrder = leaseOrderRes.body as { id?: string };
  if (leaseOrderRes.status !== 201 || !leaseOrder.id) {
    fail("Create lease order", JSON.stringify(leaseOrderRes.body));
    printSummary();
    process.exit(1);
  }

  await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/confirm`,
    { method: "POST" },
    cookie,
  );

  const scheduleRes = await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/schedule`,
    {},
    cookie,
  );
  const scheduleBody = scheduleRes.body as {
    schedules?: Array<{ id: string; installmentNumber: number; amount: string }>;
  };
  const firstSchedule = scheduleBody.schedules?.[0];
  if (!firstSchedule?.id) {
    fail("Get first schedule", JSON.stringify(scheduleRes.body));
    printSummary();
    process.exit(1);
  }
  pass("Get schedule", `installment #${firstSchedule.installmentNumber}`);

  const bankPayRes = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: bankAccount.id,
        amount: firstSchedule.amount,
        currency: "LAK",
        paymentMethod: "bank_transfer",
        paidAt: new Date().toISOString(),
        slipImageKey: `uploads/payments/test-slip-${suffix}.jpg`,
      }),
    },
    cookie,
  );
  const bankPayment = bankPayRes.body as {
    id?: string;
    slipUrl?: string | null;
    status?: string;
  };
  if (
    bankPayRes.status === 201 &&
    bankPayment.id &&
    bankPayment.status === "pending" &&
    bankPayment.slipUrl?.includes("test-slip")
  ) {
    pass("Record bank payment with slip", bankPayment.slipUrl ?? "ok");
  } else {
    fail("Record bank payment with slip", JSON.stringify(bankPayRes.body));
  }

  const rejectRes = await jsonFetch(
    `/api/payments/${bankPayment.id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason: "ສລິບບໍ່ຊັດເຈນ" }),
    },
    cookie,
  );
  const rejected = rejectRes.body as { status?: string; notes?: string };
  if (
    rejectRes.status === 200 &&
    rejected.status === "rejected" &&
    rejected.notes?.includes("ປະຕິເສດ")
  ) {
    pass("Reject bank payment", "status=rejected");
  } else {
    fail("Reject bank payment", JSON.stringify(rejectRes.body));
  }

  const doubleRejectRes = await jsonFetch(
    `/api/payments/${bankPayment.id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason: "ຊ້ຳ" }),
    },
    cookie,
  );
  if (doubleRejectRes.status === 409) {
    pass("Reject already rejected", "409");
  } else {
    fail(
      "Reject already rejected",
      `expected 409 got ${doubleRejectRes.status}`,
    );
  }

  const pendingCountRes = await jsonFetch(
    "/api/payments/pending-count",
    {},
    cookie,
  );
  const pendingCount = (pendingCountRes.body as { count?: number })?.count;
  if (pendingCountRes.status === 200 && typeof pendingCount === "number") {
    pass("Pending count", String(pendingCount));
  } else {
    fail("Pending count", JSON.stringify(pendingCountRes.body));
  }

  const bankPay2Res = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: bankAccount.id,
        amount: firstSchedule.amount,
        currency: "LAK",
        paymentMethod: "bank_transfer",
        paidAt: new Date().toISOString(),
        slipImageKey: `uploads/payments/test-slip-2-${suffix}.jpg`,
      }),
    },
    cookie,
  );
  const bankPayment2 = bankPay2Res.body as { id?: string; status?: string };
  if (bankPay2Res.status === 201 && bankPayment2.id) {
    pass("Record replacement payment after reject", bankPayment2.id);
  } else {
    fail("Record replacement payment after reject", JSON.stringify(bankPay2Res.body));
  }

  const slipRequiredRes = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: bankAccount.id,
        amount: "1000",
        currency: "LAK",
        paymentMethod: "bank_transfer",
        paidAt: new Date().toISOString(),
      }),
    },
    cookie,
  );
  if (slipRequiredRes.status === 422) {
    pass("Reject bank payment without slip", "422");
  } else {
    fail(
      "Reject bank payment without slip",
      `expected 422 got ${slipRequiredRes.status}`,
    );
  }

  const bankVerifyRes = await jsonFetch(
    `/api/payments/${bankPayment2.id}/verify`,
    { method: "POST" },
    cookie,
  );
  if (bankVerifyRes.status === 200) {
    pass("Verify bank payment", "ok");
  } else {
    fail("Verify bank payment", JSON.stringify(bankVerifyRes.body));
  }

  const scheduleAfter = await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/schedule`,
    {},
    cookie,
  );
  const afterSchedules = (
    scheduleAfter.body as {
      schedules?: Array<{ installmentNumber: number; status?: string }>;
    }
  )?.schedules;
  const firstStatus = afterSchedules?.[0]?.status;
  if (scheduleAfter.status === 200 && firstStatus === "paid") {
    pass("Schedule marked paid after verify", "status=paid");
  } else {
    fail("Schedule marked paid after verify", `status=${firstStatus ?? "?"}`);
  }

  const listRes = await jsonFetch(
    "/api/payments?limit=10&offset=0",
    {},
    cookie,
  );
  const listBody = listRes.body as { data?: unknown[]; meta?: { total?: number } };
  if (listRes.status === 200 && (listBody.data?.length ?? 0) >= 2) {
    pass("List payments", `total=${listBody.meta?.total ?? listBody.data?.length}`);
  } else {
    fail("List payments", JSON.stringify(listRes.body));
  }

  const auditRes = await jsonFetch(
    "/api/audit?limit=50&offset=0",
    {},
    cookie,
  );
  const audit = auditRes.body as { data?: Array<{ action: string }> };
  const actions = audit.data?.map((a) => a.action) ?? [];
  const needed = ["PAYMENT.CREATE", "PAYMENT.VERIFY", "PAYMENT.REJECT"];
  const missing = needed.filter((a) => !actions.includes(a));
  if (auditRes.status === 200 && missing.length === 0) {
    pass("Audit log", needed.join(", "));
  } else {
    fail("Audit log", `missing=${missing.join(", ")}`);
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
