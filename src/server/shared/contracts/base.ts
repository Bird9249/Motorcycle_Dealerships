import { z } from "zod";

// Sorting
export const SortDirSchema = z.enum(["asc", "desc"]);
export const SortFieldSchema = z.object({
  field: z.string().min(1),
  dir: SortDirSchema,
});
export type SortFieldDTO = z.infer<typeof SortFieldSchema>;

// Filtering
export const FilterOperatorSchema = z.enum([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "startsWith",
  "endsWith",
  "in",
  "nin",
  "between",
  "and",
  "or",
  "isNull",
  "isNotNull",
]);
export type FilterOperatorDTO = z.infer<typeof FilterOperatorSchema>;

const PrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.undefined(),
]);
const PrimitiveArraySchema = z.union([
  z.array(z.string()),
  z.array(z.number()),
]);
const BetweenSchema = z.tuple([z.number(), z.number()]);

export const FilterConditionSchema = z.object({
  field: z.string().min(1),
  op: FilterOperatorSchema,
  value: z.union([
    PrimitiveSchema,
    PrimitiveArraySchema,
    BetweenSchema,
    z.array(
      z.object({
        field: z.string().min(1),
        op: FilterOperatorSchema,
        value: z.union([PrimitiveSchema, PrimitiveArraySchema, BetweenSchema]),
      }),
    ),
  ]),
});
export type FilterConditionDTO = z.infer<typeof FilterConditionSchema>;

// Helper: accept JSON string or already-parsed value
const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }, z.array(schema));

// Offset-based pagination
export const OffsetPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: jsonArray(SortFieldSchema).optional(),
  filters: jsonArray(FilterConditionSchema).optional(),
});
export type OffsetPageQueryDTO = z.infer<typeof OffsetPageQuerySchema>;

export const OffsetPageMetaSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});
export type OffsetPageMetaDTO = z.infer<typeof OffsetPageMetaSchema>;

// Cursor-based pagination
export const CursorPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  after: z.string().nullable().optional(),
  before: z.string().nullable().optional(),
  sort: z.array(SortFieldSchema).optional(),
  filters: z.array(FilterConditionSchema).optional(),
});
export type CursorPageQueryDTO = z.infer<typeof CursorPageQuerySchema>;

export const CursorPageInfoSchema = z.object({
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});
export type CursorPageInfoDTO = z.infer<typeof CursorPageInfoSchema>;

// Generic TS helpers (not zod) to shape responses
export interface OffsetPageDTO<TItem> {
  data: TItem[];
  meta: OffsetPageMetaDTO;
}

export interface CursorPageDTO<TItem> {
  data: TItem[];
  pageInfo: CursorPageInfoDTO;
}
