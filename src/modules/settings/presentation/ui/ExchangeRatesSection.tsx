import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import {
  useExchangeRateHistoryQuery,
  useExchangeRatesQuery,
  useUpsertExchangeRates,
} from "@/modules/sales/presentation/api/queries";
import { formatDateLocal } from "@/shared/lib/date-time";
import { ExchangeRateForm } from "./ExchangeRateForm";
import { ExchangeRateHistory } from "./ExchangeRateHistory";

export function ExchangeRatesSection() {
  const latest = useExchangeRatesQuery();
  const history = useExchangeRateHistoryQuery();
  const upsertRates = useUpsertExchangeRates();
  const canUpdate = useActionPermission(["sales:update"]);

  const latestEffectiveDate = useMemo(() => {
    if (!latest.data?.length) return undefined;
    return latest.data
      .map((r) => r.effectiveDate.slice(0, 10))
      .sort()
      .reverse()[0];
  }, [latest.data]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ອັດຕາແລກປ່ຽນລ່າສຸດ</CardTitle>
          <CardDescription>
            1 USD → LAK / THB — ໃຊ້ຄຳນວນລາຄາຂາຍຫຼາຍສະກຸນເງິນ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latest.isLoading ? (
            <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {latest.data?.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border bg-muted/20 p-4 text-sm"
                >
                  <p className="font-medium">
                    1 {row.baseCurrency} = {Number(row.rate).toLocaleString()}{" "}
                    {row.targetCurrency}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    ມີຜົນ {formatDateLocal(row.effectiveDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canUpdate ? (
        <Card>
          <CardHeader>
            <CardTitle>ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ</CardTitle>
            <CardDescription>
              ບັນທຶກ USD→LAK ແລະ USD→THB ພ້ອມກັນ (upsert ຕາມວັນທີ)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExchangeRateForm
              key={latest.data?.map((r) => r.id).join("-") ?? "loading"}
              latestRates={latest.data}
              historyRates={history.data}
              submitting={upsertRates.isPending}
              onSubmit={(values) => upsertRates.mutate(values)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ປະຫວັດອັດຕາ</CardTitle>
          <CardDescription>
            ຈັດກຸ່ມຕາມວັນທີ — ແຕ່ລະວັນເຫັນອັດຕາ LAK ແລະ THB ຄູ່ກັນ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExchangeRateHistory
            data={history.data}
            isLoading={history.isLoading}
            latestEffectiveDate={latestEffectiveDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
