import { z } from "zod";
import { zfd } from "zod-form-data";

export const MediaSchema = z.object({
  id: z.string(),
  fileUrl: z.string(),
  thumbUrl: z.string().nullable(),
  altText: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileName: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  createdBy: z.string().nullable(),
  archived: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type MediaDTO = z.infer<typeof MediaSchema>;

export const CreateMediaSchema = z.object({
  altText: z.string().nullable().optional(),
});
export type CreateMediaDTO = z.infer<typeof CreateMediaSchema>;

export const UpdateMediaSchema = z.object({
  altText: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
});
export type UpdateMediaDTO = z.infer<typeof UpdateMediaSchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

// FormData specific schemas (for use with zValidator("form", ...))
// สำหรับ multiple upload: รับ files[] array
export const CreateMediaFormSchema = zfd.formData({
  files: zfd.repeatableOfType(z.instanceof(File)),
  altText: zfd.text(z.string().optional()),
  fileName: zfd.text(z.string().optional()),
});
export type CreateMediaFormDTO = z.infer<typeof CreateMediaFormSchema>;

export const UpdateMediaFormSchema = zfd.formData({
  altText: zfd.text(z.string().optional()),
  fileName: zfd.text(z.string().optional().nullable()),
  file: zfd.file(z.instanceof(File).optional().nullable()),
});
export type UpdateMediaFormDTO = z.infer<typeof UpdateMediaFormSchema>;

// Lookup/search (for infinite combobox)
export const MediaLookupQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});
export type MediaLookupQueryDTO = z.infer<typeof MediaLookupQuerySchema>;

// Chunk Upload Schemas
export const InitiateUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  fileHash: z.string().min(1),
  totalChunks: z.number().int().positive(),
});
export type InitiateUploadDTO = z.infer<typeof InitiateUploadSchema>;

export const InitiateUploadResponseSchema = z.object({
  uploadId: z.string(),
  chunkSize: z.number().int().positive(),
});
export type InitiateUploadResponseDTO = z.infer<
  typeof InitiateUploadResponseSchema
>;

export const UploadChunkSchema = zfd.formData({
  chunk: zfd.file(z.instanceof(File)),
  uploadId: zfd.text(z.string().min(1)),
  chunkIndex: zfd.text(z.coerce.number().int().min(0)),
  totalChunks: zfd.text(z.coerce.number().int().positive()),
});
export type UploadChunkDTO = z.infer<typeof UploadChunkSchema>;

export const CompleteUploadSchema = z.object({
  uploadId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
});
export type CompleteUploadDTO = z.infer<typeof CompleteUploadSchema>;

export const CompleteUploadResponseSchema = z.object({
  uploadId: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  fileName: z.string(),
});
export type CompleteUploadResponseDTO = z.infer<
  typeof CompleteUploadResponseSchema
>;

export const UploadStatusSchema = z.object({
  uploadId: z.string().min(1),
});
export type UploadStatusDTO = z.infer<typeof UploadStatusSchema>;

export const UploadStatusResponseSchema = z.object({
  uploadId: z.string(),
  status: z.enum(["initializing", "uploading", "completed", "failed"]),
  uploadedChunks: z.number().int(),
  totalChunks: z.number().int(),
  progress: z.number().min(0).max(100),
  fileSize: z.number().int(),
  uploadedBytes: z.number().int(),
});
export type UploadStatusResponseDTO = z.infer<
  typeof UploadStatusResponseSchema
>;
