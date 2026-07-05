import { Button, Input, Modal } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type {
  CreateFinanceCompanyDTO,
  UpdateFinanceCompanyDTO,
} from "@/modules/sales/domain/contracts";
import type { FinanceCompanyItem } from "@/modules/sales/presentation/api/client";
import {
  useCreateFinanceCompany,
  useFinanceCompaniesAdminQuery,
  useUpdateFinanceCompany,
  useUpdateFinanceCompanyStatus,
} from "@/modules/sales/presentation/api/queries";
import { BuildingIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useClientTable } from "../lib/useClientTable";
import { FinanceCompaniesTable } from "./FinanceCompaniesTable";
import {
  FinanceCompanyForm,
  financeCompanyToFormValues,
} from "./FinanceCompanyForm";
import { MasterDataEmptyState } from "./MasterDataEmptyState";

export function FinanceCompaniesTab() {
  const canCreate = useActionPermission(["sales:create"]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{
    open: boolean;
    company: FinanceCompanyItem | null;
  }>({ open: false, company: null });
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const list = useFinanceCompaniesAdminQuery(
    useMemo(
      () => ({ active: "all", ...(search.trim() ? { q: search.trim() } : {}) }),
      [search],
    ),
  );

  const createCompany = useCreateFinanceCompany();
  const updateCompany = useUpdateFinanceCompany(modal.company?.id ?? "");
  const updateStatus = useUpdateFinanceCompanyStatus();

  const table = useClientTable(list.data ?? [], "name");
  const hasFilters = search.trim() !== "";

  return (
    <div className="flex flex-col rounded-xl border bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <p className="text-muted-foreground text-sm">
          ຈັດການບໍລິສັດໄຟແນນພາຍນອກ — ໃຊ້ໃນການຂາຍແບບ bank finance
        </p>
        {canCreate ? (
          <Button
            size="sm"
            onClick={() => setModal({ open: true, company: null })}
          >
            <PlusIcon className="size-4" />
            ເພີ່ມບໍລິສັດ
          </Button>
        ) : null}
      </div>

      <div className="border-b px-4 pb-4">
        <Input
          placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ..."
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
          icon={BuildingIcon}
          title="ຍັງບໍ່ມີບໍລິສັດໄຟແນນ"
          description="ເພີ່ມບໍລິສັດເພື່ອໃຊ້ໃນການຂາຍແບບໄຟແນນ."
          hasFilters={hasFilters}
          actionLabel={canCreate ? "ເພີ່ມບໍລິສັດ" : undefined}
          onAction={
            canCreate
              ? () => setModal({ open: true, company: null })
              : undefined
          }
        />
      ) : (
        <FinanceCompaniesTable
          data={table.page}
          isLoading={list.isLoading}
          offset={table.offset}
          limit={table.limit}
          totalCount={table.totalCount}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onPaginationChange={table.onPaginationChange}
          onSortingChange={table.onSortingChange}
          onEdit={(company) => setModal({ open: true, company })}
          statusPendingId={statusPendingId}
          onStatusChange={(company, isActive) => {
            setStatusPendingId(company.id);
            updateStatus.mutate(
              { id: company.id, isActive },
              { onSettled: () => setStatusPendingId(null) },
            );
          }}
        />
      )}

      <Modal
        open={modal.open}
        onOpenChange={(open) => {
          if (!open) setModal({ open: false, company: null });
        }}
        title={modal.company ? "ແກ້ໄຂບໍລິສັດໄຟແນນ" : "ເພີ່ມບໍລິສັດໄຟແນນ"}
        size="sm"
      >
        <FinanceCompanyForm
          key={modal.company?.id ?? "new"}
          editing={!!modal.company}
          initialValues={
            modal.company
              ? financeCompanyToFormValues(modal.company)
              : undefined
          }
          submitting={createCompany.isPending || updateCompany.isPending}
          onSubmit={(values) => {
            if (modal.company) {
              updateCompany.mutate(values as UpdateFinanceCompanyDTO, {
                onSuccess: () => setModal({ open: false, company: null }),
              });
            } else {
              createCompany.mutate(values as CreateFinanceCompanyDTO, {
                onSuccess: () => setModal({ open: false, company: null }),
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
