import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/kit";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { useEffect, useMemo, useState } from "react";
import type { ReconciliationSummaryRow } from "../api/client";
import {
  PAYMENT_ACCOUNT_TYPE_LABELS,
  RECONCILIATION_STATUS_LABELS,
  type ReconciliationStatus,
} from "../lib/labels";

const STATUS_VARIANTS: Record<
  ReconciliationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "outline",
  balanced: "default",
  discrepancy: "destructive",
};

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDiff(expected: string, actual: string): string {
  const diff = parseMoney(actual) - parseMoney(expected);
  const prefix = diff > 0 ? "+" : "";
  return `${prefix}${diff.toFixed(2)}`;
}

function previewStatus(
  expected: string,
  actual: string,
): ReconciliationStatus {
  if (!actual.trim()) return "open";
  if (Math.abs(parseMoney(actual) - parseMoney(expected)) < 0.01) {
    return "balanced";
  }
  return "discrepancy";
}

type ReconciliationSummaryProps = {
  rows: ReconciliationSummaryRow[];
  canEdit: boolean;
  isSaving?: boolean;
  onSave: (
    items: Array<{
      paymentAccountId: string;
      actualAmount: string;
    }>,
  ) => void;
};

export function ReconciliationSummary({
  rows,
  canEdit,
  isSaving,
  onSave,
}: ReconciliationSummaryProps) {
  const initialDraft = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row) => [row.paymentAccountId, row.actualAmount ?? ""]),
      ),
    [rows],
  );
  const [draft, setDraft] = useState<Record<string, string>>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const filledItems = rows
    .map((row) => ({
      paymentAccountId: row.paymentAccountId,
      actualAmount: draft[row.paymentAccountId]?.trim() ?? "",
    }))
    .filter((item) => item.actualAmount !== "");

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ບັນຊີ</TableHead>
              <TableHead>ປະເພດ</TableHead>
              <TableHead className="text-right">ຍອດຄາດຫວັງ</TableHead>
              <TableHead className="text-right">ຍອດຈິງ</TableHead>
              <TableHead className="text-right">ຜົນຕ່າງ</TableHead>
              <TableHead>ສະຖານະ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const actualDraft = draft[row.paymentAccountId] ?? "";
              const status = actualDraft.trim()
                ? previewStatus(row.expectedAmount, actualDraft)
                : row.status;

              return (
                <TableRow key={row.paymentAccountId}>
                  <TableCell>
                    <div className="font-medium">{row.paymentAccount.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.paymentAccount.currency}
                    </div>
                  </TableCell>
                  <TableCell>
                    {PAYMENT_ACCOUNT_TYPE_LABELS[row.paymentAccount.type]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrencyAmount(
                      row.expectedAmount,
                      row.paymentAccount.currency,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="ml-auto w-36 text-right tabular-nums"
                        value={actualDraft}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [row.paymentAccountId]: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="tabular-nums">
                        {row.actualAmount
                          ? formatCurrencyAmount(
                              row.actualAmount,
                              row.paymentAccount.currency,
                            )
                          : "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {actualDraft.trim() || row.difference ? (
                      formatDiff(
                        row.expectedAmount,
                        actualDraft.trim() || row.actualAmount || "0",
                      )
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[status]}>
                      {RECONCILIATION_STATUS_LABELS[status]}
                    </Badge>
                    {row.reconciledAt ? (
                      <div className="mt-1 text-muted-foreground text-xs">
                        {formatDateTimeLocal(row.reconciledAt)}
                        {row.reconciledByUser
                          ? ` · ${row.reconciledByUser.name}`
                          : ""}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {canEdit ? (
        <div className="flex justify-end">
          <Button
            disabled={isSaving || filledItems.length === 0}
            onClick={() => onSave(filledItems)}
          >
            ບັນທຶກການກວດສອບຍອດ
          </Button>
        </div>
      ) : null}
    </div>
  );
}
