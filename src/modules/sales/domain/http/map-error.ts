import { AppError } from "@/shared/errors";

export function mapSalesError(
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
    case "FORBIDDEN_UPDATE":
    case "FORBIDDEN_CANCEL":
    case "FORBIDDEN_CONFIRM":
    case "FORBIDDEN_COMPLETE":
      return status(403, { error: error.code, message: error.message });
    case "VALIDATION_VEHICLE_STATUS":
    case "VALIDATION_FINANCE":
    case "VALIDATION_FINANCE_COMPANY":
    case "VALIDATION_LEASING":
    case "VALIDATION_EXCHANGE_RATE":
    case "CUSTOMER_HAS_SALES":
      return status(422, { error: error.code, message: error.message });
    default:
      return status(500, { error: error.code, message: error.message });
  }
}
