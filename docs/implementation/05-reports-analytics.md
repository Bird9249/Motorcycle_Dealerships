# แผน Implement: 05 — Reports & Analytics

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) — ต่อยอดหลังโมดูลธุรกิจ 01–04

## เป้าหมาย

ให้เจ้าของร้านและผู้จัดการเห็น **ภาพรวมธุรกิจจริง** จากข้อมูลที่มีในระบบแล้ว — แทน Dashboard mock (โรงแรม) และปุ่ม «ດາວໂຫລດລາຍງານ» ที่ยังไม่ทำงาน

ระยะ MVP เน้น:

1. **Dashboard KPIs** — ตัวเลขสำคัญ + กราฟจาก DB จริง
2. **หน้ารายงานเฉพาะทาง** — ขาย / สต็อก / การเงิน / หลังการขาย
3. **Export CSV** — ดาวน์โหลดรายงานสำหรับ Excel / สรุปส่งเจ้าของ

> **ไม่รวมใน MVP:** PDF template, scheduled email, BI ภายนอก, กำไรขั้นสูง (COGS margin แยกรายคัน), พยากรณ์ AI

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| 01 — Inventory | `vehicles` status, cost/list price, ICE/EV |
| 02 — Sales | `sales_orders`, `payment_schedules`, financing types |
| 03 — Payment | `payments` (verified), `daily_reconciliations`, `payment_accounts` |
| 04 — After-Sales | `warranties`, `service_records`, expiring API |

> โมดูล 01–04 implement ครบแล้ว — Reports เป็น **read-only aggregation** บนตารางเดิม ไม่ต้อง schema ใหม่ใน MVP

## สถานะปัจจุบัน

> อัปเดตเมื่อเทียบกับ codebase

| ส่วน | สถานะ |
|---|---|
| โมดูล `src/modules/reports/` | ❌ ยังไม่มี |
| RBAC `reports:*` | ❌ |
| API `/api/reports/*` | ❌ |
| Dashboard (`/app/dashboard`) | ⚠️ UI จาก template โรงแรม + `mock.ts` |
| `WarrantyExpiryAlert` | ✅ ข้อมูลจริงจาก after-sales API |
| ปุ่ม «ດາວໂຫລດລາຍງານ» | ❌ ไม่มี handler |
| Reconciliation summary | ✅ อยู่ใน payments module (ใช้ซ้ำได้) |
| Pending payments count | ✅ `countPendingPayments` + sidebar badge |

## ปัญหาที่ต้องแก้ (จาก codebase)

| ปัญหา | แนวทาง |
|---|---|
| `StatCards`, `RevenueChart`, `OccupancyChart`, `RecentBookings`, `RoomStatus` ใช้ mock โรงแรม | แทนด้วย KPI/กราฟร้านมอเตอร์ หรือลบ component ที่ไม่เกี่ยว |
| ไม่มีหน้ารายงานแยก | เพิ่ม `/app/reports/*` |
| หลายสกุลเงิน (LAK/THB/USD) | **ห้ามรวมยอดข้ามสกุล** — แสดงแยกตาม currency |
| วันที่รายงาน | ใช้ timezone ร้าน (default `Asia/Vientiane`) + filter `dateFrom` / `dateTo` |

## Module Structure (แผน)

```
src/modules/reports/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── common.ts              # DateRangeQuery, ReportPeriod
│   │   ├── dashboard.ts
│   │   ├── sales-report.ts
│   │   ├── inventory-report.ts
│   │   ├── payments-report.ts
│   │   └── after-sales-report.ts
│   ├── http/
│   │   ├── reports.routes.ts
│   │   └── map-error.ts
│   └── repo/
│       ├── dashboard-kpis.ts
│       ├── sales-summary.ts
│       ├── inventory-snapshot.ts
│       ├── payments-summary.ts
│       └── after-sales-summary.ts
└── presentation/
    ├── api/client.ts, queries.ts
    ├── lib/labels.ts, format.ts
    ├── pages/
    │   ├── ReportsHubPage.tsx       # /app/reports
    │   ├── SalesReportPage.tsx
    │   ├── InventoryReportPage.tsx
    │   ├── PaymentsReportPage.tsx
    │   └── AfterSalesReportPage.tsx
    └── ui/
        ├── ReportDateRangeFilter.tsx
        ├── ReportKpiGrid.tsx
        ├── SalesTrendChart.tsx
        ├── PaymentByAccountChart.tsx
        ├── InventoryStatusChart.tsx
        ├── ReportDataTable.tsx
        └── ExportCsvButton.tsx

src/modules/dashboard/               # คง module เดิม — เปลี่ยนให้ consume reports API
├── presentation/pages/DashboardPage.tsx
└── presentation/ui/
    ├── DealershipKpiCards.tsx       # แทน StatCards
    ├── SalesTrendChart.tsx          # reuse หรือ import จาก reports
    ├── RecentSalesTable.tsx         # แทน RecentBookings
    ├── InventoryStatusSummary.tsx   # แทน RoomStatus
    └── WarrantyExpiryAlert.tsx      # คงเดิม
```

