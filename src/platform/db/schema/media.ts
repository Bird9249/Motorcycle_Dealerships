import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    fileUrl: text("file_url").notNull(),
    altText: text("alt_text"),
    mimeType: text("mime_type"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("media_assets_by_created_by").on(t.createdBy),
    index("media_assets_by_archived").on(t.archived),
    index("media_assets_by_created_at").on(t.createdAt),
    index("media_assets_by_mime_type").on(t.mimeType),
    index("media_assets_by_archived_created_at").on(t.archived, t.createdAt),
  ],
);

// Chunk Upload Tables
export const chunkUploadSessions = pgTable(
  "chunk_upload_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    fileHash: text("file_hash").notNull(),
    totalChunks: integer("total_chunks").notNull(),
    uploadedChunks: integer("uploaded_chunks").notNull().default(0),
    status: text("status", {
      enum: ["initializing", "uploading", "completed", "failed", "cancelled"],
    })
      .notNull()
      .default("initializing"),
    tempDir: text("temp_dir"), // Temporary directory for chunks
    finalFileUrl: text("final_file_url"), // Final merged file URL
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { mode: "string", withTimezone: false }),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chunk_sessions_by_status").on(t.status),
    index("chunk_sessions_by_created_by").on(t.createdBy),
    index("chunk_sessions_by_expires_at").on(t.expiresAt),
    index("chunk_sessions_by_file_hash").on(t.fileHash),
  ],
);

export const chunkUploads = pgTable(
  "chunk_uploads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    sessionId: text("session_id")
      .notNull()
      .references(() => chunkUploadSessions.id, {
        onDelete: "cascade",
      }),
    chunkIndex: integer("chunk_index").notNull(),
    chunkSize: integer("chunk_size").notNull(),
    chunkHash: text("chunk_hash").notNull(),
    tempFilePath: text("temp_file_path").notNull(),
    uploadedAt: timestamp("uploaded_at", {
      mode: "string",
      withTimezone: false,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chunks_by_session_id").on(t.sessionId),
    index("chunks_by_session_index").on(t.sessionId, t.chunkIndex),
  ],
);
