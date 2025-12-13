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

//   // Start audit worker with a short interval; tie stop to close hook
//   // Hybrid: keep polling as safety net (e.g., every 10s)
//   auditWorker.start(10_000);

//   // Ensure DB trigger exists
//   await ensureOutboxNotifyTrigger().catch((e) =>
//     logger.error("Ensure NOTIFY trigger failed", e),
//   );

//   // Ensure Timescale hypertable + policies (best effort)
//   await ensureOutboxHypertable().catch((e) =>
//     logger.error("Ensure Hypertable failed (Timescale)", e),
//   );
//   await ensureOutboxPolicies().catch((e) =>
//     logger.error("Ensure Policies failed (Timescale)", e),
//   );

//   // Subscribe to LISTEN/NOTIFY and flush on demand (debounced)
//   const listener = createOutboxListener(async () => {
//     try {
//       await auditWorker.flushOnce();
//     } catch (e) {
//       logger.error("Outbox flush on notify failed", e);
//     }
//   });
//   listener.start();
//   const onExit = () => {
//     try {
//       auditWorker.stop();
//     } catch {}
//     try {
//       listener.stop();
//     } catch {}
//   };
//   process.on("SIGINT", onExit);
//   process.on("SIGTERM", onExit);
// }