## Database Schema

**MVP: ไม่เพิ่มตารางใหม่** — query aggregate จาก:

| ตาราง | ใช้สำหรับรายงาน |
|---|---|
| `vehicles`, `models`, `brands` | สต็อกตาม status, ICE/EV, registration ready |
| `sales_orders` | ยอดขาย, ประเภทชำระ, สถานะ, ตามช่วง `soldAt` / `createdAt` |
| `payment_schedules` | งวดค้าง / overdue (in-house leasing) |
| `payments` | เงินรับ verified ตาม `paidAt`, แยกบัญชี |
| `daily_reconciliations` | สรุป reconcile รายวัน (link จาก payment report) |
| `customers` | ลูกค้าใหม่ในช่วงเวลา |
| `warranties` | active / expiring / expired |
| `service_records` | จำนวน check-in ตามประเภท |

**Phase ถัดไป (นอก MVP):**

- `report_export_jobs` — บันทึกประวัติ export / async job
- Materialized view สำหรับ dashboard ถ้า data โต

## RBAC Permissions

```typescript
reports: {
  read: "reports:read",       // ดู dashboard KPIs + หน้ารายงาน
  export: "reports:export",   // ดาวน์โหลด CSV
}
// Labels:
// reports → "ລາຍງານ"
```

| Role (แนะนำ) | `reports:read` | `reports:export` |
|---|---|---|
| `admin` / `manager` | ✅ | ✅ |
| `staff` (sales) | ✅ | ❌ |
| `staff` (inventory only) | optional | ❌ |

> Dashboard (`/app/dashboard`) ใช้ `reports:read` — ผู้ใช้ทั่วไปที่ไม่มีสิทธิ์ยังเข้า app ได้แต่ไม่เห็น KPI ทางการเงินละเอียด (หรือซ่อนการ์ดที่ต้องใช้ `payments:read`)

## API Endpoints

### Dashboard & Hub

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/reports/dashboard` | `reports:read` | KPI สรุป + sparkline data สำหรับแผงควบคุม |
| GET | `/api/reports/overview` | `reports:read` | สรุปสั้นสำหรับ Reports hub (links + counts) |

**Query ร่วม (`DateRangeQuerySchema`):**

```typescript
{
  dateFrom?: ISO date      // default: ต้นเดือนปัจจุบัน
  dateTo?: ISO date        // default: วันนี้
  period?: 'day' | 'week' | 'month'  // preset สำหรับ dashboard
}
```

**Response ตัวอย่าง `GET /api/reports/dashboard`:**

```typescript
{
  period: { dateFrom, dateTo },
  inventory: {
    inStock: number,
    reserved: number,
    sold: number,
    inService: number,
    evCount: number,
    iceCount: number,
  },
  sales: {
    confirmedCount: number,
    completedCount: number,
    byCurrency: Array<{ currency: 'LAK'|'THB'|'USD', totalAmount: string, count: number }>,
    byPaymentType: Array<{ paymentType: string, count: number }>,
  },
  payments: {
    pendingCount: number,
    verifiedTodayByAccount: Array<{ accountId, name, total: string, currency }>,
  },
  afterSales: {
    warrantiesExpiring30: number,
    serviceRecordsInPeriod: number,
  },
  trends: {
    salesByDay: Array<{ date: string, count: number, amountByCurrency: Record<string, string> }>,
  },
}
```

### รายงานรายละเอียด

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/reports/sales` | `reports:read` | สรุป + รายการคำสั่งขายในช่วง (paginated) |
| GET | `/api/reports/inventory` | `reports:read` | Snapshot สต็อก ณ วันที่ + breakdown status/brand |
| GET | `/api/reports/payments` | `reports:read` | ยอดรับ verified, แยกบัญชี/วัน, pending |
| GET | `/api/reports/after-sales` | `reports:read` | ประกัน + service check-in ในช่วง |
| GET | `/api/reports/sales/export` | `reports:export` | CSV คำสั่งขาย |
| GET | `/api/reports/payments/export` | `reports:export` | CSV การชำระ verified |
| GET | `/api/reports/inventory/export` | `reports:export` | CSV สต็อก snapshot |

