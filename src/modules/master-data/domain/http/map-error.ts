import { AppError } from "@/shared/errors";

export function mapMasterDataError(
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
    case "VALIDATION_ICE_BATTERY":
    case "VALIDATION_EV_ENGINE":
      return status(422, { error: error.code, message: error.message });
    default:
      return status(500, { error: error.code, message: error.message });
  }
}
