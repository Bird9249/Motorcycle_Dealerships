import type { getMediaById } from "./repo/get-by-id";
import type { listMedia } from "./repo/list";
import type { archiveMediaService } from "./service/archive";
import type { createMediaService } from "./service/create";
import type { deleteMediaService } from "./service/delete";
import type { updateMediaService } from "./service/update";

export type MediaListResult = Awaited<ReturnType<typeof listMedia>>;
export type MediaByIdResult = Awaited<ReturnType<typeof getMediaById>>;

export type CreateMediaServiceResult = Extract<
  Awaited<ReturnType<typeof createMediaService>>,
  { value: unknown }
>;
export type UpdateMediaServiceResult = Extract<
  Awaited<ReturnType<typeof updateMediaService>>,
  { value: unknown }
>;
export type DeleteMediaServiceResult = Extract<
  Awaited<ReturnType<typeof deleteMediaService>>,
  { value: unknown }
>;
export type ArchiveMediaServiceResult = Extract<
  Awaited<ReturnType<typeof archiveMediaService>>,
  { value: unknown }
>;
