#!/usr/bin/env bun

import { db } from "@/server/platform/db/client";
import { financeCompanies } from "@/server/platform/db/schema/sales";
import { logger } from "@/server/platform/observability/logger";
import { eq } from "drizzle-orm";

const FINANCE_COMPANY_SEED = [
  {
    code: "welcome",
    name: "Welcome Finance",
    contactPhone: "021-123456",
  },
  {
    code: "vathana",
    name: "ວັດທະນາ",
    contactPhone: "021-234567",
  },
  {
    code: "t-ke",
    name: "T-Ke Finance",
    contactPhone: "021-345678",
  },
] as const;

async function seedFinanceCompanies() {
  try {
    logger.info("Starting finance companies seed...");

    for (const item of FINANCE_COMPANY_SEED) {
      const existing = await db
        .select({ id: financeCompanies.id })
        .from(financeCompanies)
        .where(eq(financeCompanies.code, item.code))
        .limit(1);

      if (existing.length > 0) {
        logger.info(`Finance company already exists: ${item.code}`);
        continue;
      }

      await db.insert(financeCompanies).values({
        name: item.name,
        code: item.code,
        contactPhone: item.contactPhone,
        isActive: true,
      });

      logger.info(`Seeded finance company: ${item.name} (${item.code})`);
    }

    logger.info("Finance companies seed completed successfully!");
  } catch (error) {
    logger.error("Finance companies seed failed:", error);
    process.exit(1);
  }
}

seedFinanceCompanies();
