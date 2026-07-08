import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreatePaymentAccountDTO,
  CreatePaymentDTO,
  PaymentAccountsListQueryDTO,
  PaymentsListQueryDTO,
  UpdatePaymentAccountDTO,
  UpsertReconciliationDTO,
} from "@/modules/payments/domain/contracts";
import { paymentsApi, paymentsKeys } from "./client";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "ມີຂໍ້ຜິດພາດ";
}

export function usePaymentsQuery(
  query: Partial<PaymentsListQueryDTO> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: paymentsKeys.list(query),
    queryFn: () => paymentsApi.list(query),
    enabled,
  });
}

export function usePaymentQuery(id: string) {
  return useQuery({
    queryKey: paymentsKeys.detail(id),
    queryFn: () => paymentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentDTO) => paymentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ບັນທຶກການຊຳລະສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.verify(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: paymentsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ຢືນຢັນສລິບສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      paymentsApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: paymentsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ປະຕິເສດສລິບສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePendingPaymentsCountQuery(enabled = true) {
  return useQuery({
    queryKey: paymentsKeys.pendingCount(),
    queryFn: () => paymentsApi.pendingCount(),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useReconciliationQuery(date: string, enabled = true) {
  return useQuery({
    queryKey: paymentsKeys.reconciliation(date),
    queryFn: () => paymentsApi.getReconciliation(date),
    enabled: enabled && !!date,
  });
}

export function useUpsertReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertReconciliationDTO) =>
      paymentsApi.upsertReconciliation(input),
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: paymentsKeys.reconciliation(data.reconciliationDate),
      });
      toast.success("ບັນທຶກການກວດສອບຍອດສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePaymentAccountsQuery(
  query: PaymentAccountsListQueryDTO = { active: "true" },
) {
  return useQuery({
    queryKey: paymentsKeys.accounts(query),
    queryFn: () => paymentsApi.listAccounts(query),
  });
}

export function usePaymentAccountsAdminQuery(
  query: PaymentAccountsListQueryDTO = { active: "all" },
) {
  return usePaymentAccountsQuery(query);
}

export function useCreatePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentAccountDTO) =>
      paymentsApi.createAccount(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ເພີ່ມບັນຊີຮັບເງິນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePaymentAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePaymentAccountDTO) =>
      paymentsApi.updateAccount(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ບັນທຶກບັນຊີຮັບເງິນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePaymentAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      paymentsApi.updateAccountStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("ອັບເດດສະຖານະບັນຊີສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
