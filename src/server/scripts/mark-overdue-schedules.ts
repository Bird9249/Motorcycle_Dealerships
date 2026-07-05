#!/usr/bin/env bun

import { runMarkOverduePaymentSchedules } from "@/modules/sales/domain/workers/overdue-schedules.worker";

const result = await runMarkOverduePaymentSchedules();
console.info(`Marked ${result.count} schedule(s) overdue`);
