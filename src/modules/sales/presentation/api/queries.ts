import { toast } from "@/components/kit";
import type {
  CreateCustomerDTO,
  CreateFinanceCompanyDTO,
  CreateSalesOrderDTO,
  CustomersListQueryDTO,
  FinanceCompaniesListQueryDTO,
  PreviewPriceConversionsDTO,
  PreviewScheduleBodyDTO,
  PreviewScheduleStandaloneDTO,
  SalesOrdersListQueryDTO,
  UpdateCustomerDTO,
  UpdateFinanceCompanyDTO,
  UpdateFinanceTransferDTO,
  UpdateSalesOrderDTO,
  UpsertExchangeRatesDTO,
} from "@/modules/sales/domain/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "./client";

export const salesKeys = {
  all: ["sales"] as const,
  orders: (q: Partial<SalesOrdersListQueryDTO>) =>
    ["sales", "orders", q] as const,
  order: (id: string) => ["sales", "order", id] as const,
  schedule: (id: string) => ["sales", "order", id, "schedule"] as const,
  financeCompanies: (q?: FinanceCompaniesListQueryDTO) =>
    ["sales", "finance-companies", q ?? {}] as const,
  exchangeRates: ["sales", "exchange-rates"] as const,
  exchangeRateHistory: ["sales", "exchange-rates", "history"] as const,
  customer: (id: string) => ["sales", "customer", id] as const,
  customers: (q: Partial<CustomersListQueryDTO>) =>
    ["sales", "customers", q] as const,
  pricePreview: (body: PreviewPriceConversionsDTO) =>
    ["sales", "price-preview", body] as const,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "ມີຂໍ້ຜິດພາດ";
}

export function useSalesOrdersQuery(
  query: Partial<SalesOrdersListQueryDTO> = {},
) {
  const q: SalesOrdersListQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
    status: query.status,
    paymentType: query.paymentType,
    customerId: query.customerId,
    vehicleId: query.vehicleId,
    dateField: query.dateField,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
  return useQuery({
    queryKey: salesKeys.orders(q),
    queryFn: () => salesApi.listOrders(q),
  });
}

export function useSalesOrderQuery(id: string) {
  return useQuery({
    queryKey: salesKeys.order(id),
    queryFn: () => salesApi.getOrder(id),
    enabled: !!id,
  });
}

export function usePaymentScheduleQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: salesKeys.schedule(id),
    queryFn: () => salesApi.getSchedule(id),
    enabled: !!id && enabled,
  });
}

export function useFinanceCompaniesQuery(
  query: FinanceCompaniesListQueryDTO = {},
) {
  return useQuery({
    queryKey: salesKeys.financeCompanies(query),
    queryFn: () => salesApi.listFinanceCompanies(query),
  });
}

export function useFinanceCompaniesAdminQuery(
  query: FinanceCompaniesListQueryDTO = { active: "all" },
) {
  return useFinanceCompaniesQuery(query);
}

export function useExchangeRatesQuery() {
  return useQuery({
    queryKey: salesKeys.exchangeRates,
    queryFn: () => salesApi.listExchangeRates(),
  });
}

export function useExchangeRateHistoryQuery() {
  return useQuery({
    queryKey: salesKeys.exchangeRateHistory,
    queryFn: () => salesApi.listExchangeRateHistory(),
  });
}

export function useUpsertExchangeRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertExchangeRatesDTO) =>
      salesApi.upsertExchangeRates(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.exchangeRates });
      qc.invalidateQueries({ queryKey: salesKeys.exchangeRateHistory });
      toast.success("ບັນທຶກອັດຕາແລກປ່ຽນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateFinanceCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFinanceCompanyDTO) =>
      salesApi.createFinanceCompany(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales", "finance-companies"] });
      toast.success("ສ້າງບໍລິສັດໄຟແນນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateFinanceCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFinanceCompanyDTO) =>
      salesApi.updateFinanceCompany(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales", "finance-companies"] });
      toast.success("ອັບເດດບໍລິສັດໄຟແນນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateFinanceCompanyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      salesApi.updateFinanceCompanyStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales", "finance-companies"] });
      toast.success("ອັບເດດສະຖານະສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: salesKeys.customer(id),
    queryFn: () => salesApi.getCustomer(id),
    enabled: !!id,
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerDTO) =>
      salesApi.updateCustomer(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.customer(id) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ອັບເດດລູກຄ້າສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCustomersQuery(query: Partial<CustomersListQueryDTO> = {}) {
  const q: CustomersListQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    q: query.q,
  };
  return useQuery({
    queryKey: salesKeys.customers(q),
    queryFn: () => salesApi.listCustomers(q),
  });
}

export function usePriceConversionsPreviewQuery(
  body: PreviewPriceConversionsDTO,
  enabled: boolean,
) {
  return useQuery({
    queryKey: salesKeys.pricePreview(body),
    queryFn: () => salesApi.previewPriceConversions(body),
    enabled:
      enabled && !!body.amount && Number.parseFloat(String(body.amount)) > 0,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerDTO) => salesApi.createCustomer(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ສ້າງລູກຄ້າສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSalesOrderDTO) => salesApi.createOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ສ້າງຄຳສັ່ງຂາຍສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateSalesOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSalesOrderDTO) => salesApi.updateOrder(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.order(id) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ອັບເດດຄຳສັ່ງຂາຍສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useConfirmSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.confirmOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: salesKeys.order(id) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ຢືນຢັນການຂາຍສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCompleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.completeOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: salesKeys.order(id) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ປິດການຂາຍສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.cancelOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: salesKeys.order(id) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("ຍົກເລີກຄຳສັ່ງຂາຍສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateFinanceTransfer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFinanceTransferDTO) =>
      salesApi.updateFinanceTransfer(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.order(id) });
      toast.success("ອັບເດດສະຖານະຮັບເງິນໄຟແນນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreviewScheduleMutation() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: PreviewScheduleBodyDTO }) =>
      salesApi.previewSchedule(id, body),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreviewScheduleStandaloneMutation() {
  return useMutation({
    mutationFn: (body: PreviewScheduleStandaloneDTO) =>
      salesApi.previewScheduleStandalone(body),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
