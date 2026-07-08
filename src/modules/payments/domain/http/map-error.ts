import { AppError } from "@/shared/errors";

export function mapPaymentsError(
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
    case "VALIDATION_LINK":
    case "SLIP_REQUIRED":
    case "INVALID_STATUS":
    case "AMOUNT_EXCEEDS_DUE":
    case "CURRENCY_MISMATCH":
      return status(422, { error: error.code, message: error.message });
    case "ALREADY_VERIFIED":
    case "ALREADY_REJECTED":
      return status(409, { error: error.code, message: error.message });
    case "FORBIDDEN_VERIFY":
      return status(403, { error: error.code, message: error.message });
    default:
      return status(500, { error: error.code, message: error.message });
  }
}
