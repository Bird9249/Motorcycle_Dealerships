import { serve } from "bun";
import index from "./index.html";
import compliedApp from "./server/main.js";
import app from "./src/server/index.js";

const serverApi = process.env.NODE_ENV === "production" ? compliedApp : app;

const serviceWorkerFile = Bun.file(
  new URL(
    process.env.NODE_ENV === "production"
      ? "../dist/service-worker.js"
      : "./service-worker.ts",
    import.meta.url,
  ),
);
const manifestFile = Bun.file(
  new URL(
    process.env.NODE_ENV === "production"
      ? "../dist/manifest.webmanifest"
      : "./manifest.webmanifest",
    import.meta.url,
  ),
);

const server = serve({
  routes: {
    "/service-worker.js": new Response(serviceWorkerFile, {
      headers: {
        "Content-Type": "application/javascript",
      },
    }),

    "/manifest.webmanifest": new Response(manifestFile, {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    }),

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/*": serverApi.fetch,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
