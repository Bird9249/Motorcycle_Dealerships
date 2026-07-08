/**
 * Acceptance test for Payments Schedule sync (Phase 3.6).
 * Run: bun run src/server/scripts/test-payments-schedule-acceptance.ts
 *
 * Covers partial payments → paidAmount accumulation → schedule `paid`.
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

function parseMoney(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function halfAmount(amount: string): string {
  const half = parseMoney(amount) / 2;
  return half.toFixed(2);
}

function remainderAmount(amount: string, paid: string): string {
  const rem = parseMoney(amount) - parseMoney(paid);
  return rem.toFixed(2);
}

type ScheduleRow = {
  id: string;
  installmentNumber: number;
  amount: string;
  status?: string;
  paidAmount?: string | null;
  paidAt?: string | null;
};

async function main() {
  console.log(`\n🧪 Payments Schedule Acceptance @ ${BASE}\n`);

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
    type: string;
    currency: string;
  }>;
  const cashAccount = accounts.find((a) => a.type === "cash");
  const bankAccount = accounts.find((a) => a.type === "bank_transfer");
  if (!cashAccount || !bankAccount) {
    fail("Setup accounts", "run bun run seed:payment-accounts");
    printSummary();
    process.exit(1);
  }

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
        fullName: `Schedule Pay ${suffix}`,
        phone: `024${String(suffix).slice(-7).padStart(7, "0")}`,
      }),
    },
    cookie,
  );
  const customerId = (customerRes.body as { id?: string })?.id;
  if (!customerId) {
    fail("Create customer", JSON.stringify(customerRes.body));
    printSummary();
    process.exit(1);
  }

  const vehicleRes = await jsonFetch(
    "/api/inventory/vehicles",
    {
      method: "POST",
      body: JSON.stringify({
        modelId,
        colorId,
        chassisNumber: `SCH-PAY-${suffix}`,
        engineNumber: `ENG-SCH-${suffix}`,
        costPrice: "5000000",
        listPrice: "6500000",
      }),
    },
    cookie,
  );
  const vehicleId = (vehicleRes.body as { id?: string })?.id;
  if (!vehicleId) {
    fail("Create vehicle", JSON.stringify(vehicleRes.body));
    printSummary();
    process.exit(1);
  }

  const orderRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId,
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
  const orderId = (orderRes.body as { id?: string })?.id;
  if (orderRes.status !== 201 || !orderId) {
    fail("Create lease order", JSON.stringify(orderRes.body));
    printSummary();
    process.exit(1);
  }

  await jsonFetch(`/api/sales/orders/${orderId}/confirm`, { method: "POST" }, cookie);

  const scheduleRes = await jsonFetch(
    `/api/sales/orders/${orderId}/schedule`,
    {},
    cookie,
  );
  const schedules = (
    scheduleRes.body as { schedules?: ScheduleRow[] }
  )?.schedules;
  const firstSchedule = schedules?.[0];
  const secondSchedule = schedules?.[1];
  if (!firstSchedule?.id || !secondSchedule?.id) {
    fail("Load schedules", JSON.stringify(scheduleRes.body));
    printSummary();
    process.exit(1);
  }
  pass("Load schedules", `installment #${firstSchedule.installmentNumber}`);

  const partial1 = halfAmount(firstSchedule.amount);

  const pay1Res = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: cashAccount.id,
        amount: partial1,
        currency: "LAK",
        paymentMethod: "cash",
        paidAt: new Date().toISOString(),
        notes: "partial 1",
      }),
    },
    cookie,
  );
  const payment1 = pay1Res.body as { id?: string };
  if (pay1Res.status !== 201 || !payment1.id) {
    fail("Record partial payment 1", JSON.stringify(pay1Res.body));
    printSummary();
    process.exit(1);
  }
  pass("Record partial payment 1", partial1);

  const verify1Res = await jsonFetch(
    `/api/payments/${payment1.id}/verify`,
    { method: "POST" },
    cookie,
  );
  if (verify1Res.status !== 200) {
    fail("Verify partial payment 1", JSON.stringify(verify1Res.body));
  } else {
    pass("Verify partial payment 1", "ok");
  }

  const afterPartial1 = await jsonFetch(
    `/api/sales/orders/${orderId}/schedule`,
    {},
    cookie,
  );
  const rowAfter1 = (
    afterPartial1.body as { schedules?: ScheduleRow[] }
  )?.schedules?.find((s) => s.id === firstSchedule.id);
  if (
    afterPartial1.status === 200 &&
    rowAfter1?.status === "pending" &&
    Math.abs(parseMoney(rowAfter1.paidAmount) - parseMoney(partial1)) < 0.01
  ) {
    pass(
      "Schedule pending after partial",
      `paidAmount=${rowAfter1.paidAmount}`,
    );
  } else {
    fail(
      "Schedule pending after partial",
      `status=${rowAfter1?.status} paidAmount=${rowAfter1?.paidAmount}`,
    );
  }

  const partial2 = remainderAmount(
    firstSchedule.amount,
    rowAfter1?.paidAmount ?? partial1,
  );

  const pay2Res = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: cashAccount.id,
        amount: partial2,
        currency: "LAK",
        paymentMethod: "cash",
        paidAt: new Date().toISOString(),
        notes: "partial 2",
      }),
    },
    cookie,
  );
  const payment2 = pay2Res.body as { id?: string };
  if (pay2Res.status !== 201 || !payment2.id) {
    fail("Record partial payment 2", JSON.stringify(pay2Res.body));
  } else {
    pass("Record partial payment 2", partial2);
  }

  const verify2Res = await jsonFetch(
    `/api/payments/${payment2.id}/verify`,
    { method: "POST" },
    cookie,
  );
  if (verify2Res.status !== 200) {
    fail("Verify partial payment 2", JSON.stringify(verify2Res.body));
  } else {
    pass("Verify partial payment 2", "ok");
  }

  const afterFull = await jsonFetch(
    `/api/sales/orders/${orderId}/schedule`,
    {},
    cookie,
  );
  const rowAfterFull = (
    afterFull.body as { schedules?: ScheduleRow[] }
  )?.schedules?.find((s) => s.id === firstSchedule.id);
  if (
    afterFull.status === 200 &&
    rowAfterFull?.status === "paid" &&
    rowAfterFull.paidAt &&
    Math.abs(
      parseMoney(rowAfterFull.paidAmount) - parseMoney(firstSchedule.amount),
    ) < 0.01
  ) {
    pass(
      "Schedule paid after full partial sum",
      `paidAmount=${rowAfterFull.paidAmount}`,
    );
  } else {
    fail(
      "Schedule paid after full partial sum",
      `status=${rowAfterFull?.status} paidAmount=${rowAfterFull?.paidAmount}`,
    );
  }

  const overpayRes = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: firstSchedule.id,
        paymentAccountId: cashAccount.id,
        amount: "1.00",
        currency: "LAK",
        paymentMethod: "cash",
        paidAt: new Date().toISOString(),
      }),
    },
    cookie,
  );
  if (overpayRes.status === 422) {
    pass("Reject overpay on paid schedule", "422 AMOUNT_EXCEEDS_DUE");
  } else {
    fail(
      "Reject overpay on paid schedule",
      `expected 422 got ${overpayRes.status}`,
    );
  }

  const rejectedPayRes = await jsonFetch(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        paymentScheduleId: secondSchedule.id,
        paymentAccountId: bankAccount.id,
        amount: halfAmount(secondSchedule.amount),
        currency: "LAK",
        paymentMethod: "bank_transfer",
        paidAt: new Date().toISOString(),
        slipImageKey: `uploads/payments/reject-schedule-${suffix}.jpg`,
      }),
    },
    cookie,
  );
  const rejectedPayment = rejectedPayRes.body as { id?: string };
  if (rejectedPayRes.status !== 201 || !rejectedPayment.id) {
    fail("Record payment for reject test", JSON.stringify(rejectedPayRes.body));
  } else {
    await jsonFetch(
      `/api/payments/${rejectedPayment.id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: "ສລິບຜິດ" }),
      },
      cookie,
    );
    const afterReject = await jsonFetch(
      `/api/sales/orders/${orderId}/schedule`,
      {},
      cookie,
    );
    const row2 = (
      afterReject.body as { schedules?: ScheduleRow[] }
    )?.schedules?.find((s) => s.id === secondSchedule.id);
    const paidZero =
      !row2?.paidAmount || Math.abs(parseMoney(row2.paidAmount)) < 0.01;
    if (afterReject.status === 200 && row2?.status === "pending" && paidZero) {
      pass("Rejected payment does not count in paidAmount", "paidAmount=0");
    } else {
      fail(
        "Rejected payment does not count in paidAmount",
        `status=${row2?.status} paidAmount=${row2?.paidAmount}`,
      );
    }
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