> Reconciliation รายวัน — **ไม่ duplicate** — ลิงก์จาก Payment Report ไป `/app/payments/reconciliation?date=`

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/dashboard` | ແຜງຄວບຄຸມ | KPI จริง + กรามขาย + สต็อก + WarrantyExpiryAlert |
| `/app/reports` | ລາຍງານ (Hub) | การ์ดลิงก์ไปรายงานย่อย + ช่วงวันที่ร่วม |
| `/app/reports/sales` | ລາຍງານການຂາຍ | Filter วันที่, สรุปตามสกุล/ประเภทชำระ, ตาราง + export |
| `/app/reports/inventory` | ລາຍງານສຕັອກ | สถานะรถ, ICE/EV, เอกสารพร้อมทะเบียน, export |
| `/app/reports/payments` | ລາຍງານການເງິນ | ยอดรับแยกบัญชี, pending, ลิงก์ reconcile |
| `/app/reports/after-sales` | ລາຍງານຫຼັງຂາຍ | ประกันใกล้หมดอายุ, service ตามประเภท |

**Sidebar (แนะนำ):**

```
ພາບລວມ
  ແຜງຄວບຄຸມ
  ລາຍງານ          → /app/reports   (reports:read)
```

## Implementation Phases

### Phase 5.1 — Dashboard KPIs จริง (4–5 วัน)

- [ ] สร้าง `reports` module skeleton + `GET /api/reports/dashboard`
- [ ] Repo: `dashboard-kpis.ts` (inventory, sales, payments, after-sales aggregates)
- [ ] RBAC `reports:read` + `rbac:sync` + ผูก role manager/admin
- [ ] แทน mock ใน Dashboard:
  - [ ] `DealershipKpiCards` — สต็อก, ขายเดือนนี้, รับชำระ verified, pending
  - [ ] `SalesTrendChart` — จำนวนขาย/ยอดแยกสกุล 7–30 วัน
  - [ ] `RecentSalesTable` — คำสั่งขายล่าสุด (จาก `sales_orders`)
  - [ ] `InventoryStatusSummary` — แท่งสถานะ in_stock / reserved / sold
- [ ] ลบหรือ deprecate `mock.ts` + component โรงแรมที่ไม่ใช้
- [ ] อัปเดต copy Dashboard: «ພາບລວມຮ້ານຈຳໜ່າຍມໍເຕີ»

### Phase 5.2 — Reports Hub + Sales Report (4–5 วัน)

- [ ] `GET /api/reports/sales` + `SalesReportPage`
- [ ] `ReportDateRangeFilter` (preset: วันนี้ / สัปดาห์ / เดือน / กำหนดเอง)
- [ ] ตารางคำสั่งขายในช่วง + สรุปตาม `paymentType`, `status`, `saleCurrency`
- [ ] Route `/app/reports`, `/app/reports/sales` + sidebar «ລາຍງານ»
- [ ] `ReportsHubPage` — การ์ด 4 รายงาน

### Phase 5.3 — Inventory & Payments Reports (4–5 วัน)

- [ ] `GET /api/reports/inventory` + `InventoryReportPage`
  - [ ] Breakdown: status, vehicleType (ICE/EV), brand (top N)
  - [ ] มูลค่าสต็อก: sum `costPrice` / `listPrice` **แยกสกุล**
- [ ] `GET /api/reports/payments` + `PaymentsReportPage`
  - [ ] Reuse logic จาก `sumVerifiedAmountsByAccountForDay` ขยายเป็นช่วงวัน
  - [ ] แสดง pending count + ลิงก์ reconciliation
- [ ] กราฟ `PaymentByAccountChart`, `InventoryStatusChart`

### Phase 5.4 — After-Sales Report + Export CSV (3–4 วัน)

- [ ] `GET /api/reports/after-sales` + `AfterSalesReportPage`
  - [ ] Reuse `listExpiringWarranties` + count service by `serviceType`
- [ ] `reports:export` permission
- [ ] `GET /api/reports/{sales|payments|inventory}/export` → `text/csv`
- [ ] `ExportCsvButton` ในแต่ละหน้ารายงาน
- [ ] ปุ่ม «ດາວໂຫລດລາຍງານ» บน Dashboard → ไป hub หรือ export sales เดือนปัจจุบัน

### Phase 5.5 — Testing & Docs (2 วัน)

- [ ] `test-reports-acceptance.ts` — dashboard KPI shape, sales summary, CSV headers
- [ ] `bun run test:reports` ใน `package.json`
- [ ] อัปเดต doc นี้ + [README.md](./README.md) สถานะ Phase 5

## กฎธุรกิจ (Business Rules)

1. **ยอดขาย** — นับ `confirmed` + `completed` ที่มี `soldAt` ในช่วง (ไม่นับ `draft` / `cancelled`)
2. **รายได้รับ** — นับเฉพาะ `payments.status = 'verified'` ตาม `paidAt`
3. **Multi-currency** — ทุก API คืน `byCurrency[]`; UI แสดงแยก LAK / THB / USD ไม่แปลงรวมใน MVP
4. **สต็อก** — snapshot ณ `dateTo` (หรือ now) ตาม `vehicles.status` ปัจจุบัน
5. **กำไรขั้นต้น** — MVP ไม่คำนวณ margin อัตโนมัติ (ต้องใช้ cost + sale รายคัน — ทำใน Phase ถัดไป)
6. **สิทธิ์** — การ์ด «ยอดเงิน» บน Dashboard แสดงเมื่อมี `reports:read` (และอาจซ่อนถ้าไม่มี `payments:read` สำหรับรายละเอียดบัญชี)
7. **Timezone** — filter วันที่ใช้ `Asia/Vientiane` (hardcode MVP; ย้ายไป Settings ภายหลัง)

## KPI แนะนำ (Dashboard Cards)

| KPI | แหล่งข้อมูล | เปรียบเทียบ |
|---|---|---|
| ລົດພ້ອມຂາຍ (`in_stock`) | `vehicles.status` | vs สัปดาห์ก่อน (optional) |
| ການຂາຍເດືອນນີ້ | `sales_orders` confirmed+completed | vs เดือนก่อน |
| ຮັບຊຳລະທີ່ຢືນຢັນ | `payments` verified | เดือนนี้ แยกสกุล |
| ລໍຖ້າຢືນຢັນສລິບ | `countPendingPayments` | ปัจจุบัน |
| ປະກັນໃກ້ໝົດອາຍຸ | warranties expiring ≤30d | ปัจจุบัน |

## Acceptance Criteria

- [ ] Dashboard แสดงตัวเลขจาก DB จริง ไม่มี mock โรงแรม
- [ ] กรองรายงานตามช่วงวันที่ได้
- [ ] ยอดเงินแยกตามสกุลเงิน ไม่รวมผิดพลาดข้าม LAK/THB/USD
- [ ] Export CSV คำสั่งขายและการชำระได้
- [ ] RBAC `reports:read` / `reports:export` ทำงาน
- [ ] `bun run test:reports` ผ่าน

## Definition of Done

อ้างอิง [README.md](./README.md) § Definition of Done:

- [ ] ไม่มี schema ใหม่ (MVP) หรือ document เหตุผลถ้าเพิ่ม
- [ ] RBAC `reports:*` + `rbac:sync`
- [ ] API routes + Zod contracts + `map-error.ts`
- [ ] Repository aggregate queries (index-friendly: `soldAt`, `paidAt`, `status`)
- [ ] React pages + TanStack Query
- [ ] Sidebar + routes + `route-meta.ts`
- [ ] ลบ/แทน dashboard mock components
- [ ] Acceptance script + อัปเดต doc สถานะ

## โมดูลที่เกี่ยวข้อง

| โมดูล | การเชื่อม |
|---|---|
| **Inventory (01)** | รายงานสต็อก, KPI สถานะรถ |
| **Sales (02)** | รายงานขาย, กราฟแนวโน้ม, recent sales |
| **Payment (03)** | รายงานรับเงิน, pending, ลิงก์ reconciliation |
| **After-Sales (04)** | ประกันใกล้หมดอายุ, service stats |
| **Dashboard** | Consumer ของ `GET /api/reports/dashboard` |

## ลำดับ Implement ที่แนะนำ

```
Phase 5.1  Dashboard KPIs (คุณค่าสูงสุด — เห็นผลทันที)
    ↓
