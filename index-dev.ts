import { serve } from "bun";
import indexHtml from "./src/index.html";
import app from "./src/server/index.js";

const server = serve({
  routes: {
    "/api/*": app.fetch,

    // Serve static files from dist/ before other routes
    "/*": indexHtml,
  },

  development: {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
