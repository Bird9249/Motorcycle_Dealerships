import { z } from "zod";

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const ActiveFilterSchema = z.enum(["all", "active", "inactive"]).optional();

export const UpdateActiveStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ActiveFilter = z.infer<typeof ActiveFilterSchema>;
export type UpdateActiveStatusDTO = z.infer<typeof UpdateActiveStatusSchema>;

export function activeFilterToBoolean(
  filter: ActiveFilter | undefined,
): boolean | undefined {
  if (filter === "active") return true;
  if (filter === "inactive") return false;
  return undefined;
}
