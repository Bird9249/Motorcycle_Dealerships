import { createServer } from "./platform/http/server";

const app = createServer();

// auth.api.createUser({
//   body: {
//     email: "admin@admin.com",
//     password: "123456",
//     name: "Admin",
//     role: "admin",
//   },
// });

export default app;

// if (process.env.NODE_ENV !== "test") {
//   if (process.env.RBAC_SYNC_ON_BOOT === "true") {
//     await syncFromCode(db)
//       .then(() => logger.info("RBAC permissions synced on boot"))
//       .catch((e) => logger.error("RBAC sync failed", e));
//   }
//   Bun.serve({
//     fetch: app.fetch,
//     port: env.PORT,
//   });
//   logger.info(`HTTP server running on :${env.PORT}`);

//   // Outbox service is automatically started when auditOutboxService is created
//   // pg-transactional-outbox handles polling internally based on config
//   // import { auditOutboxService } from "@/modules/audit/domain/workers/audit.worker";
//   // import { closePgPool } from "@/server/shared/outbox/pg-client";
//
//   const onExit = async () => {
//     try {
//       await auditOutboxService.shutdown();
//     } catch (e) {
//       logger.error("Error shutting down audit outbox service", e);
//     }
//     try {
//       await closePgPool();
//     } catch (e) {
//       logger.error("Error closing pg pool", e);
//     }
//   };
//   process.on("SIGINT", onExit);
//   process.on("SIGTERM", onExit);
// }
