import { PaletteIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Modal } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type {
  ColorDTO,
  CreateColorDTO,
  UpdateColorDTO,
} from "@/modules/master-data/domain/contracts";
import type { ActiveFilter } from "@/modules/master-data/domain/contracts/common";
import {
  useColorsMasterQuery,
  useCreateColor,
  useUpdateColor,
  useUpdateColorStatus,
} from "../api/queries";
import { confirmDeactivate } from "../lib/confirm-deactivate";
import { useClientTable } from "../lib/useClientTable";
import { ColorForm, colorToFormValues } from "./ColorForm";
import { ColorsTable } from "./ColorsTable";
import { MasterDataEmptyState } from "./MasterDataEmptyState";
import { MasterDataListFilter } from "./MasterDataListFilter";

export function ColorsTab() {
  const canCreate = useActionPermission(["master-data:create"]);
  const [name, setName] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [modal, setModal] = useState<{
    open: boolean;
    color: ColorDTO | null;
  }>({ open: false, color: null });
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      active,
      ...(name.trim() ? { name: name.trim() } : {}),
    }),
    [active, name],
  );

  const list = useColorsMasterQuery(listQuery);
  const createColor = useCreateColor();
  const updateColor = useUpdateColor(modal.color?.id ?? "");
  const updateStatus = useUpdateColorStatus();

  const table = useClientTable(list.data ?? [], "name");
  const hasFilters = name.trim() !== "" || active !== "all";

  const openCreate = () => setModal({ open: true, color: null });
  const openEdit = (color: ColorDTO) => setModal({ open: true, color });

  const handleStatusChange = async (color: ColorDTO, isActive: boolean) => {
    if (!isActive) {
      const ok = await confirmDeactivate("color", color.name);
      if (!ok) return;
    }
    setStatusPendingId(color.id);
    updateStatus.mutate(
      { id: color.id, isActive },
      { onSettled: () => setStatusPendingId(null) },
    );
  };

  return (
    <div className="flex flex-col rounded-xl border bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <p className="text-muted-foreground text-sm">
          ຈັດການສີລົດ — ກຳນົດ hex code ເພື່ອແສດ swatch
        </p>
        {canCreate ? (
          <div data-tourid="master-data-toolbar">
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4" />
              ເພີ່ມສີ
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
          icon={PaletteIcon}
          title="ຍັງບໍ່ມີສີ"
          description="ເພີ່ມສີລົດພ້ອມລະຫັດ hex ເພື່ອໃຊ້ໃນຟອມສ້າງລົດ."
          hasFilters={hasFilters}
          actionLabel={canCreate ? "ເພີ່ມສີ" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <ColorsTable
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
          if (!open) setModal({ open: false, color: null });
        }}
        title={modal.color ? "ແກ້ໄຂສີ" : "ເພີ່ມສີ"}
        size="sm"
      >
        <ColorForm
          key={modal.color?.id ?? "new"}
          editing={!!modal.color}
          initialValues={
            modal.color ? colorToFormValues(modal.color) : undefined
          }
          submitting={createColor.isPending || updateColor.isPending}
          onSubmit={(values) => {
            if (modal.color) {
              updateColor.mutate(values as UpdateColorDTO, {
                onSuccess: () => setModal({ open: false, color: null }),
              });
            } else {
              createColor.mutate(values as CreateColorDTO, {
                onSuccess: () => setModal({ open: false, color: null }),
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
