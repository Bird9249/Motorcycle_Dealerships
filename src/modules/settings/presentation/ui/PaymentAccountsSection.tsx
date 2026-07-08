import { Button, Input, Modal } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { useClientTable } from "@/modules/master-data/presentation/lib/useClientTable";
import type {
  CreatePaymentAccountDTO,
  UpdatePaymentAccountDTO,
} from "@/modules/payments/domain/contracts";
import type { PaymentAccountItem } from "@/modules/payments/presentation/api/client";
import {
  useCreatePaymentAccount,
  usePaymentAccountsAdminQuery,
  useUpdatePaymentAccount,
  useUpdatePaymentAccountStatus,
} from "@/modules/payments/presentation/api/queries";
import { MasterDataEmptyState } from "@/modules/master-data/presentation/ui/MasterDataEmptyState";
import { LandmarkIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PaymentAccountForm,
  paymentAccountToFormValues,
} from "./PaymentAccountForm";
import { PaymentAccountsTable } from "./PaymentAccountsTable";

export function PaymentAccountsSection() {
  const canUpdate = useActionPermission(["payments:update"]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{
    open: boolean;
    account: PaymentAccountItem | null;
  }>({ open: false, account: null });
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const list = usePaymentAccountsAdminQuery(
    useMemo(
      () => ({ active: "all", ...(search.trim() ? { q: search.trim() } : {}) }),
      [search],
    ),
  );

  const createAccount = useCreatePaymentAccount();
  const updateAccount = useUpdatePaymentAccount(modal.account?.id ?? "");
  const updateStatus = useUpdatePaymentAccountStatus();

  const table = useClientTable(list.data ?? [], "displayOrder");
  const hasFilters = search.trim() !== "";

  return (
    <div className="flex flex-col rounded-xl border bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <p className="text-muted-foreground text-sm">
          ຈັດການບັນຊີຮັບເງິນ — ແຍກຍອດເງິນສົດ ແລະ ໂອນທະນາຄານ ສຳລັບ reconcile ທ້າຍວັນ
        </p>
        {canUpdate ? (
          <Button
            size="sm"
            onClick={() => setModal({ open: true, account: null })}
          >
            <PlusIcon className="size-4" />
            ເພີ່ມບັນຊີ
          </Button>
        ) : null}
      </div>

      <div className="border-b px-4 pb-4">
        <Input
          placeholder="ຄົ້ນຫາຊື່, ທະນາຄານ ຫຼື ເລກບັນຊີ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            table.resetPage();
          }}
          className="max-w-sm"
        />
      </div>

      {!list.isLoading && table.totalCount === 0 ? (
        <MasterDataEmptyState
          icon={LandmarkIcon}
          title="ຍັງບໍ່ມີບັນຊີຮັບເງິນ"
          description="ເພີ່ມບັນຊີເງິນສົດ ຫຼື ທະນາຄານເພື່ອຮັບຊຳລະຈາກລູກຄ້າ."
          hasFilters={hasFilters}
          actionLabel={canUpdate ? "ເພີ່ມບັນຊີ" : undefined}
          onAction={
            canUpdate
              ? () => setModal({ open: true, account: null })
              : undefined
          }
        />
      ) : (
        <PaymentAccountsTable
          data={table.page}
          isLoading={list.isLoading}
          offset={table.offset}
          limit={table.limit}
          totalCount={table.totalCount}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onPaginationChange={table.onPaginationChange}
          onSortingChange={table.onSortingChange}
          onEdit={(account) => setModal({ open: true, account })}
          statusPendingId={statusPendingId}
          onStatusChange={(account, isActive) => {
            setStatusPendingId(account.id);
            updateStatus.mutate(
              { id: account.id, isActive },
              { onSettled: () => setStatusPendingId(null) },
            );
          }}
        />
      )}

      <Modal
        open={modal.open}
        onOpenChange={(open) => {
          if (!open) setModal({ open: false, account: null });
        }}
        title={modal.account ? "ແກ້ໄຂບັນຊີຮັບເງິນ" : "ເພີ່ມບັນຊີຮັບເງິນ"}
        size="sm"
      >
        <PaymentAccountForm
          key={modal.account?.id ?? "new"}
          editing={!!modal.account}
          initialValues={
            modal.account
              ? paymentAccountToFormValues(modal.account)
              : undefined
          }
          submitting={createAccount.isPending || updateAccount.isPending}
          onSubmit={(values) => {
            if (modal.account) {
              updateAccount.mutate(values as UpdatePaymentAccountDTO, {
                onSuccess: () => setModal({ open: false, account: null }),
              });
            } else {
              createAccount.mutate(values as CreatePaymentAccountDTO, {
                onSuccess: () => setModal({ open: false, account: null }),
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
