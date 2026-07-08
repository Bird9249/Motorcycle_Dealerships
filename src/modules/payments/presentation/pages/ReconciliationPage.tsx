import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { formatDateForInput, parseISO } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo } from "react";
import {
  useReconciliationQuery,
  useUpsertReconciliation,
} from "../api/queries";
import { ReconciliationSummary } from "../ui/ReconciliationSummary";

export function ReconciliationPage() {
  const nav = useNavigate({ from: "/app/payments/reconciliation" });
  const search = useSearch({
    from: "/app/payments/reconciliation",
  }) as { date?: string };
  const selectedDate = search.date ?? formatDateForInput(new Date());
  const canReconcile = useActionPermission(["payments:reconcile"]);

  const { data, ...result } = useReconciliationQuery(
    selectedDate,
    !!canReconcile,
  );
  const upsert = useUpsertReconciliation();

  const totalsLabel = useMemo(() => {
    if (!data?.totals) return null;
    const currency = data.rows[0]?.paymentAccount.currency ?? "LAK";
    return {
      expected: formatCurrencyAmount(data.totals.expectedAmount, currency),
      actual: formatCurrencyAmount(data.totals.actualAmount, currency),
    };
  }, [data]);

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              ກວດສອບຍອດທ້າຍວັນ
            </h2>
            <p className="text-muted-foreground text-sm">
              ປຽບທຽບຍອດຈິງກັບການຊຳລະທີ່ຢືນຢັນແລ້ວ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => nav({ to: "/app/payments" })}
            >
              <ArrowLeftIcon className="size-4" />
              ກັບ
            </Button>
            <DatePicker
              mode="single"
              value={parseISO(`${selectedDate}T00:00:00`)}
              onChange={(date) => {
                if (!date) return;
                nav({
                  search: { date: formatDateForInput(date) },
                });
              }}
            />
          </div>
        </div>

        {totalsLabel ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card className="gap-y-0">
              <CardHeader>
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  ຍອດຄາດຫວັງລວມ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-2xl tabular-nums">
                  {totalsLabel.expected}
                </p>
              </CardContent>
            </Card>
            <Card className="gap-y-0">
              <CardHeader>
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  ຍອດຈິງລວມ (ບັນທຶກແລ້ວ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-2xl tabular-nums">
                  {totalsLabel.actual}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <QueryState
          result={result}
          isEmpty={!data?.rows.length}
          emptyMessage="ບໍ່ພົບບັນຊີຮັບເງິນ"
        >
          {data ? (
            <ReconciliationSummary
              rows={data.rows}
              canEdit={!!canReconcile}
              isSaving={upsert.isPending}
              onSave={(items) =>
                upsert.mutate({
                  reconciliationDate: parseISO(`${selectedDate}T00:00:00`),
                  items,
                })
              }
            />
          ) : null}
        </QueryState>
      </Main>
    </>
  );
}
