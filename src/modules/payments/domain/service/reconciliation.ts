import { AppError } from "@/shared/errors";
import { nowDate, toDateOnlyString } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpsertReconciliationDTO } from "../contracts/reconciliation";
import {
  listReconciliationsByDate,
  upsertReconciliationRow,
} from "../repo/daily-reconciliations";
import { listPaymentAccounts } from "../repo/payment-accounts";
import { sumVerifiedAmountsByAccountForDay } from "../repo/payments";

function parseMoney(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function getLocalDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function computeStatus(
  expected: number,
  actual: number | null,
): "open" | "balanced" | "discrepancy" {
  if (actual === null) return "open";
  if (Math.abs(actual - expected) < 0.01) return "balanced";
  return "discrepancy";
}

export type ReconciliationSummaryRow = {
  paymentAccountId: string;
  paymentAccount: {
    id: string;
    name: string;
    type: "cash" | "bank_transfer";
    currency: "LAK" | "THB" | "USD";
  };
  expectedAmount: string;
  actualAmount: string | null;
  difference: string | null;
  status: "open" | "balanced" | "discrepancy";
  notes: string | null;
  reconciliationId: string | null;
  reconciledAt: Date | null;
  reconciledByUser: { name: string } | null;
};

export async function getReconciliationSummary(
  client: DbTransaction,
  reconciliationDate: Date,
) {
  const { start, end } = getLocalDayRange(reconciliationDate);
  const [accounts, expectedByAccount, savedRows] = await Promise.all([
    listPaymentAccounts({ active: "true" }, client),
    sumVerifiedAmountsByAccountForDay(start, end, client),
    listReconciliationsByDate(reconciliationDate, client),
  ]);

  const savedByAccount = Object.fromEntries(
    savedRows.map((row) => [row.paymentAccountId, row]),
  );

  const rows: ReconciliationSummaryRow[] = accounts.map((account) => {
    const expected = parseMoney(expectedByAccount[account.id] ?? "0");
    const saved = savedByAccount[account.id];
    const actual = saved?.actualAmount
      ? parseMoney(saved.actualAmount)
      : null;

    return {
      paymentAccountId: account.id,
      paymentAccount: {
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
      },
      expectedAmount: formatMoney(expected),
      actualAmount: saved?.actualAmount ?? null,
      difference: saved?.difference ?? null,
      status: saved?.status ?? computeStatus(expected, actual),
      notes: saved?.notes ?? null,
      reconciliationId: saved?.id ?? null,
      reconciledAt: saved?.reconciledAt ?? null,
      reconciledByUser: saved?.reconciledByUser ?? null,
    };
  });

  return {
    reconciliationDate: toDateOnlyString(reconciliationDate),
    rows,
    totals: {
      expectedAmount: formatMoney(
        rows.reduce((sum, row) => sum + parseMoney(row.expectedAmount), 0),
      ),
      actualAmount: formatMoney(
        rows.reduce(
          (sum, row) =>
            sum + (row.actualAmount ? parseMoney(row.actualAmount) : 0),
          0,
        ),
      ),
    },
  };
}

export async function upsertReconciliationService(
  client: DbTransaction,
  params: { input: UpsertReconciliationDTO; reconciledBy: string },
) {
  const { input, reconciledBy } = params;
  const { start, end } = getLocalDayRange(input.reconciliationDate);
  const expectedByAccount = await sumVerifiedAmountsByAccountForDay(
    start,
    end,
    client,
  );

  const accounts = await listPaymentAccounts({ active: "all" }, client);
  const accountIds = new Set(accounts.map((a) => a.id));
  const now = nowDate();
  const upserted = [];

  for (const item of input.items) {
    if (!accountIds.has(item.paymentAccountId)) {
      throw new AppError("NOT_FOUND", "Payment account not found");
    }

    const expected = parseMoney(
      expectedByAccount[item.paymentAccountId] ?? "0",
    );
    const actual = parseMoney(item.actualAmount);
    const difference = actual - expected;
    const status = computeStatus(expected, actual);

    const row = await upsertReconciliationRow(
      {
        reconciliationDate: input.reconciliationDate,
        paymentAccountId: item.paymentAccountId,
        expectedAmount: formatMoney(expected),
        actualAmount: formatMoney(actual),
        difference: formatMoney(difference),
        status,
        notes: item.notes ?? null,
        reconciledBy,
        reconciledAt: now,
        updatedAt: now,
      },
      client,
    );

    if (row) upserted.push(row);
  }

  const summary = await getReconciliationSummary(
    client,
    input.reconciliationDate,
  );

  return { upserted, summary };
}
