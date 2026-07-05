import {
  ExternalLinkIcon,
  FileIcon,
  Loader2Icon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useId, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  confirm,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
} from "@/components/kit";
import type { VehicleDocumentDTO } from "@/modules/inventory/domain/contracts";
import type { VehicleDetailResult } from "@/modules/inventory/domain/types";
import { config } from "@/shared/lib/config";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";
import { AppImage } from "@/shared/ui/AppImage";
import {
  useAddVehicleDocument,
  useDeleteVehicleDocument,
  useUpdateDocumentStatus,
} from "../api/queries";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS,
  type VehicleDocumentType,
} from "../lib/labels";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file";
}

function isImageFile(name: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(name);
}

function fileUrl(key: string) {
  return `${config.apiUrl}/files/${key}`;
}

type VehicleDocumentsPanelProps = {
  vehicle: VehicleDetailResult;
  canManage: boolean;
};

function DocumentRow({
  doc,
  canManage,
  onDelete,
  deleting,
}: {
  doc: VehicleDocumentDTO;
  canManage: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const url = fileUrl(doc.fileKey);
  const isImage = isImageFile(doc.fileName);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {isImage ? (
          <AppImage
            src={doc.fileKey}
            alt={doc.fileName}
            className="size-14 shrink-0 rounded-md border"
            fit="cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted">
            <FileIcon className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {DOCUMENT_TYPE_LABELS[doc.documentType]}
            </Badge>
            <span className="truncate font-medium text-sm">{doc.fileName}</span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            {formatDateTimeLocal(doc.uploadedAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="size-4" />
            ເປີດ
          </a>
        </Button>
        {canManage ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={onDelete}
          >
            <TrashIcon className="size-4 text-destructive" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function VehicleDocumentsPanel({
  vehicle,
  canManage,
}: VehicleDocumentsPanelProps) {
  const inputId = useId();
  const [documentType, setDocumentType] =
    useState<VehicleDocumentType>("import_invoice");
  const [uploading, setUploading] = useState(false);

  const updateStatus = useUpdateDocumentStatus(vehicle.id);
  const addDocument = useAddVehicleDocument(vehicle.id);
  const deleteDocument = useDeleteVehicleDocument(vehicle.id);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const ext = file.name.includes(".")
          ? (file.name.split(".").pop() ?? "")
          : "";
        const baseName = file.name.includes(".")
          ? file.name.slice(0, file.name.lastIndexOf("."))
          : file.name;
        const safeBase = sanitizeFilename(baseName);
        const key = `uploads/inventory/${vehicle.id}/${Date.now()}-${safeBase}${ext ? `.${ext}` : ""}`;
        const contentType = file.type || undefined;

        const { uploadUrl } = await uploadApi.getPresignUrl({
          key,
          contentType,
        });
        await uploadFileToPresignedUrl(uploadUrl, file, { contentType });

        await addDocument.mutateAsync({
          documentType,
          fileKey: key,
          fileName: file.name,
        });
        toast.success("ອັບໂຫຼດເອກະສານສຳເລັດ");
      } catch (e) {
        const message = e instanceof Error ? e.message : "ອັບໂຫຼດລົ້ມເຫຼວ";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [addDocument, documentType, vehicle.id],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
    e.target.value = "";
  };

  const documents = vehicle.documents ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ເອກະສານນຳເຂົ້າ</CardTitle>
        <CardDescription>
          ອັບໂຫຼດໃບເສຍພາສີ/ໃບກວດ ແລະ ຕິດຕາມສະຖານະພ້ອມທະບຽນ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/20 p-4">
          <DocumentStatusBadge
            importInvoiceReceived={vehicle.importInvoiceReceived}
            technicalInspectionReceived={vehicle.technicalInspectionReceived}
            registrationReady={vehicle.registrationReady}
          />
        </div>

        {canManage ? (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="font-medium text-sm">ສະຖານະເອກະສານ</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="import-invoice-toggle" className="text-sm">
                  ໄດ້ຮັບໃບເສຍພາສີແລ້ວ
                </Label>
                <Switch
                  id="import-invoice-toggle"
                  checked={vehicle.importInvoiceReceived}
                  disabled={updateStatus.isPending}
                  onCheckedChange={(checked) =>
                    updateStatus.mutate({ importInvoiceReceived: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="technical-inspection-toggle" className="text-sm">
                  ໄດ້ຮັບໃບກວດກາເຕັກນິກແລ້ວ
                </Label>
                <Switch
                  id="technical-inspection-toggle"
                  checked={vehicle.technicalInspectionReceived}
                  disabled={updateStatus.isPending}
                  onCheckedChange={(checked) =>
                    updateStatus.mutate({
                      technicalInspectionReceived: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {canManage ? (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <p className="font-medium text-sm">ອັບໂຫຼດເອກະສານໃໝ່</p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">ປະເພດເອກະສານ</Label>
                <Select
                  value={documentType}
                  onValueChange={(val) =>
                    setDocumentType(val as VehicleDocumentType)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <input
                  type="file"
                  id={inputId}
                  accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={onInputChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  {uploading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <UploadIcon className="size-4" />
                  )}
                  {uploading ? "ກຳລັງອັບໂຫຼດ..." : "ເລືອກໄຟລ໌"}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              ຮອງຮັບຮູບພາບ ແລະ PDF — ອັບໂຫຼດຜ່ານ presign ໄປຍັງ object store
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="font-medium text-sm">
            ໄຟລ໌ແນບ ({documents.length})
          </p>
          {documents.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
              ຍັງບໍ່ມີເອກະສານແນບ
            </p>
          ) : (
            documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canManage={canManage}
                deleting={deleteDocument.isPending}
                onDelete={async () => {
                  const ok = await confirm({
                    title: "ລຶບເອກະສານ",
                    description: `ລຶບ "${doc.fileName}" ບໍ?`,
                    actionText: "ລຶບ",
                    ActionProps: { variant: "destructive" },
                  });
                  if (!ok) return;
                  toast.promise(deleteDocument.mutateAsync(doc.id), {
                    loading: "ກຳລັງລຶບ...",
                    success: "ລຶບເອກະສານສຳເລັດ",
                    error: "ລຶບເອກະສານລົ້ມເຫຼວ",
                  });
                }}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
