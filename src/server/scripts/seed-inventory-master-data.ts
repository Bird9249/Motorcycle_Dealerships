#!/usr/bin/env bun

import { db } from "@/server/platform/db/client";
import {
  brands,
  colors,
  models,
} from "@/server/platform/db/schema/inventory";
import { logger } from "@/server/platform/observability/logger";
import { and, eq } from "drizzle-orm";

const BRAND_SEED = [
  {
    slug: "honda",
    name: "Honda",
    models: [
      {
        name: "Wave 110i",
        vehicleType: "ice" as const,
        engineCc: 110,
        year: 2025,
      },
      {
        name: "PCX 160",
        vehicleType: "ice" as const,
        engineCc: 160,
        year: 2025,
      },
      {
        name: "Click 160",
        vehicleType: "ice" as const,
        engineCc: 160,
        year: 2025,
      },
    ],
  },
  {
    slug: "yamaha",
    name: "Yamaha",
    models: [
      {
        name: "Fino 125",
        vehicleType: "ice" as const,
        engineCc: 125,
        year: 2025,
      },
      {
        name: "NMAX 155",
        vehicleType: "ice" as const,
        engineCc: 155,
        year: 2025,
      },
      {
        name: "XMAX 300",
        vehicleType: "ice" as const,
        engineCc: 300,
        year: 2025,
      },
    ],
  },
  {
    slug: "vinfast",
    name: "VinFast",
    models: [
      {
        name: "Klara S",
        vehicleType: "ev" as const,
        batteryCapacityKwh: "2.00",
        year: 2025,
      },
      {
        name: "Feliz S",
        vehicleType: "ev" as const,
        batteryCapacityKwh: "3.50",
        year: 2025,
      },
    ],
  },
  {
    slug: "suzuki",
    name: "Suzuki",
    models: [
      {
        name: "Address 110",
        vehicleType: "ice" as const,
        engineCc: 110,
        year: 2025,
      },
    ],
  },
];

const COLOR_SEED = [
  { name: "ຂາວ", hexCode: "#FFFFFF" },
  { name: "ດຳ", hexCode: "#000000" },
  { name: "ແດງ", hexCode: "#DC2626" },
  { name: "ຟ້າ", hexCode: "#2563EB" },
  { name: "ເງິນ", hexCode: "#C0C0C0" },
  { name: "ຂຽວ", hexCode: "#16A34A" },
];

async function seedInventoryMasterData() {
  try {
    logger.info("Starting inventory master data seed...");

    for (const color of COLOR_SEED) {
      const existing = await db
        .select({ id: colors.id })
        .from(colors)
        .where(eq(colors.name, color.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(colors).values(color);
        logger.info(`Created color: ${color.name}`);
      }
    }

    for (const brand of BRAND_SEED) {
      const existingBrand = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.slug, brand.slug))
        .limit(1);

      let brandId = existingBrand[0]?.id;

      if (!brandId) {
        const [created] = await db
          .insert(brands)
          .values({ name: brand.name, slug: brand.slug })
          .returning({ id: brands.id });
        brandId = created?.id;
        logger.info(`Created brand: ${brand.name}`);
      } else {
        logger.info(`Brand already exists: ${brand.name}`);
      }

      if (!brandId) continue;

      for (const model of brand.models) {
        const existingModel = await db
          .select({ id: models.id })
          .from(models)
          .where(
            and(eq(models.brandId, brandId), eq(models.name, model.name)),
          )
          .limit(1);

        if (existingModel.length > 0) continue;

        await db.insert(models).values({
          brandId,
          name: model.name,
          vehicleType: model.vehicleType,
          engineCc: "engineCc" in model ? model.engineCc : null,
          batteryCapacityKwh:
            "batteryCapacityKwh" in model ? model.batteryCapacityKwh : null,
          year: model.year,
        });
        logger.info(`Created model: ${brand.name} ${model.name}`);
      }
    }

    logger.info("Inventory master data seed completed successfully!");
  } catch (error) {
    logger.error("Inventory seed failed:", error);
    process.exit(1);
  }
}

seedInventoryMasterData();
