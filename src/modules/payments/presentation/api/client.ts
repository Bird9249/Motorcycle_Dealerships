import type {
  CreatePaymentAccountDTO,
  CreatePaymentDTO,
  PaymentAccountsListQueryDTO,
  PaymentsListQueryDTO,
  UpdatePaymentAccountDTO,
  UpsertReconciliationDTO,
} from "@/modules/payments/domain/contracts";
import type { OffsetPageDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export type PaymentAccountItem = {
  id: string;
  name: string;
  type: "cash" | "bank_transfer";
  bankName: string | null;
  accountNumber: string | null;
  currency: "LAK" | "THB" | "USD";
  qrCodeImageKey: string | null;
  qrCodeUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentListItem = {
  id: string;
  paymentNumber: string;
  salesOrderId: string | null;
  paymentScheduleId: string | null;
  paymentAccountId: string;
  amount: string;
  currency: "LAK" | "THB" | "USD";
  paymentMethod: "cash" | "bank_transfer";
  paidAt: string;
  status: "pending" | "verified" | "rejected";
  slipImageKey: string | null;
  slipUrl: string | null;
  slipVerified: boolean;
  createdAt: string;
  paymentAccountName: string;
  orderNumber: string | null;
  installmentNumber: number | null;
};

export type PaymentDetail = PaymentListItem & {
  slipVerifiedAt: string | null;
  slipVerifiedBy: string | null;
  notes: string | null;
  recordedBy: string;
  updatedAt: string;
  paymentAccount: {
    id: string;
    name: string;
    type: "cash" | "bank_transfer";
  };
  salesOrder: {
    id: string;
    orderNumber: string;
    customerName: string;
  } | null;
  schedule: {
    id: string;
    installmentNumber: number;
    amount: string;
  } | null;
  recordedByUser: { name: string } | null;
  verifiedByUser: { name: string } | null;
};

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
  reconciledAt: string | null;
  reconciledByUser: { name: string } | null;
};

export type ReconciliationSummary = {
  reconciliationDate: string;
  rows: ReconciliationSummaryRow[];
  totals: {
    expectedAmount: string;
    actualAmount: string;
  };
};

export const paymentsKeys = {
  all: ["payments"] as const,
  list: (query?: Partial<PaymentsListQueryDTO>) =>
    [...paymentsKeys.all, "list", query ?? {}] as const,
  detail: (id: string) => [...paymentsKeys.all, "detail", id] as const,
  accounts: (query?: PaymentAccountsListQueryDTO) =>
    [...paymentsKeys.all, "accounts", query ?? {}] as const,
  account: (id: string) => [...paymentsKeys.all, "account", id] as const,
  pendingCount: () => [...paymentsKeys.all, "pending-count"] as const,
  reconciliation: (date: string) =>
    [...paymentsKeys.all, "reconciliation", date] as const,
};

export const paymentsApi = {
  list(query: Partial<PaymentsListQueryDTO> = {}) {
    const url = new URL(`${config.apiUrl}/payments`);
    if (query.limit != null) url.searchParams.set("limit", String(query.limit));
    if (query.offset != null)
      url.searchParams.set("offset", String(query.offset));
    if (query.status) url.searchParams.set("status", query.status);
    if (query.paymentAccountId)
      url.searchParams.set("paymentAccountId", query.paymentAccountId);
    if (query.salesOrderId)
      url.searchParams.set("salesOrderId", query.salesOrderId);
    if (query.dateFrom)
      url.searchParams.set("dateFrom", String(query.dateFrom));
    if (query.dateTo) url.searchParams.set("dateTo", String(query.dateTo));
    return fetcher.get<OffsetPageDTO<PaymentListItem>>(url.toString());
  },

  get(id: string) {
    return fetcher.get<PaymentDetail>(`${config.apiUrl}/payments/${id}`);
  },

  create(input: CreatePaymentDTO) {
    return fetcher.post<PaymentDetail>(`${config.apiUrl}/payments`, input);
  },

  verify(id: string) {
    return fetcher.post<PaymentDetail>(
      `${config.apiUrl}/payments/${id}/verify`,
      {},
    );
  },

  reject(id: string, reason: string) {
    return fetcher.post<PaymentDetail>(
      `${config.apiUrl}/payments/${id}/reject`,
      { reason },
    );
  },

  pendingCount() {
    return fetcher.get<{ count: number }>(
      `${config.apiUrl}/payments/pending-count`,
    );
  },

  getReconciliation(date: string) {
    const url = new URL(`${config.apiUrl}/payments/reconciliation`);
    url.searchParams.set("date", date);
    return fetcher.get<ReconciliationSummary>(url.toString());
  },

  upsertReconciliation(input: UpsertReconciliationDTO) {
    return fetcher.post<ReconciliationSummary>(
      `${config.apiUrl}/payments/reconciliation`,
      input,
    );
  },

  listAccounts(query: PaymentAccountsListQueryDTO = {}) {
    const url = new URL(`${config.apiUrl}/payments/accounts`);
    if (query.active) url.searchParams.set("active", query.active);
    if (query.q) url.searchParams.set("q", query.q);
    if (query.type) url.searchParams.set("type", query.type);
    return fetcher.get<PaymentAccountItem[]>(url.toString());
  },

  getAccount(id: string) {
    return fetcher.get<PaymentAccountItem>(
      `${config.apiUrl}/payments/accounts/${id}`,
    );
  },

  createAccount(input: CreatePaymentAccountDTO) {
    return fetcher.post<PaymentAccountItem>(
      `${config.apiUrl}/payments/accounts`,
      input,
    );
  },

  updateAccount(id: string, input: UpdatePaymentAccountDTO) {
    return fetcher.put<PaymentAccountItem>(
      `${config.apiUrl}/payments/accounts/${id}`,
      input,
    );
  },

  updateAccountStatus(id: string, isActive: boolean) {
    return fetcher.patch<PaymentAccountItem>(
      `${config.apiUrl}/payments/accounts/${id}/status`,
      { isActive },
    );
  },
};
