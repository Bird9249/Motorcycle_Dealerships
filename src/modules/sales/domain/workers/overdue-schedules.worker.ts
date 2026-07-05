import { db } from "@/server/platform/db/client";
import { markOverduePaymentSchedules } from "../repo/payment-schedules-overdue";

const INTERVAL_MS = Number.parseInt(
  process.env.OVERDUE_SCHEDULE_INTERVAL_MS ?? String(60 * 60 * 1000),
  10,
);

export async function runMarkOverduePaymentSchedules() {
  const result = await db.transaction((tx) => markOverduePaymentSchedules(tx));
  if (result.count > 0) {
    console.info(
      `[sales] marked ${result.count} payment schedule(s) as overdue`,
    );
  }
  return result;
}

export function startOverdueSchedulesWorker() {
  void runMarkOverduePaymentSchedules();
  const timer = setInterval(() => {
    void runMarkOverduePaymentSchedules();
  }, INTERVAL_MS);
  return () => clearInterval(timer);
}
