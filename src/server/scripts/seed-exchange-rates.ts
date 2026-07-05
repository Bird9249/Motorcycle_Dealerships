#!/usr/bin/env bun

import { db } from "@/server/platform/db/client";
import { exchangeRates } from "@/server/platform/db/schema/sales";
import { logger } from "@/server/platform/observability/logger";
import { and, eq } from "drizzle-orm";

const EXCHANGE_RATE_SEED = [
  {
    baseCurrency: "USD" as const,
    targetCurrency: "LAK" as const,
    rate: "21000.000000",
    effectiveDate: "2026-07-01",
  },
  {
    baseCurrency: "USD" as const,
    targetCurrency: "THB" as const,
    rate: "35.500000",
    effectiveDate: "2026-07-01",
  },
] as const;

async function seedExchangeRates() {
  try {
    logger.info("Starting exchange rates seed...");

    for (const item of EXCHANGE_RATE_SEED) {
      const existing = await db
        .select({ id: exchangeRates.id })
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.baseCurrency, item.baseCurrency),
            eq(exchangeRates.targetCurrency, item.targetCurrency),
            eq(exchangeRates.effectiveDate, new Date(item.effectiveDate)),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        logger.info(
          `Exchange rate already exists: ${item.baseCurrency}→${item.targetCurrency} (${item.effectiveDate})`,
        );
        continue;
      }

      await db.insert(exchangeRates).values({
        baseCurrency: item.baseCurrency,
        targetCurrency: item.targetCurrency,
        rate: item.rate,
        effectiveDate: new Date(item.effectiveDate),
      });

      logger.info(
        `Seeded exchange rate: 1 ${item.baseCurrency} = ${item.rate} ${item.targetCurrency}`,
      );
    }

    logger.info("Exchange rates seed completed successfully!");
  } catch (error) {
    logger.error("Exchange rates seed failed:", error);
    process.exit(1);
  }
}

seedExchangeRates();
