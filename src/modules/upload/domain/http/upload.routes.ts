import { Elysia } from "elysia";
import { serverContext } from "@/server/platform/http/context";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  getPresignedPartUrls,
} from "@/server/utils/multipart-upload";
import { getPresignedUploadUrl } from "@/server/utils/presign-upload";
import {
  MultipartAbortSchema,
  MultipartCompleteSchema,
  MultipartInitSchema,
  MultipartPresignPartsSchema,
  PresignUploadSchema,
} from "@/shared/contracts/upload";

export const uploadDetailRoutes = new Elysia()
  .use(serverContext)
  .post(
    "/presign",
    async ({ body, status }) => {
      const result = await getPresignedUploadUrl({
        key: body.key,
        contentType: body.contentType,
        expiresIn: body.expiresIn,
      });
      if (!result)
        return status(503, {
          error: "Object store (S3/MinIO) is not configured",
        });
      return result;
    },
    { body: PresignUploadSchema },
  )
  .post(
    "/multipart/init",
    async ({ body, status }) => {
      const result = await createMultipartUpload(body.key, body.contentType);
      if (!result)
        return status(503, {
          error: "Object store (S3/MinIO) is not configured",
        });
      return result;
    },
    { body: MultipartInitSchema },
  )
  .post(
    "/multipart/presign-parts",
    async ({ body, status }) => {
      const parts = await getPresignedPartUrls(
        body.key,
        body.uploadId,
        body.partNumbers,
        body.expiresIn,
      );
      if (!parts)
        return status(503, {
          error: "Object store (S3/MinIO) is not configured",
        });
      return { parts };
    },
    { body: MultipartPresignPartsSchema },
  )
  .post(
    "/multipart/complete",
    async ({ body, status }) => {
      const result = await completeMultipartUpload(
        body.key,
        body.uploadId,
        body.parts,
      );
      if (!result)
        return status(503, {
          error: "Object store (S3/MinIO) is not configured",
        });
      return result;
    },
    { body: MultipartCompleteSchema },
  )
  .post(
    "/multipart/abort",
    async ({ body, status }) => {
      const ok = await abortMultipartUpload(body.key, body.uploadId);
      if (!ok)
        return status(503, {
          error: "Object store (S3/MinIO) is not configured",
        });
      return { ok: true };
    },
    { body: MultipartAbortSchema },
  );
