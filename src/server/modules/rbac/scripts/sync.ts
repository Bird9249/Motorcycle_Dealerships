import { db } from "@/server/platform/db/client";
import { logger } from "../../../platform/observability/logger";
import { syncFromCode } from "../repo/sync-from-code";

await syncFromCode(db);
logger.info("RBAC permissions synced from code");