Phase 5.2  Reports Hub + Sales Report
    ↓
Phase 5.3  Inventory + Payments Reports
    ↓
Phase 5.4  After-Sales + CSV Export
    ↓
Phase 5.5  Tests + Docs
```

## อ้างอิงใน codebase ปัจจุบัน

| ไฟล์ | ใช้เป็นแนวทาง |
|---|---|
| `src/modules/dashboard/presentation/data/mock.ts` | **ลบ/แทน** |
| `src/modules/payments/domain/repo/payments.ts` | `sumVerifiedAmountsByAccountForDay`, `countPendingPayments` |
| `src/modules/payments/domain/service/reconciliation.ts` | `getReconciliationSummary` |
| `src/modules/after-sales/domain/repo/warranties.ts` | `listExpiringWarranties` |
| `src/modules/sales/domain/repo/sales-orders.ts` | list/filter pattern สำหรับ sales report |
| `src/modules/inventory/domain/repo/list-vehicles.ts` | filter + count by status |

## นอกขอบเขต MVP (บันทึกไว้ Phase 6+)

- PDF ใบสรุปรายวัน / รายเดือน (logo ร้าน)
- รายงานกำไรขั้นต้นต่อคัน (`salePrice - costPrice` แยกสกุล)
- รายงานงวดค้างชำระ (overdue schedules) + aging
- รายงานพนักงานขาย (leaderboard `salespersonId`)
- Scheduled export / ส่ง LINE/Email
- Custom dashboard widgets ต่อ user
