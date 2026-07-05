import { z } from "zod";
import { VehicleStatusSchema } from "./vehicles";

export const VehicleStatusHistoryItemSchema = z.object({
  id: z.string(),
  occurredAt: z.coerce.date(),
  action: z.string(),
  fromStatus: VehicleStatusSchema.nullable(),
  toStatus: VehicleStatusSchema,
  actorId: z.string().nullable(),
  actorRole: z.string().nullable(),
});

export type VehicleStatusHistoryItem = z.infer<
  typeof VehicleStatusHistoryItemSchema
>;

export const VehicleStatusHistorySchema = z.array(VehicleStatusHistoryItemSchema);

export type VehicleStatusHistoryResult = z.infer<
  typeof VehicleStatusHistorySchema
>;
