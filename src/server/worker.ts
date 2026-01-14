import { auditOutboxService } from "@/modules/audit/domain/workers/audit.worker";
import { closePgPool } from "@/server/shared/outbox/pg-client";

const { shutdown } = auditOutboxService;

// HTTP server for health check
const workerPort = process.env.WORKER_PORT
  ? Number.parseInt(process.env.WORKER_PORT, 10)
  : 3001;

Bun.serve({
  port: workerPort,
  fetch: (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "worker" });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.info(`Worker running on port ${workerPort}`);

const onExit = async () => {
  try {
    await shutdown();
  } catch {
    console.error("Error shutting down audit outbox service");
  }
  try {
    await closePgPool();
  } catch {
    console.error("Error closing pg pool");
  }

  process.exit(0);
};

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);
