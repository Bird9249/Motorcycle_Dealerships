import { useNavigate } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from "@/components/kit";
import { useVehiclesQuery } from "@/modules/inventory/presentation/api/queries";
import type {
  CreateSalesOrderDTO,
  UpdateSalesOrderDTO,
} from "@/modules/sales/domain/contracts";
import type { SalesOrderDetail } from "../api/client";
import {
  useConfirmSalesOrder,
  useCreateCustomer,
  useCreateSalesOrder,
  useCustomersQuery,
  useFinanceCompaniesQuery,
  usePreviewScheduleStandaloneMutation,
  usePriceConversionsPreviewQuery,
  useUpdateSalesOrder,
} from "../api/queries";
import { formatCurrencyAmount, PAYMENT_TYPE_LABELS } from "../lib/labels";
import { CurrencySelect } from "./CurrencySelector";
import { FinancingTypeSelector } from "./FinancingTypeSelector";
import { BankFinanceSection, type BankFinanceValues } from "./BankFinanceSection";
import {
  InHouseLeasingSection,
  type InHouseLeasingValues,
} from "./InHouseLeasingSection";
import { PriceConversionsDisplay } from "./PriceConversionsDisplay";

const STEPS = [
  "ເລືອກລົດ",
  "ລູກຄ້າ",
  "ລາຄາ",
  "ປະເພດຊຳລະ",
  "ຢືນຢັນ",
] as const;

type WizardState = {
  vehicleId: string;
  customerId: string;
  salePrice: string;
  saleCurrency: "LAK" | "THB" | "USD";
  paymentType: "cash" | "bank_finance" | "in_house_leasing";
  notes: string;
  bankFinance?: BankFinanceValues;
  leasing?: InHouseLeasingValues;
};

type SaleFormWizardProps = {
  orderId?: string;
  initialOrder?: SalesOrderDetail;
  onSuccess?: (orderId: string) => void;
};

function orderToState(order: SalesOrderDetail): WizardState {
  const state: WizardState = {
    vehicleId: order.vehicleId,
    customerId: order.customerId,
    salePrice: order.salePrice,
    saleCurrency: order.saleCurrency,
    paymentType: order.paymentType,
    notes: order.notes ?? "",
  };

  if (order.paymentType === "bank_finance" && order.financeCompanyId) {
    state.bankFinance = {
      financeCompanyId: order.financeCompanyId,
      financeApprovedAmount: order.financeApprovedAmount ?? "",
    };
  }

  if (
    order.paymentType === "in_house_leasing" &&
    order.installmentMonths &&
    order.interestRatePercent
  ) {
    state.leasing = {
      downPayment: order.downPayment ?? undefined,
      downPaymentCurrency: order.downPaymentCurrency ?? order.saleCurrency,
      installmentMonths: order.installmentMonths,
      interestRatePercent: order.interestRatePercent,
    };
  }

  return state;
}

