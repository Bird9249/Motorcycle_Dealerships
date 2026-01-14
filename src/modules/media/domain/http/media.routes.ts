import {
  CompleteUploadSchema,
  CreateMediaFormSchema,
  IdParamSchema,
  InitiateUploadSchema,
  MediaLookupQuerySchema,
  UpdateMediaFormSchema,
  UploadChunkSchema,
} from "@/modules/media/domain/contracts";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import type { HonoContext } from "@/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getMediaById } from "../repo/get-by-id";
import { listMedia } from "../repo/list";
import { lookupMedia } from "../repo/lookup";
import { archiveMediaService } from "../service/archive";
import {
  cancelChunkUploadService,
  completeChunkUploadService,
  getUploadStatusService,
  initiateChunkUploadService,
  uploadChunkService,
} from "../service/chunk-upload";
import { createMediaService } from "../service/create";
import { deleteMediaService } from "../service/delete";
import { unarchiveMediaService } from "../service/unarchive";
import { updateMediaService } from "../service/update";

export function registerMediaRoutes() {
  const r = new Hono<HonoContext>();

  // Lookup media for combobox (supports q, limit, skip)
  r.get("/lookup", zValidator("query", MediaLookupQuerySchema), async (c) => {
    const client = c.get("db");
    const { q, limit, skip } = c.req.valid("query") as {
      q?: string;
      limit: number;
      skip: number;
    };
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const result = await lookupMedia(
      { q, limit, skip },
      client,
      userId,
      permissions as PermissionId[],
    );
    return c.json(result);
  });

  // Hydrate media by id for combobox
  r.get("/lookup/:id", zValidator("param", IdParamSchema), async (c) => {
    const client = c.get("db");
    const { id } = c.req.valid("param");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const media = await getMediaById(
      id,
      client,
      userId,
      permissions as PermissionId[],
    );
    if (!media) return c.json({ item: null }, 200);
    return c.json({
      item: {
        id: media.id,
        name: media.fileName ?? media.fileUrl,
        fileUrl: media.fileUrl,
      },
    });
  });

  r.get("/", zValidator("query", OffsetPageQuerySchema), async (c) => {
    const client = c.get("db");
    const q = c.req.valid("query");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const result = await listMedia(
      q,
      client,
      userId,
      permissions as PermissionId[],
    );
    return c.json(result);
  });

  r.get("/:id", zValidator("param", IdParamSchema), async (c) => {
    const client = c.get("db");
    const { id } = c.req.valid("param");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const media = await getMediaById(
      id,
      client,
      userId,
      permissions as PermissionId[],
    );
    if (!media) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ item: media });
  });

  r.post("/", zValidator("form", CreateMediaFormSchema), async (c) => {
    const client = c.get("db");
    const input = c.req.valid("form");
    const createdBy = c.get("session")?.userId;

    const result = await createMediaService(
      client,
      {
        files: input.files,
        altText: input.altText ?? null,
        fileName: input.fileName ?? null,
        createdBy,
      },
      c,
    );
    if (!result.ok)
      return c.json({ error: result.error }, result.status ?? 500);
    return c.json({ items: result.value }, 201);
  });

  r.put(
    "/:id",
    zValidator("param", IdParamSchema),
    zValidator("form", UpdateMediaFormSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      const input = c.req.valid("form");
      const userId = c.get("session")?.userId;
      const permissions = c.get("permissions") ?? [];
      const result = await updateMediaService(
        client,
        {
          id,
          input: {
            altText: input.altText ?? null,
            fileName: input.fileName ?? undefined,
          },
          file: input.file ?? null,
          userId,
          permissions,
        },
        c,
      );
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({ item: result.value });
    },
  );

  r.delete("/:id", zValidator("param", IdParamSchema), async (c) => {
    const client = c.get("db");
    const { id } = c.req.valid("param");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const result = await deleteMediaService(
      client,
      { id, userId, permissions },
      c,
    );
    if (!result.ok)
      return c.json({ error: result.error }, result.status ?? 500);
    if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ ok: true });
  });

  r.post("/:id/archive", zValidator("param", IdParamSchema), async (c) => {
    const client = c.get("db");
    const { id } = c.req.valid("param");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const result = await archiveMediaService(
      client,
      { id, userId, permissions },
      c,
    );
    if (!result.ok)
      return c.json({ error: result.error }, result.status ?? 500);
    if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ ok: true });
  });

  r.post("/:id/unarchive", zValidator("param", IdParamSchema), async (c) => {
    const client = c.get("db");
    const { id } = c.req.valid("param");
    const userId = c.get("session")?.userId;
    const permissions = c.get("permissions") ?? [];
    const result = await unarchiveMediaService(
      client,
      { id, userId, permissions },
      c,
    );
    if (!result.ok)
      return c.json({ error: result.error }, result.status ?? 500);
    if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ ok: true });
  });

  // Chunk upload routes
  r.post(
    "/upload/initiate",
    zValidator("json", InitiateUploadSchema),
    async (c) => {
      const client = c.get("db");
      const input = c.req.valid("json");
      const createdBy = c.get("session")?.userId;

      // Add createdBy to session data
      const sessionData = { ...input, createdBy };

      const result = await initiateChunkUploadService(client, sessionData);
      if (!result.ok) {
        return c.json({ error: result.error }, result.status ?? 500);
      }
      return c.json(result.value, 201);
    },
  );

  r.post("/upload/chunk", zValidator("form", UploadChunkSchema), async (c) => {
    const client = c.get("db");
    const input = c.req.valid("form");

    const result = await uploadChunkService(client, {
      chunk: input.chunk,
      uploadId: input.uploadId,
      chunkIndex: input.chunkIndex,
      totalChunks: input.totalChunks,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, result.status ?? 500);
    }
    return c.json(result.value);
  });

  r.post(
    "/upload/complete",
    zValidator("json", CompleteUploadSchema),
    async (c) => {
      const client = c.get("db");
      const input = c.req.valid("json");

      const result = await completeChunkUploadService(client, input);
      if (!result.ok) {
        return c.json({ error: result.error }, result.status ?? 500);
      }
      return c.json(result.value);
    },
  );

  r.get(
    "/upload/status/:uploadId",
    zValidator("param", z.object({ uploadId: z.string() })),
    async (c) => {
      const client = c.get("db");
      const { uploadId } = c.req.valid("param");

      const result = await getUploadStatusService(client, { uploadId });
      if (!result.ok) {
        return c.json({ error: result.error }, result.status ?? 500);
      }
      return c.json(result.value);
    },
  );

  r.post(
    "/upload/cancel/:uploadId",
    zValidator("param", z.object({ uploadId: z.string() })),
    async (c) => {
      const client = c.get("db");
      const { uploadId } = c.req.valid("param");

      const result = await cancelChunkUploadService(client, { uploadId });
      if (!result.ok) {
        return c.json({ error: result.error }, result.status ?? 500);
      }
      return c.json(result.value);
    },
  );

  return r;
}
