#!/usr/bin/env bun

import { db } from "@/server/platform/db/client";
import { paymentAccounts } from "@/server/platform/db/schema/payments";
import { logger } from "@/server/platform/observability/logger";
import { eq } from "drizzle-orm";

const PAYMENT_ACCOUNT_SEED = [
  {
    name: "ເງິນສົດຫນ້າຮ້ານ",
    type: "cash" as const,
    currency: "LAK" as const,
    displayOrder: 0,
  },
  {
    name: "BCEL — ບັນຊີ A",
    type: "bank_transfer" as const,
    bankName: "BCEL",
    accountNumber: "1234567890",
    currency: "LAK" as const,
    displayOrder: 1,
  },
  {
    name: "JDB — ບັນຊີ B",
    type: "bank_transfer" as const,
    bankName: "JDB",
    accountNumber: "0987654321",
    currency: "LAK" as const,
    displayOrder: 2,
  },
] as const;

async function seedPaymentAccounts() {
  try {
    logger.info("Starting payment accounts seed...");

    for (const item of PAYMENT_ACCOUNT_SEED) {
      const existing = await db
        .select({ id: paymentAccounts.id })
        .from(paymentAccounts)
        .where(eq(paymentAccounts.name, item.name))
        .limit(1);

      if (existing.length > 0) {
        logger.info(`Payment account already exists: ${item.name}`);
        continue;
      }

      await db.insert(paymentAccounts).values({
        name: item.name,
        type: item.type,
        bankName: "bankName" in item ? item.bankName : null,
        accountNumber: "accountNumber" in item ? item.accountNumber : null,
        currency: item.currency,
        isActive: true,
        displayOrder: item.displayOrder,
      });

      logger.info(`Seeded payment account: ${item.name}`);
    }

    logger.info("Payment accounts seed completed successfully!");
  } catch (error) {
    logger.error("Payment accounts seed failed:", error);
    process.exit(1);
  }
}

seedPaymentAccounts();
