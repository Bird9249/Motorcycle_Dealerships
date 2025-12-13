#!/usr/bin/env bun

import { syncFromCode } from "../modules/rbac/repo/sync-from-code";
import { createUserService } from "../modules/users/service/create";
import { db } from "../platform/db/client";
import { logger } from "../platform/observability/logger";

async function seedAdminUser() {
  try {
    logger.info("Starting admin user seed...");

    // 1. Sync RBAC roles first
    logger.info("Syncing RBAC roles...");
    await syncFromCode(db);
    logger.info("RBAC roles synced successfully");

    // 2. Create admin user within a transaction
    logger.info("Creating admin user...");
    await db.transaction(async (tx) => {
      const result = await createUserService(tx, {
        input: {
          email: "admin@admin.com",
          name: "Admin",
          password: "123456",
          roleId: "admin", // This will assign the admin role
        },
      });

      if (result.ok) {
        logger.info(
          `Admin user created successfully with ID: ${result.value.id}`,
        );
      } else {
        logger.error("Failed to create admin user:", result.error);
        throw new Error(`Failed to create admin user: ${result.error}`);
      }
    });

    logger.info("Admin user seed completed successfully!");
  } catch (error) {
    logger.error("Seed failed:", error);
    process.exit(1);
  }
}

// Run the seed function
seedAdminUser();
