/**
 * Manual acceptance test for Sales Financing (Phase 2.3).
 * Run: bun run src/server/scripts/test-sales-financing-acceptance.ts
 */

import { eq } from "drizzle-orm";
import { db } from "@/server/platform/db/client";
import { customers } from "@/server/platform/db/schema/customers";
import { paymentSchedules } from "@/server/platform/db/schema/sales";

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
  const headers = new Headers({ "content-type": "application/json" });
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers,
    body: JSON.stringify(ADMIN),
  });
  const cookie = extractSessionCookie(res.headers.get("set-cookie") ?? undefined);
  if (res.status !== 200 || !cookie) {
    throw new Error(`Login failed: ${res.status}`);
  }
  return cookie;
}

async function seedCustomer(suffix: number): Promise<string> {
  const [row] = await db
    .insert(customers)
    .values({
      fullName: `Finance Test ${suffix}`,
      phone: `021${String(suffix).slice(-7).padStart(7, "0")}`,
    })
    .returning({ id: customers.id });
  if (!row) throw new Error("Failed to seed customer");
  return row.id;
}

async function getFirstModelAndColor(cookie: string) {
  const modelsRes = await jsonFetch("/api/inventory/models", {}, cookie);
  const colorsRes = await jsonFetch("/api/inventory/colors", {}, cookie);
  const models = Array.isArray(modelsRes.body) ? modelsRes.body : [];
  const colors = Array.isArray(colorsRes.body) ? colorsRes.body : [];
  return {
    modelId: (models[0] as { id?: string })?.id,
    colorId: (colors[0] as { id?: string })?.id,
  };
}

