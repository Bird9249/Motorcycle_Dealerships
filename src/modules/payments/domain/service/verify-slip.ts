import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import {
  getPaymentSnapshot,
  updatePaymentById,
} from "../repo/payments";
import { getPaymentScheduleById } from "../repo/payment-schedules";
import {
  assertAmountWithinScheduleDue,
  syncScheduleAfterVerify,
} from "./validate-payment";

export async function verifyPaymentService(
  client: DbTransaction,
  params: { id: string; verifiedBy: string },
) {
  const existing = await getPaymentSnapshot(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Payment not found");
  }

  if (existing.status === "verified") {
    throw new AppError("ALREADY_VERIFIED", "Payment is already verified");
  }
  if (existing.status === "rejected") {
    throw new AppError("ALREADY_REJECTED", "Cannot verify a rejected payment");
  }
  if (existing.status !== "pending") {
    throw new AppError("INVALID_STATUS", "Only pending payments can be verified");
  }

  if (
    existing.paymentMethod === "bank_transfer" &&
    !existing.slipImageKey
  ) {
    throw new AppError("SLIP_REQUIRED", "Bank transfer requires slip image");
  }

  if (existing.paymentScheduleId) {
    const schedule = await getPaymentScheduleById(
      existing.paymentScheduleId,
      client,
    );
    if (!schedule) {
      throw new AppError("NOT_FOUND", "Payment schedule not found");
    }
    await assertAmountWithinScheduleDue(client, {
      paymentScheduleId: existing.paymentScheduleId,
      amount: existing.amount,
      scheduleAmount: schedule.amount,
      excludePaymentId: existing.id,
    });
  }

  const now = nowDate();
  const updated = await updatePaymentById(
    params.id,
    {
      status: "verified",
      slipVerified: true,
      slipVerifiedAt: now,
      slipVerifiedBy: params.verifiedBy,
      updatedAt: now,
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Payment not found");
  }

  if (existing.paymentScheduleId) {
    await syncScheduleAfterVerify(client, {
      paymentScheduleId: existing.paymentScheduleId,
      verifiedAt: now,
    });
  }

  return { before: existing, updated };
}
