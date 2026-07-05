import { AppError } from "@/shared/errors";

export function mapInventoryError(
  error: unknown,
  status: (code: number, body?: unknown) => unknown,
) {
  if (!(error instanceof AppError)) {
    const message = error instanceof Error ? error.message : String(error);
    return status(500, { error: message });
  }

  switch (error.code) {
    case "NOT_FOUND":
      return status(404, { error: error.code, message: error.message });
    case "CONFLICT":
      return status(409, { error: error.code, message: error.message });
    case "FORBIDDEN_DELETE":
    case "FORBIDDEN_UPDATE":
      return status(403, { error: error.code, message: error.message });
    case "VALIDATION_ICE_CHASSIS":
    case "VALIDATION_ICE_ENGINE":
    case "VALIDATION_EV_BATTERY":
      return status(422, { error: error.code, message: error.message });
    default:
      return status(500, { error: error.code, message: error.message });
  }
}
