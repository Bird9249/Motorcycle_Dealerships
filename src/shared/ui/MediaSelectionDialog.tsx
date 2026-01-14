import type { MediaListResult } from "@/modules/media/domain/types";
import {
  useDeleteMedia,
  useMediaQuery,
  useUpdateMedia,
} from "@/modules/media/presentation/api/queries";
import { MediaUploadModal } from "@/modules/media/presentation/ui/MediaUploadModal";
import type {
  FilterConditionDTO,
  OffsetPageQueryDTO,
} from "@/shared/contracts/base";
import {
  findCondition,
  removeConditions,
  upsertCondition,
  upsertOrGroup,
} from "@/shared/contracts/query-helpers";
import { config } from "@/shared/lib/config";
import { SimpleSelect } from "@/shared/ui/SimpleSelect";
import {
  Button,
  FormInput,
  FormRoot,
  FormTextarea,
  Input,
  Modal,
  RHF,
  Tabs,
  TabsList,
  TabsTrigger,
  useDebounceCallback,
  zodResolver,
} from "@devhop/ui";
import { EditIcon, FileIcon, TrashIcon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

type MediaRow = MediaListResult["data"][number];

const EditMediaSchema = z.object({
  fileName: z.string().optional(),
  altText: z.string().optional(),
});

type MediaSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaRow) => void;
  multiple?: boolean;
  onSelectMultiple?: (media: MediaRow[]) => void;
  selectedIds?: string[];
  excludeArchived?: boolean;
};

