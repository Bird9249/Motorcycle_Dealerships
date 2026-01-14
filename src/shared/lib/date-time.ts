import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Bangkok"; // UTC+7

/**
 * Format current date/time in UTC+7 timezone (Asia/Bangkok)
 * Returns format: "yyyy-MM-dd HH:mm:ss.SSS"
 */
export function formatNow(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss.SSS");
}

/**
 * Format date in UTC+7 timezone (Asia/Bangkok)
 * @param date - Date to format (Date object or ISO string)
 * @param formatStr - Format string (default: "yyyy-MM-dd HH:mm:ss.SSS")
 */
export function formatInLao(
  date: Date | string,
  formatStr = "yyyy-MM-dd HH:mm:ss.SSS",
): string {
  return formatInTimeZone(new Date(date), TIMEZONE, formatStr);
}

// Keep existing functions for backward compatibility
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm:ss");
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy");
}
