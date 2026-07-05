import { PlusIcon, TagIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Modal } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type {
  BrandDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
} from "@/modules/master-data/domain/contracts";
import type { ActiveFilter } from "@/modules/master-data/domain/contracts/common";
import {
  useBrandsMasterQuery,
  useCreateBrand,
  useUpdateBrand,
  useUpdateBrandStatus,
} from "../api/queries";
import { confirmDeactivate } from "../lib/confirm-deactivate";
import { useClientTable } from "../lib/useClientTable";
import { BrandForm, brandToFormValues } from "./BrandForm";
import { BrandsTable } from "./BrandsTable";
import { MasterDataEmptyState } from "./MasterDataEmptyState";
import { MasterDataListFilter } from "./MasterDataListFilter";

export function BrandsTab() {
  const canCreate = useActionPermission(["master-data:create"]);
  const [name, setName] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [modal, setModal] = useState<{
    open: boolean;
    brand: BrandDTO | null;
  }>({ open: false, brand: null });
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      active,
      ...(name.trim() ? { name: name.trim() } : {}),
    }),
    [active, name],
  );

  const list = useBrandsMasterQuery(listQuery);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand(modal.brand?.id ?? "");
  const updateStatus = useUpdateBrandStatus();

  const table = useClientTable(list.data ?? [], "name");
  const hasFilters = name.trim() !== "" || active !== "all";

  const openCreate = () => setModal({ open: true, brand: null });
  const openEdit = (brand: BrandDTO) => setModal({ open: true, brand });

  const handleStatusChange = async (brand: BrandDTO, isActive: boolean) => {
    if (!isActive) {
      const ok = await confirmDeactivate("brand", brand.name, {
        modelCount: brand.modelCount,
      });
      if (!ok) return;
    }
    setStatusPendingId(brand.id);
    updateStatus.mutate(
      { id: brand.id, isActive },
      { onSettled: () => setStatusPendingId(null) },
    );
  };

  return (
    <div className="flex flex-col rounded-xl border bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <p className="text-muted-foreground text-sm">
          ຈັດການຍີ່ຫໍ້ລົດຈັກ — slug ສ້າງອັດຕະໂນມັດຈາກຊື່
        </p>
        {canCreate ? (
          <div data-tourid="master-data-toolbar">
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4" />
              ເພີ່ມຍີ່ຫໍ້
            </Button>
          </div>
        ) : null}
      </div>

      <MasterDataListFilter
        name={name}
        active={active}
        onNameChange={(val) => {
          setName(val);
          table.resetPage();
        }}
        onActiveChange={(val) => {
          setActive(val);
          table.resetPage();
        }}
      />

      {!list.isLoading && table.totalCount === 0 ? (
        <MasterDataEmptyState
          icon={TagIcon}
          title="ຍັງບໍ່ມີຍີ່ຫໍ້"
          description="ເພີ່ມຍີ່ຫໍ້ລົດຈັກເພື່ອໃຊ້ເປັນຂໍ້ມູນຫຼັກໃນລະບົບ."
          hasFilters={hasFilters}
          actionLabel={canCreate ? "ເພີ່ມຍີ່ຫໍ້" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <BrandsTable
          data={table.page}
          isLoading={list.isLoading}
          offset={table.offset}
          limit={table.limit}
          totalCount={table.totalCount}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onPaginationChange={table.onPaginationChange}
          onSortingChange={table.onSortingChange}
          onEdit={openEdit}
          statusPendingId={statusPendingId}
          onStatusChange={handleStatusChange}
        />
      )}

      <Modal
        open={modal.open}
        onOpenChange={(open) => {
          if (!open) setModal({ open: false, brand: null });
        }}
        title={modal.brand ? "ແກ້ໄຂຍີ່ຫໍ້" : "ເພີ່ມຍີ່ຫໍ້"}
        size="sm"
      >
        <BrandForm
          key={modal.brand?.id ?? "new"}
          editing={!!modal.brand}
          initialValues={
            modal.brand ? brandToFormValues(modal.brand) : undefined
          }
          submitting={createBrand.isPending || updateBrand.isPending}
          onSubmit={(values) => {
            if (modal.brand) {
              updateBrand.mutate(values as UpdateBrandDTO, {
                onSuccess: () => setModal({ open: false, brand: null }),
              });
            } else {
              createBrand.mutate(values as CreateBrandDTO, {
                onSuccess: () => setModal({ open: false, brand: null }),
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
