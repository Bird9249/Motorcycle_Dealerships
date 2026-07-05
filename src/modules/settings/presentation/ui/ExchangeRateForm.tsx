import {
  Button,
  FormActions,
  FormDatePicker,
  FormInput,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import type { UpsertExchangeRatesDTO } from "@/modules/sales/domain/contracts";
import type { ExchangeRateItem } from "@/modules/sales/presentation/api/client";
import { useEffect, useMemo } from "react";
import { z } from "zod";

const schema = z.object({
  effectiveDate: z.string().min(1, "ຕ້ອງເລືອກວັນທີ"),
  lakRate: z.string().trim().min(1, "ຕ້ອງໃສ່ອັດຕາ LAK"),
  thbRate: z.string().trim().min(1, "ຕ້ອງໃສ່ອັດຕາ THB"),
});

type ExchangeRateFormProps = {
  latestRates?: ExchangeRateItem[];
  historyRates?: ExchangeRateItem[];
  onSubmit: (values: UpsertExchangeRatesDTO) => void;
  submitting?: boolean;
};

function ratesForDate(
  rates: ExchangeRateItem[] | undefined,
  date: string,
): { lakRate: string; thbRate: string } {
  const lak = rates?.find(
    (r) => r.targetCurrency === "LAK" && r.effectiveDate.slice(0, 10) === date,
  );
  const thb = rates?.find(
    (r) => r.targetCurrency === "THB" && r.effectiveDate.slice(0, 10) === date,
  );
  return {
    lakRate: lak?.rate ?? "",
    thbRate: thb?.rate ?? "",
  };
}

export function ExchangeRateForm({
  latestRates,
  historyRates,
  onSubmit,
  submitting,
}: ExchangeRateFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const latestLak = latestRates?.find((r) => r.targetCurrency === "LAK");
  const latestThb = latestRates?.find((r) => r.targetCurrency === "THB");

  const defaultValues = useMemo(
    () => ({
      effectiveDate: today,
      lakRate: latestLak?.rate ?? "",
      thbRate: latestThb?.rate ?? "",
    }),
    [today, latestLak?.rate, latestThb?.rate],
  );

  const methods = RHF.useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const effectiveDate = RHF.useWatch({
    control: methods.control,
    name: "effectiveDate",
  });

  useEffect(() => {
    if (!effectiveDate) return;
    const dateKey = effectiveDate.slice(0, 10);
    const forDate = ratesForDate(historyRates, dateKey);
    if (forDate.lakRate || forDate.thbRate) {
      methods.setValue("lakRate", forDate.lakRate);
      methods.setValue("thbRate", forDate.thbRate);
      return;
    }
    methods.setValue("lakRate", latestLak?.rate ?? "");
    methods.setValue("thbRate", latestThb?.rate ?? "");
  }, [effectiveDate, historyRates, latestLak?.rate, latestThb?.rate, methods]);

  return (
    <FormRoot<z.infer<typeof schema>>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          effectiveDate: vals.effectiveDate.slice(0, 10),
          lakRate: vals.lakRate,
          thbRate: vals.thbRate,
        })
      }
    >
      <FormDatePicker name="effectiveDate" label="ວັນທີມີຜົນ" requiredMark />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          name="lakRate"
          label="1 USD = ? LAK"
          requiredMark
          placeholder="21000"
        />
        <FormInput
          name="thbRate"
          label="1 USD = ? THB"
          requiredMark
          placeholder="35.5"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        ບັນທຶກທັງຄູ່ LAK ແລະ THB ພ້ອມກັນ — ຖ້າມີວັນທີນີ້ແລ້ວຈະອັບເດດອັດຕາ
      </p>
      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກອັດຕາ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
