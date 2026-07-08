import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import {
  getPaymentSnapshot,
  updatePaymentById,
} from "../repo/payments";

function appendRejectNote(
  existingNotes: string | null | undefined,
  reason: string | null | undefined,
) {
  const trimmed = reason?.trim();
  if (!trimmed) return existingNotes ?? null;
  const prefix = `[ປະຕິເສດ] ${trimmed}`;
  if (!existingNotes?.trim()) return prefix;
  return `${existingNotes.trim()}\n${prefix}`;
}

export async function rejectPaymentService(
  client: DbTransaction,
  params: { id: string; rejectedBy: string; reason?: string | null },
) {
  const existing = await getPaymentSnapshot(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Payment not found");
  }

  if (existing.status === "verified") {
    throw new AppError(
      "INVALID_STATUS",
      "Cannot reject a verified payment",
    );
  }
  if (existing.status === "rejected") {
    throw new AppError("ALREADY_REJECTED", "Payment is already rejected");
  }
  if (existing.status !== "pending") {
    throw new AppError("INVALID_STATUS", "Only pending payments can be rejected");
  }

  const now = nowDate();
  const updated = await updatePaymentById(
    params.id,
    {
      status: "rejected",
      slipVerified: false,
      slipVerifiedAt: now,
      slipVerifiedBy: params.rejectedBy,
      notes: appendRejectNote(existing.notes, params.reason),
      updatedAt: now,
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Payment not found");
  }

  return { before: existing, updated };
}
