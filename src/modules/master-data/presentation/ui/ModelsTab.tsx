import { DatabaseIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Modal } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type {
  CreateModelDTO,
  ModelDTO,
  UpdateModelDTO,
} from "@/modules/master-data/domain/contracts";
import type { ActiveFilter } from "@/modules/master-data/domain/contracts/common";
import {
  useBrandsMasterQuery,
  useCreateModel,
  useModelsMasterQuery,
  useUpdateModel,
  useUpdateModelStatus,
} from "../api/queries";
import { confirmDeactivate } from "../lib/confirm-deactivate";
import { useClientTable } from "../lib/useClientTable";
import { VEHICLE_TYPE_FILTER_OPTIONS } from "../lib/labels";
import { MasterDataEmptyState } from "./MasterDataEmptyState";
import {
  MasterDataListFilter,
  MasterDataSelectFilter,
} from "./MasterDataListFilter";
import { ModelForm, modelToFormValues } from "./ModelForm";
import { ModelsTable } from "./ModelsTable";

export function ModelsTab() {
  const canCreate = useActionPermission(["master-data:create"]);
  const [name, setName] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [brandId, setBrandId] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [modal, setModal] = useState<{
    open: boolean;
    model: ModelDTO | null;
  }>({ open: false, model: null });
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const brands = useBrandsMasterQuery({ active: "all" });

  const listQuery = useMemo(
    () => ({
      active,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(brandId !== "all" ? { brandId } : {}),
      ...(vehicleType !== "all"
        ? { vehicleType: vehicleType as "ice" | "ev" }
        : {}),
    }),
    [active, name, brandId, vehicleType],
  );

  const list = useModelsMasterQuery(listQuery);
  const createModel = useCreateModel();
  const updateModel = useUpdateModel(modal.model?.id ?? "");
  const updateStatus = useUpdateModelStatus();

  const table = useClientTable(list.data ?? [], "name");
  const hasFilters =
    name.trim() !== "" ||
    active !== "all" ||
    brandId !== "all" ||
    vehicleType !== "all";

  const brandOptions = useMemo(
    () => (brands.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands.data],
  );

  const brandFilterOptions = useMemo(
    () => [{ value: "all", label: "ທຸກຍີ່ຫໍ້" }, ...brandOptions],
    [brandOptions],
  );

  const openCreate = () => setModal({ open: true, model: null });
  const openEdit = (model: ModelDTO) => setModal({ open: true, model });

  const handleStatusChange = async (model: ModelDTO, isActive: boolean) => {
    if (!isActive) {
      const ok = await confirmDeactivate("model", model.name, {
        vehicleCount: model.vehicleCount,
      });
      if (!ok) return;
    }
    setStatusPendingId(model.id);
    updateStatus.mutate(
      { id: model.id, isActive },
      { onSettled: () => setStatusPendingId(null) },
    );
  };

  return (
    <div className="flex flex-col rounded-xl border bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <p className="text-muted-foreground text-sm">
          ຈັດການລຸ່ນລົດ — ແຍກປະເພດ ICE / EV
        </p>
        {canCreate ? (
          <div data-tourid="master-data-toolbar">
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4" />
              ເພີ່ມລຸ່ນ
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
      >
        <MasterDataSelectFilter
          label="ຍີ່ຫໍ້"
          value={brandId}
          options={brandFilterOptions}
          onChange={(val) => {
            setBrandId(val);
            table.resetPage();
          }}
        />
        <MasterDataSelectFilter
          label="ປະເພດ"
          value={vehicleType}
          options={[...VEHICLE_TYPE_FILTER_OPTIONS]}
          onChange={(val) => {
            setVehicleType(val);
            table.resetPage();
          }}
        />
      </MasterDataListFilter>

      {!list.isLoading && table.totalCount === 0 ? (
        <MasterDataEmptyState
          icon={DatabaseIcon}
          title="ຍັງບໍ່ມີລຸ່ນ"
          description="ເພີ່ມລຸ່ນລົດ ICE ຫຼື EV ພາຍໃຕ້ຍີ່ຫໍ້."
          hasFilters={hasFilters}
          actionLabel={canCreate ? "ເພີ່ມລຸ່ນ" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <ModelsTable
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
          if (!open) setModal({ open: false, model: null });
        }}
        title={modal.model ? "ແກ້ໄຂລຸ່ນ" : "ເພີ່ມລຸ່ນ"}
        size="md"
      >
        <ModelForm
          key={modal.model?.id ?? "new"}
          editing={!!modal.model}
          brandOptions={brandOptions}
          initialValues={
            modal.model ? modelToFormValues(modal.model) : undefined
          }
          submitting={createModel.isPending || updateModel.isPending}
          onSubmit={(values) => {
            if (modal.model) {
              updateModel.mutate(values as UpdateModelDTO, {
                onSuccess: () => setModal({ open: false, model: null }),
              });
            } else {
              createModel.mutate(values as CreateModelDTO, {
                onSuccess: () => setModal({ open: false, model: null }),
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