export function MediaSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  onSelectMultiple,
  selectedIds = [],
  excludeArchived = true,
}: MediaSelectionDialogProps) {
  // Permission checks using useActionPermission
  const [filters, setFilters] = useState<FilterConditionDTO[]>([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [selectedItems, setSelectedItems] = useState<MediaRow[]>([]);

  // CRUD state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMediaForEdit, setSelectedMediaForEdit] =
    useState<MediaRow | null>(null);
  const [selectedMediaForDelete, setSelectedMediaForDelete] =
    useState<MediaRow | null>(null);

  // CRUD hooks
  const updateMedia = useUpdateMedia(selectedMediaForEdit?.id || "");
  const deleteMedia = useDeleteMedia();

  // Form hooks
  const editMethods = RHF.useForm<z.infer<typeof EditMediaSchema>>({
    resolver: zodResolver(EditMediaSchema),
  });

  const query: OffsetPageQueryDTO = {
    offset,
    limit,
    filters: filters.length > 0 ? filters : undefined,
  };

  const { data, isLoading, refetch } = useMediaQuery(query);

  const debouncedSearch = useDebounceCallback((val: string) => {
    const next = val
      ? upsertOrGroup(filters, [
          { field: "fileName", op: "contains", value: val },
          { field: "altText", op: "contains", value: val },
        ])
      : removeConditions(removeConditions(filters, "fileName"), "altText");
    if (next) {
      setFilters(next);
      setOffset(0);
    }
  }, 400);

  const mimeTypeFilter = findCondition(filters, "mimeType");
  const archivedFilter = findCondition(filters, "archived");

  const handleSelect = (media: MediaRow) => {
    if (multiple && onSelectMultiple) {
      const isSelected = selectedItems.some((item) => item.id === media.id);
      const newSelected = isSelected
        ? selectedItems.filter((item) => item.id !== media.id)
        : [...selectedItems, media];
      setSelectedItems(newSelected);
    } else {
      onSelect(media);
      onOpenChange(false);
    }
  };

  const handleConfirmMultiple = () => {
    if (onSelectMultiple && selectedItems.length > 0) {
      onSelectMultiple(selectedItems);
      onOpenChange(false);
      setSelectedItems([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleEdit = (media: MediaRow) => {
    setSelectedMediaForEdit(media);
    editMethods.reset({
      fileName: media.fileName || "",
      altText: media.altText || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (media: MediaRow) => {
    setSelectedMediaForDelete(media);
    setDeleteDialogOpen(true);
  };

  const handleUploadComplete = (ids: string[]) => {
    // Refresh the media query to show newly uploaded files
    // Note: In a real implementation, you might want to invalidate the query cache
    // For now, we'll just close the modal since the query will refetch automatically
    refetch();
    setUploadModalOpen(false);
  };

  const handleUpdate = (data: z.infer<typeof EditMediaSchema>) => {
    if (!selectedMediaForEdit) return;

    updateMedia.mutate(
      {
        fileName: data.fileName || undefined,
        altText: data.altText || undefined,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedMediaForEdit(null);
          editMethods.reset();
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedMediaForDelete) return;

    deleteMedia.run(selectedMediaForDelete.id).then(() => {
      setDeleteDialogOpen(false);
      setSelectedMediaForDelete(null);
    });
  };

  // Initialize filters with excludeArchived
  useEffect(() => {
    if (excludeArchived && filters.length === 0) {
      setFilters([{ field: "archived", op: "eq", value: false }]);
    }
  }, [excludeArchived, filters.length]);

  // Reset selected items when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedItems([]);
      setOffset(0);
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="ເລືອກສື່" size="lg">
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-2">
          <Tabs
            value={
              typeof archivedFilter?.value === "boolean"
                ? String(archivedFilter.value)
                : excludeArchived
                  ? "false"
                  : "all"
            }
            onValueChange={(val) => {
              const next =
                val === "all"
                  ? removeConditions(filters, "archived")
                  : upsertCondition(filters, {
                      field: "archived",
                      op: "eq",
                      value: val === "true",
                    });
              if (next) {
                setFilters(next);
                setOffset(0);
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="all">ທັງໝົດ</TabsTrigger>
              <TabsTrigger value="false">ທີ່ໃຊ້ຢູ່</TabsTrigger>
              <TabsTrigger value="true">ຖືກບັນທຶກ</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Input
              placeholder="ຄົ້ນຫາ..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="flex-1"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload
            </Button>

            <SimpleSelect
              onValueChange={(val) => {
                const next =
                  val === "all"
                    ? removeConditions(filters, "mimeType")
                    : upsertCondition(filters, {
                        field: "mimeType",
                        op: "startsWith",
                        value: val,
                      });
                if (next) {
                  setFilters(next);
                  setOffset(0);
                }
              }}
              placeholder="ປະເພດ"
              className="w-32"
              value={
                mimeTypeFilter?.value
                  ? String(mimeTypeFilter.value).split("/")[0]
                  : "all"
              }
              options={[
                { value: "all", label: "ທັງໝົດ" },
                { value: "image", label: "ຮູບພາບ" },
                { value: "application", label: "ເອກະສານ" },
              ]}
            />
          </div>
        </div>

        {/* Selected items indicator (for multiple mode) */}
        {multiple && selectedItems.length > 0 && (
          <div className="flex items-center justify-between rounded-md border bg-muted p-2">
            <span className="text-muted-foreground text-sm">
              ເລືອກແລ້ວ {selectedItems.length} ລາຍການ
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              ລ້າງ
            </Button>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">ກຳລັງໂຫຼດ...</span>
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">ບໍ່ພົບສື່</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.data.map((media) => {
                const isSelected = multiple
                  ? selectedItems.some((item) => item.id === media.id)
                  : selectedIds.includes(media.id);
                const thumbUrl = media.fileUrl;
                const isImage = media.mimeType?.startsWith("image/");

                return (
                  <div
                    key={media.id}
                    className={`group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent ${
                      isSelected ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(media)}
                      className="flex w-full flex-col items-center gap-2"
                    >
                      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded border bg-muted">
                        {isImage ? (
                          <img
                            src={config.apiUrl + thumbUrl}
                            alt={media.altText || media.fileName || ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full text-center">
                        <p
                          className="truncate text-xs"
                          title={media.fileName || ""}
                        >
                          {media.fileName || "ບໍ່ມີຊື່"}
                        </p>
                        {media.fileSize && (
                          <p className="text-[10px] text-muted-foreground">
                            {(media.fileSize / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(media);
                        }}
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(media);
                        }}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.meta.total > limit && (
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-muted-foreground text-sm">
              ສະແດງ {offset + 1}-{Math.min(offset + limit, data.meta.total)} ຈາກ{" "}
              {data.meta.total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                ກັບກ່ອນ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= data.meta.total}
              >
                ຕໍ່ໄປ
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {multiple && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ຍົກເລີກ
            </Button>
            <Button
              onClick={handleConfirmMultiple}
              disabled={selectedItems.length === 0}
            >
              ຢືນຢັນ ({selectedItems.length})
            </Button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <MediaUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadComplete={handleUploadComplete}
      />

      {/* Edit Modal */}
      <Modal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="ແກ້ໄຂສື່"
        size="sm"
      >
        <FormRoot
          methods={editMethods}
          onSubmit={handleUpdate}
          className="space-y-4"
        >
          <FormInput
            name="fileName"
            label="ຊື່ໄຟລ໌"
            defaultValue={selectedMediaForEdit?.fileName || ""}
          />

          <FormTextarea
            name="altText"
            label="ຄຳອະທິບາຍ"
            defaultValue={selectedMediaForEdit?.altText || ""}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              ຍົກເລີກ
            </Button>
            <Button type="submit" isLoading={updateMedia.isPending}>
              ບັນທຶກ
            </Button>
          </div>
        </FormRoot>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="ຢືນຢັນການລຶບ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສື່ "{selectedMediaForDelete?.fileName}"?
            ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              ຍົກເລີກ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deleteMedia.isPending}
            >
              ລຶບ
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
