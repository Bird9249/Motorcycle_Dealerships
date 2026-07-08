import type {
  CreateCustomerDTO,
  CreateExchangeRateDTO,
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
import type { OffsetPageDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export type SalesOrderListItem = {
  id: string;
  orderNumber: string;
  vehicleId: string;
  customerId: string;
  salePrice: string;
  saleCurrency: "LAK" | "THB" | "USD";
  paymentType: "cash" | "bank_finance" | "in_house_leasing";
  status: "draft" | "confirmed" | "completed" | "cancelled";
  soldAt: string | null;
  createdAt: string;
  customer: { id: string; fullName: string; phone: string };
  vehicle: {
    id: string;
    status: string;
    chassisNumber: string | null;
    modelName: string;
    brandName: string;
    colorName: string;
  };
  financeCompany: { id: string; name: string; code: string } | null;
};

export type SalesOrderDetail = SalesOrderListItem & {
  exchangeRateUsed: string | null;
  financeApprovedAmount: string | null;
  financeTransferReceived: boolean;
  financeTransferDate: string | null;
  downPayment: string | null;
  downPaymentCurrency: "LAK" | "THB" | "USD" | null;
  installmentMonths: number | null;
  interestRatePercent: string | null;
  monthlyInstallment: string | null;
  notes: string | null;
  salesperson: { id: string; name: string };
  paymentSchedules: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: string;
    currency: string;
    status: string;
  }>;
  priceConversions?: {
    salePrice: string;
    saleCurrency: string;
    exchangeRateUsed: string | null;
    rateEffectiveDate: string | null;
    conversions: Array<{
      currency: string;
      amount: string;
      isPrimary: boolean;
    }>;
  };
};

export type CustomerItem = {
  id: string;
  fullName: string;
  phone: string;
  phoneSecondary: string | null;
  village: string | null;
  district: string | null;
  province: string | null;
  idCardNumber: string | null;
  householdBookNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = CustomerItem & {
  salesOrders: SalesOrderListItem[];
  salesOrderCount: number;
};

export type ExchangeRateItem = {
  id: string;
  baseCurrency: "LAK" | "THB" | "USD";
  targetCurrency: "LAK" | "THB" | "USD";
  rate: string;
  effectiveDate: string;
  createdAt?: string;
};

export type FinanceCompanyItem = {
  id: string;
  name: string;
  code: string;
  contactPhone: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type PaymentScheduleItem = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  paidAmount: string | null;
};

function buildListUrl(base: string, query: SalesOrdersListQueryDTO) {
  const url = new URL(base);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
  if (query.filters)
    url.searchParams.set("filters", JSON.stringify(query.filters));
  if (query.status) url.searchParams.set("status", query.status);
  if (query.paymentType) url.searchParams.set("paymentType", query.paymentType);
  if (query.customerId) url.searchParams.set("customerId", query.customerId);
  if (query.vehicleId) url.searchParams.set("vehicleId", query.vehicleId);
  if (query.dateField) url.searchParams.set("dateField", query.dateField);
  if (query.dateFrom) url.searchParams.set("dateFrom", query.dateFrom);
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  return url.toString();
}

export const salesApi = {
  listOrders(query: SalesOrdersListQueryDTO) {
    return fetcher.get<OffsetPageDTO<SalesOrderListItem>>(
      buildListUrl(`${config.apiUrl}/sales/orders`, query),
    );
  },

  getOrder(id: string) {
    return fetcher.get<SalesOrderDetail>(`${config.apiUrl}/sales/orders/${id}`);
  },

  createOrder(input: CreateSalesOrderDTO) {
    return fetcher.post<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders`,
      input,
    );
  },

  updateOrder(id: string, input: UpdateSalesOrderDTO) {
    return fetcher.put<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders/${id}`,
      input,
    );
  },

  confirmOrder(id: string) {
    return fetcher.post<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders/${id}/confirm`,
      {},
    );
  },

  completeOrder(id: string) {
    return fetcher.post<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders/${id}/complete`,
      {},
    );
  },

  cancelOrder(id: string) {
    return fetcher.post<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders/${id}/cancel`,
      {},
    );
  },

  getSchedule(id: string) {
    return fetcher.get<{ orderId: string; schedules: PaymentScheduleItem[] }>(
      `${config.apiUrl}/sales/orders/${id}/schedule`,
    );
  },

  previewSchedule(id: string, body: PreviewScheduleBodyDTO = {}) {
    return fetcher.post<{
      monthlyInstallment: string;
      totalFinanced: string;
      totalInterest: string;
      schedules: Array<{
        installmentNumber: number;
        dueDate: string;
        amount: string;
        currency: string;
        status: string;
      }>;
    }>(`${config.apiUrl}/sales/orders/${id}/schedule/preview`, body);
  },

  previewScheduleStandalone(body: PreviewScheduleStandaloneDTO) {
    return fetcher.post<{
      monthlyInstallment: string;
      totalFinanced: string;
      totalInterest: string;
      schedules: Array<{
        installmentNumber: number;
        dueDate: string;
        amount: string;
        currency: string;
        status: string;
      }>;
    }>(`${config.apiUrl}/sales/schedule/preview`, body);
  },

  updateFinanceTransfer(id: string, input: UpdateFinanceTransferDTO) {
    return fetcher.patch<SalesOrderDetail>(
      `${config.apiUrl}/sales/orders/${id}/finance-transfer`,
      input,
    );
  },

  listFinanceCompanies(query: FinanceCompaniesListQueryDTO = {}) {
    const url = new URL(`${config.apiUrl}/sales/finance-companies`);
    if (query.active) url.searchParams.set("active", query.active);
    if (query.q) url.searchParams.set("q", query.q);
    return fetcher.get<FinanceCompanyItem[]>(url.toString());
  },

  createFinanceCompany(input: CreateFinanceCompanyDTO) {
    return fetcher.post<FinanceCompanyItem>(
      `${config.apiUrl}/sales/finance-companies`,
      input,
    );
  },

  updateFinanceCompany(id: string, input: UpdateFinanceCompanyDTO) {
    return fetcher.put<FinanceCompanyItem>(
      `${config.apiUrl}/sales/finance-companies/${id}`,
      input,
    );
  },

  updateFinanceCompanyStatus(id: string, isActive: boolean) {
    return fetcher.patch<FinanceCompanyItem>(
      `${config.apiUrl}/sales/finance-companies/${id}/status`,
      { isActive },
    );
  },

  listCustomers(query: CustomersListQueryDTO) {
    const url = new URL(`${config.apiUrl}/sales/customers`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.q) url.searchParams.set("q", query.q);
    return fetcher.get<OffsetPageDTO<CustomerItem>>(url.toString());
  },

  getCustomer(id: string) {
    return fetcher.get<CustomerDetail>(`${config.apiUrl}/sales/customers/${id}`);
  },

  createCustomer(input: CreateCustomerDTO) {
    return fetcher.post<CustomerItem>(
      `${config.apiUrl}/sales/customers`,
      input,
    );
  },

  updateCustomer(id: string, input: UpdateCustomerDTO) {
    return fetcher.put<CustomerItem>(
      `${config.apiUrl}/sales/customers/${id}`,
      input,
    );
  },

  deleteCustomer(id: string) {
    return fetcher.delete<CustomerItem>(
      `${config.apiUrl}/sales/customers/${id}`,
    );
  },

  listExchangeRates() {
    return fetcher.get<ExchangeRateItem[]>(
      `${config.apiUrl}/sales/exchange-rates`,
    );
  },

  listExchangeRateHistory() {
    return fetcher.get<ExchangeRateItem[]>(
      `${config.apiUrl}/sales/exchange-rates/history`,
    );
  },

  upsertExchangeRates(input: UpsertExchangeRatesDTO) {
    return fetcher.put<ExchangeRateItem[]>(
      `${config.apiUrl}/sales/exchange-rates`,
      input,
    );
  },

  previewPriceConversions(body: PreviewPriceConversionsDTO) {
    return fetcher.post<NonNullable<SalesOrderDetail["priceConversions"]>>(
      `${config.apiUrl}/sales/price-conversions/preview`,
      body,
    );
  },

  getPriceConversions(id: string) {
    return fetcher.get<NonNullable<SalesOrderDetail["priceConversions"]>>(
      `${config.apiUrl}/sales/orders/${id}/price-conversions`,
    );
  },
};
