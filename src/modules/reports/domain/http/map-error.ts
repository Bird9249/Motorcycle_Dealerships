import type { Context } from "elysia";

export function mapReportsError(
  error: unknown,
  status: Context["status"],
): ReturnType<Context["status"]> {
  if (error instanceof Error) {
    return status(500, {
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
  return status(500, {
    error: "INTERNAL_ERROR",
    message: "Unknown error",
  });
}
