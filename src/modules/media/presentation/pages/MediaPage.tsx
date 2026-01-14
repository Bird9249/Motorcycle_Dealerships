import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import type { MediaListResult } from "@/modules/media/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { confirm, Modal, toast } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  useArchiveMedia,
  useCreateMedia,
  useDeleteMedia,
  useMediaQuery,
  useUnarchiveMedia,
  useUpdateMedia,
} from "../api/queries";
import { MediaTour, useMediaTour } from "../tour";
import { MediaFilter } from "../ui/MediaFilter";
import { MediaForm } from "../ui/MediaForm";
import { MediaTable } from "../ui/MediaTable";
import { MediaToolbar } from "../ui/MediaToolbar";
import { MediaUploadModal } from "../ui/MediaUploadModal";

type MediaRow = MediaListResult["data"][number];

export function MediaPage() {
  const nav = useNavigate({ from: "/app/media" });
  const search: OffsetPageQueryDTO = useSearch({ from: "/app/media" });

  const list = useMediaQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });

  const createMedia = useCreateMedia();
  const deleteMedia = useDeleteMedia();
  const archiveMedia = useArchiveMedia();
  const unarchiveMedia = useUnarchiveMedia();
  const editModal = useDisclosure<MediaRow>();
  const updateMedia = useUpdateMedia(editModal.data?.id ?? "");
  const uploadModal = useDisclosure();
  const { run, handleJoyrideCallback, startTour } = useMediaTour();

  return (
    <>
      <Header />

      <Main>
        <MediaToolbar onCreate={uploadModal.open} onStartTour={startTour} />

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <MediaFilter />

          <MediaTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={search.offset ?? 0}
            limit={search.limit ?? 20}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort?.[0]?.field}
            sortOrder={search.sort?.[0]?.dir}
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onEdit={(media) => editModal.openWith(media)}
            onDelete={async (id) => {
              const ok = await confirm({
                title: "ລຶບສື່",
                description: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບສື່ນີ້?",
                actionText: "ລຶບ",
                ActionProps: {
                  variant: "destructive",
                },
              });
              if (!ok) return;

              toast.promise(deleteMedia.run(id), {
                loading: "ກໍາລັງລຶບ...",
                success: "ລຶບສື່ສໍາເລັດ",
                error: "ລຶບສື່ລົ້ມເຫຼວ",
              });
            }}
            onArchive={async (id) =>
              toast.promise(archiveMedia.run(id), {
                loading: "ກໍາລັງເກັບໄວ້...",
                success: "ເກັບໄວ້ສື່ສໍາເລັດ",
                error: "ເກັບໄວ້ສື່ລົ້ມເຫຼວ",
              })
            }
            onUnarchive={async (id) =>
              toast.promise(unarchiveMedia.run(id), {
                loading: "ກໍາລັງເອົາອອກຈາກການເກັບໄວ້...",
                success: "ເອົາອອກຈາກການເກັບໄວ້ສື່ສໍາເລັດ",
                error: "ເອົາອອກຈາກການເກັບໄວ້ສື່ລົ້ມເຫຼວ",
              })
            }
          />
        </div>

        <MediaUploadModal
          open={!!uploadModal.isOpen}
          onOpenChange={uploadModal.toggle}
          onUploadComplete={async (ids) => {
            list.refetch();
          }}
        />

        <Modal
          open={!!editModal.isOpen}
          onOpenChange={editModal.toggle}
          title="ແກ້ໄຂສື່"
          size="sm"
        >
          <MediaForm
            initialValues={{
              altText: editModal.data?.altText ?? null,
              fileName: editModal.data?.fileName ?? null,
            }}
            onSubmit={async (vals) => {
              await updateMedia.mutateAsync({
                file: vals.file ?? undefined,
                altText: vals.altText ?? undefined,
                fileName: vals.fileName ?? undefined,
              });
              editModal.close();
            }}
            submitting={updateMedia.isPending}
          />
        </Modal>

        <MediaTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