async function createVehicle(
  cookie: string,
  suffix: number,
  label: string,
): Promise<string | undefined> {
  const { modelId, colorId } = await getFirstModelAndColor(cookie);
  if (!modelId || !colorId) return undefined;

  const res = await jsonFetch(
    "/api/inventory/vehicles",
    {
      method: "POST",
      body: JSON.stringify({
        modelId,
        colorId,
        chassisNumber: `FIN-${label}-${suffix}`,
        engineNumber: `ENG-${label}-${suffix}`,
        costPrice: "5000000",
        listPrice: "6500000",
      }),
    },
    cookie,
  );
  return (res.body as { id?: string })?.id;
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n📋 Summary: ${ok}/${results.length} passed\n`);
}

async function main() {
  console.log(`\n🧪 Sales Financing Acceptance @ ${BASE}\n`);

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
  const customerId = await seedCustomer(suffix);
  pass("Seed customer", customerId);

  const fcRes = await jsonFetch("/api/sales/finance-companies", {}, cookie);
  const companies = fcRes.body as Array<{ id: string; code: string }>;
  if (fcRes.status === 200 && companies.length > 0) {
    pass("List finance companies", `${companies.length} companies`);
  } else {
    fail("List finance companies", `${fcRes.status} — run bun run seed:finance`);
    printSummary();
    process.exit(1);
  }

  const financeCompanyId = companies[0]!.id;

  const erRes = await jsonFetch("/api/sales/exchange-rates", {}, cookie);
  if (erRes.status === 200) {
    pass("List exchange rates", `status=${erRes.status}`);
  } else {
    fail("List exchange rates", String(erRes.status));
  }

  const vehicleFinanceId = await createVehicle(cookie, suffix, "bank");
  const vehicleLeaseId = await createVehicle(cookie, suffix, "lease");
  if (!vehicleFinanceId || !vehicleLeaseId) {
    fail("Create vehicles", "missing model/color");
    printSummary();
    process.exit(1);
  }
  pass("Create vehicles", `${vehicleFinanceId}, ${vehicleLeaseId}`);

  const bankRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: vehicleFinanceId,
        customerId,
        salePrice: "6500000",
        paymentType: "bank_finance",
        financeCompanyId,
        financeApprovedAmount: "6000000",
      }),
    },
    cookie,
  );
  const bankOrder = bankRes.body as { id?: string; financeApprovedAmount?: string };
  if (bankRes.status === 201 && bankOrder.id) {
    pass("Create bank finance sale", bankOrder.id);
  } else {
    fail("Create bank finance sale", JSON.stringify(bankRes.body));
    printSummary();
    process.exit(1);
  }

  const bankConfirm = await jsonFetch(
    `/api/sales/orders/${bankOrder.id}/confirm`,
    { method: "POST" },
    cookie,
  );
  if (bankConfirm.status === 200) {
    pass("Confirm bank finance sale", "ok");
  } else {
    fail("Confirm bank finance sale", JSON.stringify(bankConfirm.body));
  }

  const transferRes = await jsonFetch(
    `/api/sales/orders/${bankOrder.id}/finance-transfer`,
    {
      method: "PATCH",
      body: JSON.stringify({
        financeTransferReceived: true,
        financeTransferDate: "2026-07-05",
      }),
    },
    cookie,
  );
  const transfer = transferRes.body as {
    financeTransferReceived?: boolean;
    financeTransferDate?: string;
  };
  if (
    transferRes.status === 200 &&
    transfer.financeTransferReceived === true
  ) {
    pass("Update finance transfer", transfer.financeTransferDate ?? "received");
  } else {
    fail("Update finance transfer", JSON.stringify(transferRes.body));
  }

  const leaseRes = await jsonFetch(
    "/api/sales/orders",
    {
      method: "POST",
      body: JSON.stringify({
        vehicleId: vehicleLeaseId,
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
  const leaseOrder = leaseRes.body as {
    id?: string;
    monthlyInstallment?: string;
  };
  if (leaseRes.status === 201 && leaseOrder.id && leaseOrder.monthlyInstallment) {
    pass(
      "Create in-house leasing sale",
      `monthly=${leaseOrder.monthlyInstallment}`,
    );
  } else {
    fail("Create in-house leasing sale", JSON.stringify(leaseRes.body));
    printSummary();
    process.exit(1);
  }

  const previewRes = await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/schedule/preview`,
    { method: "POST", body: JSON.stringify({}) },
    cookie,
  );
  const preview = previewRes.body as {
    monthlyInstallment?: string;
    schedules?: Array<{ installmentNumber: number; amount: string }>;
  };
  if (
    previewRes.status === 200 &&
    preview.schedules?.length === 12 &&
    preview.monthlyInstallment
  ) {
    pass(
      "Preview payment schedule",
      `12 installments, monthly=${preview.monthlyInstallment}`,
    );
  } else {
    fail("Preview payment schedule", JSON.stringify(previewRes.body));
  }

  const leaseConfirm = await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/confirm`,
    { method: "POST" },
    cookie,
  );
  const confirmed = leaseConfirm.body as {
    status?: string;
    paymentSchedules?: Array<{ installmentNumber: number }>;
  };
  if (leaseConfirm.status === 200 && confirmed.status === "confirmed") {
    pass("Confirm in-house leasing", "ok");
  } else {
    fail("Confirm in-house leasing", JSON.stringify(leaseConfirm.body));
  }

  const scheduleRes = await jsonFetch(
    `/api/sales/orders/${leaseOrder.id}/schedule`,
    {},
    cookie,
  );
  const scheduleBody = scheduleRes.body as {
    schedules?: Array<{
      id: string;
      installmentNumber: number;
      dueDate: string;
      status?: string;
    }>;
  };
  if (
    scheduleRes.status === 200 &&
    scheduleBody.schedules?.length === 12
  ) {
    const firstDue = scheduleBody.schedules[0]?.dueDate;
    pass(
      "Generated payment schedules",
      `12 rows, first due=${firstDue}`,
    );
  } else {
    fail("Generated payment schedules", JSON.stringify(scheduleRes.body));
  }

  const firstScheduleId = scheduleBody.schedules?.[0]?.id;
  if (firstScheduleId) {
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 7);
    await db
      .update(paymentSchedules)
      .set({ dueDate: pastDue })
      .where(eq(paymentSchedules.id, firstScheduleId));

    const overdueRes = await jsonFetch(
      "/api/sales/payment-schedules/mark-overdue",
      { method: "POST" },
      cookie,
    );
    const overdueBody = overdueRes.body as { count?: number };
    if (overdueRes.status === 200 && (overdueBody.count ?? 0) >= 1) {
      pass("Mark overdue schedules", `count=${overdueBody.count}`);
    } else {
      fail("Mark overdue schedules", JSON.stringify(overdueRes.body));
    }

    const scheduleAfter = await jsonFetch(
      `/api/sales/orders/${leaseOrder.id}/schedule`,
      {},
      cookie,
    );
    const afterBody = scheduleAfter.body as {
      schedules?: Array<{ installmentNumber: number; status?: string }>;
    };
    const firstStatus = afterBody.schedules?.[0]?.status;
    if (scheduleAfter.status === 200 && firstStatus === "overdue") {
      pass("First installment overdue", "status=overdue");
    } else {
      fail("First installment overdue", `status=${firstStatus ?? "unknown"}`);
    }
  } else {
    fail("Mark overdue schedules", "missing first schedule id");
  }

  const bankComplete = await jsonFetch(
    `/api/sales/orders/${bankOrder.id}/complete`,
    { method: "POST" },
    cookie,
  );
  const bankCompleted = bankComplete.body as { status?: string };
  if (bankComplete.status === 200 && bankCompleted.status === "completed") {
    pass("Complete bank finance sale", "status=completed");
  } else {
    fail("Complete bank finance sale", JSON.stringify(bankComplete.body));
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
