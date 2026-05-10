import { Elysia } from "elysia";
import { serverContext } from "@/server/platform/http/context";
import { getObjectFromS3 } from "@/server/utils/s3-get-object";

/**
 * Stream ไฟล์จาก MinIO ตาม key
 * GET /files/uploads/demo/123.jpg → key = uploads/demo/123.jpg
 */
export const fileRoutes = new Elysia()
  .use(serverContext)
  .get("/*", async ({ request, status }) => {
    const pathname = new URL(request.url).pathname;
    const key = pathname.replace(/^(\/api)?\/files\/?/, "").replace(/^\//, "");

    if (!key) return status(400, { error: "Missing key" });

    const result = await getObjectFromS3(key);
    if (!result) return status(404, { error: "Not found" });

    const headers: Record<string, string> = {};
    if (result.contentType) headers["Content-Type"] = result.contentType;
    if (result.contentLength != null)
      headers["Content-Length"] = String(result.contentLength);

    return new Response(result.body, { status: 200, headers });
  });