export function SaleFormWizard({
  orderId,
  initialOrder,
  onSuccess,
}: SaleFormWizardProps) {
  const nav = useNavigate();
  const isEdit = !!orderId;
  const hydrated = useRef(false);

  const [step, setStep] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "" });
  const [confirmOnSubmit, setConfirmOnSubmit] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    monthlyInstallment: string;
    schedules: Array<{ installmentNumber: number; dueDate: string; amount: string }>;
  } | null>(null);

  const [state, setState] = useState<WizardState>({
    vehicleId: "",
    customerId: "",
    salePrice: "",
    saleCurrency: "LAK",
    paymentType: "cash",
    notes: "",
  });

  useEffect(() => {
    if (initialOrder && !hydrated.current) {
      hydrated.current = true;
      setState(orderToState(initialOrder));
      setCustomerSearch(initialOrder.customer.fullName);
    }
  }, [initialOrder]);

  const vehicles = useVehiclesQuery({ status: "in_stock", limit: 50, offset: 0 });
  const customers = useCustomersQuery({ q: customerSearch, limit: 20, offset: 0 });
  const financeCompanies = useFinanceCompaniesQuery();
  const createCustomer = useCreateCustomer();
  const createOrder = useCreateSalesOrder();
  const updateOrder = useUpdateSalesOrder(orderId ?? "pending");
  const confirmOrder = useConfirmSalesOrder();
  const previewSchedule = usePreviewScheduleStandaloneMutation();

  const pricePreview = usePriceConversionsPreviewQuery(
    { amount: state.salePrice || "0", saleCurrency: state.saleCurrency },
    step >= 2 && !!state.salePrice,
  );

  const selectedVehicle = useMemo(() => {
    if (isEdit && initialOrder) {
      return {
        id: initialOrder.vehicleId,
        brand: { name: initialOrder.vehicle.brandName },
        model: { name: initialOrder.vehicle.modelName },
        chassisNumber: initialOrder.vehicle.chassisNumber,
        listPrice: initialOrder.salePrice,
        listCurrency: initialOrder.saleCurrency,
      };
    }
    return vehicles.data?.data.find((v) => v.id === state.vehicleId);
  }, [isEdit, initialOrder, vehicles.data, state.vehicleId]);

  const selectedCustomer = useMemo(() => {
    if (isEdit && initialOrder && state.customerId === initialOrder.customerId) {
      return initialOrder.customer;
    }
    return customers.data?.data.find((c) => c.id === state.customerId);
  }, [isEdit, initialOrder, customers.data, state.customerId]);

  const canNext = useMemo(() => {
    if (step === 0) return !!state.vehicleId;
    if (step === 1) return !!state.customerId;
    if (step === 2) return !!state.salePrice && Number(state.salePrice) > 0;
    if (step === 3) {
      if (state.paymentType === "bank_finance") {
        return !!state.bankFinance?.financeCompanyId;
      }
      if (state.paymentType === "in_house_leasing") {
        return !!state.leasing?.installmentMonths && !!state.leasing.interestRatePercent;
      }
      return true;
    }
    return true;
  }, [step, state]);

  const buildPayload = useCallback((): CreateSalesOrderDTO => {
    const base: CreateSalesOrderDTO = {
      vehicleId: state.vehicleId,
      customerId: state.customerId,
      salePrice: state.salePrice,
      saleCurrency: state.saleCurrency,
      paymentType: state.paymentType,
      notes: state.notes || null,
    };

    if (state.paymentType === "bank_finance" && state.bankFinance) {
      return {
        ...base,
        financeCompanyId: state.bankFinance.financeCompanyId,
        financeApprovedAmount: state.bankFinance.financeApprovedAmount || null,
      };
    }

    if (state.paymentType === "in_house_leasing" && state.leasing) {
      return {
        ...base,
        downPayment: state.leasing.downPayment || null,
        downPaymentCurrency: state.leasing.downPaymentCurrency ?? state.saleCurrency,
        installmentMonths: state.leasing.installmentMonths,
        interestRatePercent: state.leasing.interestRatePercent,
      };
    }

    return base;
  }, [state]);

  const persistDraft = useCallback(async (): Promise<string> => {
    const payload = buildPayload() as UpdateSalesOrderDTO;

    if (orderId) {
      await updateOrder.mutateAsync(payload);
      return orderId;
    }

    const created = await createOrder.mutateAsync(buildPayload());
    return created.id;
  }, [buildPayload, orderId, updateOrder, createOrder]);

  const handlePreviewSchedule = async () => {
    if (!state.leasing) return;

    try {
      const result = await previewSchedule.mutateAsync({
        salePrice: state.salePrice,
        saleCurrency: state.saleCurrency,
        downPayment: state.leasing.downPayment || null,
        installmentMonths: state.leasing.installmentMonths,
        interestRatePercent: state.leasing.interestRatePercent,
      });
      setPreviewResult({
        monthlyInstallment: result.monthlyInstallment,
        schedules: result.schedules.map((s) => ({
          installmentNumber: s.installmentNumber,
          dueDate: s.dueDate,
          amount: s.amount,
        })),
      });
    } catch {
      // toast handled by mutation
    }
  };

  const handleSubmit = async () => {
    const savedId = await persistDraft();

    if (confirmOnSubmit) {
      await confirmOrder.mutateAsync(savedId);
    }

    onSuccess?.(savedId);
    nav({ to: "/app/sales/$id", params: { id: savedId } });
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.fullName || !newCustomer.phone) return;
    const created = await createCustomer.mutateAsync(newCustomer);
    setState((s) => ({ ...s, customerId: created.id }));
  };

  const isSaving =
    createOrder.isPending || updateOrder.isPending || confirmOrder.isPending;

  const submitLabel = confirmOnSubmit
    ? isSaving
      ? "ກຳລັງຢືນຢັນ..."
      : "ບັນທຶກແລະຢືນຢັນ"
    : isSaving
      ? "ກຳລັງບັນທຶກ..."
      : isEdit
        ? "ບັນທຶກການປ່ຽນແປງ"
        : "ສ້າງຄຳສັ່ງຂາຍ (draft)";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <div className="grid gap-2">
              {isEdit && selectedVehicle ? (
                <div className="rounded-lg border border-primary bg-primary/5 p-3 text-sm">
                  <div className="font-medium">
                    {selectedVehicle.brand.name} {selectedVehicle.model.name}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedVehicle.chassisNumber ?? "—"} ·{" "}
                    {selectedVehicle.listPrice} {selectedVehicle.listCurrency}
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    ບໍ່ສາມາດປ່ຽນລົດໃນ draft ທີ່ສ້າງແລ້ວ
                  </p>
                </div>
              ) : vehicles.isLoading ? (
                <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
              ) : (
                vehicles.data?.data.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, vehicleId: v.id }))}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      state.vehicleId === v.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">
                      {v.brand.name} {v.model.name}
                    </div>
                    <div className="text-muted-foreground">
                      {v.chassisNumber ?? "—"} · {v.listPrice} {v.listCurrency}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ຄົ້ນຫາລູກຄ້າ</Label>
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="ຊື່ ຫຼື ເບີໂທ"
                />
              </div>
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {customers.data?.data.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, customerId: c.id }))}
                    className={`rounded-lg border p-3 text-left text-sm ${
                      state.customerId === c.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{c.fullName}</div>
                    <div className="text-muted-foreground">{c.phone}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-dashed p-4">
                <p className="mb-3 font-medium text-sm">ສ້າງລູກຄ້າໃໝ່</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="ຊື່-ນາມສະກຸນ"
                    value={newCustomer.fullName}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, fullName: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="ເບີໂທ"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, phone: e.target.value }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={handleCreateCustomer}
                  disabled={createCustomer.isPending}
                >
                  ບັນທຶກລູກຄ້າ
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>ລາຄາຂາຍ</Label>
                  <Input
                    value={state.salePrice}
                    onChange={(e) =>
                      setState((s) => ({ ...s, salePrice: e.target.value }))
                    }
                    placeholder="6500000"
                  />
                </div>
                <CurrencySelect
                  value={state.saleCurrency}
                  onChange={(saleCurrency) =>
                    setState((s) => ({ ...s, saleCurrency }))
                  }
                />
              </div>
              {pricePreview.data ? (
                <PriceConversionsDisplay
                  conversions={pricePreview.data.conversions.map((c) => ({
                    currency: c.currency as "LAK" | "THB" | "USD",
                    amount: c.amount,
                    isPrimary: c.isPrimary,
                  }))}
                  exchangeRateUsed={pricePreview.data.exchangeRateUsed}
                  rateEffectiveDate={pricePreview.data.rateEffectiveDate}
                  saleCurrency={state.saleCurrency}
                />
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <FinancingTypeSelector
                value={state.paymentType}
                onChange={(paymentType) => {
                  setPreviewResult(null);
                  setState((s) => ({ ...s, paymentType }));
                }}
              />
              {state.paymentType === "bank_finance" ? (
                <BankFinanceSection
                  companies={financeCompanies.data ?? []}
                  defaultValues={state.bankFinance}
                  onChange={(bankFinance) =>
                    setState((s) => ({ ...s, bankFinance }))
                  }
                />
              ) : null}
              {state.paymentType === "in_house_leasing" ? (
                <InHouseLeasingSection
                  defaultValues={state.leasing}
                  onChange={(leasing) => {
                    setPreviewResult(null);
                    setState((s) => ({ ...s, leasing }));
                  }}
                  onPreview={handlePreviewSchedule}
                  previewLoading={previewSchedule.isPending}
                  previewResult={previewResult}
                />
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">ລົດ:</span>{" "}
                  {selectedVehicle
                    ? `${selectedVehicle.brand.name} ${selectedVehicle.model.name}`
                    : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">ລູກຄ້າ:</span>{" "}
                  {selectedCustomer?.fullName ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">ລາຄາ:</span>{" "}
                  {formatCurrencyAmount(state.salePrice, state.saleCurrency)}
                </p>
                <p>
                  <span className="text-muted-foreground">ປະເພດ:</span>{" "}
                  {PAYMENT_TYPE_LABELS[state.paymentType]}
                </p>
                {previewResult ? (
                  <p>
                    <span className="text-muted-foreground">ຄ່າງວດ/ເດືອນ:</span>{" "}
                    {Number(previewResult.monthlyInstallment).toLocaleString()}{" "}
                    {state.saleCurrency}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox
                  id="confirm-on-submit"
                  checked={confirmOnSubmit}
                  onCheckedChange={(v) => setConfirmOnSubmit(v === true)}
                />
                <Label htmlFor="confirm-on-submit" className="cursor-pointer">
                  ຢືນຢັນການຂາຍທັນທີ (ລົດຈະຖືກປ່ຽນເປັນຂາຍແລ້ວ)
                </Label>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeftIcon className="size-4" />
          ກັບ
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            ຕໍ່ໄປ
            <ChevronRightIcon className="size-4" />
          </Button>
        ) : (
          <Button type="button" disabled={isSaving} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
