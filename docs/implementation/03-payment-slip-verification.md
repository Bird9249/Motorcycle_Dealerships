# แผน Implement: 03 — Payment & Slip Verification

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) § 3

## เป้าหมาย

รองรับการรับชำระผ่าน **Mobile Banking** ด้วยการอัปโหลดสลิป และ **แยกบัญชีตามช่องทาง** เพื่อ Reconcile ยอดเงินท้ายวัน

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| 02 — Sales | `sales_orders` สำหรับผูก payment |
| Upload module | อัปโหลดสลิป (S3/MinIO) |
| Phase 0 — Payment Accounts | บัญชีรับเงิน (เงินสด, ธนาคาร A, B) |

## สถานะปัจจุบัน

> อัปเดตเมื่อเทียบกับ codebase — โมดูล Payment implement ครบ Phase 3.1–3.6

| ส่วน | สถานะ |
|---|---|
| Schema `payment_accounts`, `payments`, `daily_reconciliations` | ✅ Phase 3.1 |
| โมดูล `src/modules/payments/` | ✅ ครบ (accounts, record, verify, reconcile, UI) |
| RBAC `payments:*` | ✅ + `rbac:sync` |
| API `/api/payments/*` | ✅ |
| Frontend Settings tab ບັນຊີຮັບເງິນ | ✅ |
| Frontend 4 หน้า + sidebar + deep link | ✅ Phase 3.5 |
| Acceptance scripts | ✅ `bun run test:payments` (core + schedule + reconciliation) |
| **02 — Sales** (`sales_orders`, `payment_schedules`) | ✅ พร้อม |
| **Upload** (presign + `GET /api/files/*`) | ✅ พร้อม — reuse pattern จาก inventory |
| **อัปเดต schedule → `paid`** | ✅ verify payment อัปเดต schedule + partial payment |
| **Record / verify payment API** | ✅ Phase 3.2–3.3 |

## ลำดับ Implement ที่แนะนำ

```
Phase 0 (ขาด): payment_accounts schema + seed + Settings CRUD
    ↓
Phase 3.1: payments + daily_reconciliations schema, RBAC, seed accounts
    ↓
Phase 3.2: record payment + link order/schedule + slip upload + audit
    ↓
Phase 3.3: verify/reject + อัปเดต payment_schedules.paid
    ↓
Phase 3.4: reconciliation
    ↓
Phase 3.5: frontend 4 หน้า + sidebar + deep link จาก Sales
    ↓
Phase 3.6: acceptance scripts (`bun run test:payments`)
```

## Module Structure

```
src/modules/payments/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── payments.ts
│   │   ├── payment-accounts.ts
│   │   └── reconciliation.ts
│   ├── http/payments.routes.ts
│   ├── repo/
│   ├── service/
│   │   ├── record-payment.ts
│   │   ├── verify-slip.ts
│   │   └── daily-reconciliation.ts
│   └── types.ts
└── presentation/
    ├── pages/
    │   ├── PaymentsPage.tsx
    │   ├── PaymentCreatePage.tsx
    │   ├── PaymentDetailPage.tsx
    │   └── ReconciliationPage.tsx
    └── ui/
        ├── PaymentsTable.tsx
        ├── PaymentsFilter.tsx
        ├── PaymentCreateForm.tsx
        ├── PaymentLinkPicker.tsx
        ├── SalesOrderCombobox.tsx
        ├── SlipUploader.tsx
        ├── QRCodeDisplay.tsx
        ├── PaymentSlipPreview.tsx
        ├── PaymentVerifyActions.tsx
        └── ReconciliationSummary.tsx
```

## Database Schema

### `payment_accounts` (Master Data — Phase 0)

```typescript
{
  id, name                    // "เงินสดหน้าร้าน", "BCEL - บัญชี A"
  type: 'cash' | 'bank_transfer'
  bankName: string | null      // BCEL, JDB, LDB ...
  accountNumber: string | null
  currency: 'LAK' | 'THB' | 'USD'
  qrCodeImageKey: string | null  // QR สำหรับให้ลูกค้าโอน
  isActive: boolean
  displayOrder: int
}
```

### `payments`

```typescript
{
  id: uuid
  paymentNumber: string        // PAY-YYYYMMDD-XXXX
  salesOrderId: uuid | null    // FK → sales_orders (nullable สำหรับรับเงินล่วงหน้า)
  paymentScheduleId: uuid | null  // FK → payment_schedules (งวด in-house)

  paymentAccountId: uuid       // FK → payment_accounts
  amount: decimal
  currency: 'LAK' | 'THB' | 'USD'

  paymentMethod: 'cash' | 'bank_transfer'
  paidAt: timestamp            // วันเวลาที่ลูกค้าโอน/จ่าย

  // Slip
  slipImageKey: string | null  // S3 key
  slipVerified: boolean
  slipVerifiedAt: timestamp | null
  slipVerifiedBy: uuid | null

  status: 'pending' | 'verified' | 'rejected'
  notes: text | null

  recordedBy: uuid             // พนักงานขายที่บันทึก
  createdAt, updatedAt
}
```

### `daily_reconciliations`

```typescript
{
  id, reconciliationDate: date
  paymentAccountId: uuid
  expectedAmount: decimal      // คำนวณจาก payments verified ในวันนั้น
  actualAmount: decimal | null // กรอก manual จากนับเงินจริง
  difference: decimal | null // actual - expected
  status: 'open' | 'balanced' | 'discrepancy'
  notes: text | null
  reconciledBy: uuid | null
  reconciledAt: timestamp | null
}
```

## RBAC Permissions

```typescript
payments: {
  create: "payments:create",
  read: "payments:read",
  update: "payments:update",
  verify: "payments:verify",
  reject: "payments:reject",
  reconcile: "payments:reconcile",
}
// Labels: payments → "ການຊຳລະເງິນ"
```

เพิ่มใน `src/modules/roles/domain/contracts/permissions.ts` แล้วรัน `bun run rbac:sync`

## Audit Actions

บันทึกผ่าน `append-audit` + allowlist ใน `audit.policy.impl.ts`:

| Action | เมื่อไหร่ |
|---|---|
| `PAYMENT.CREATE` | บันทึกการชำระใหม่ |
| `PAYMENT.VERIFY` | ยืนยันสลิป |
| `PAYMENT.REJECT` | ปฏิเสธสลิป |
| `PAYMENT_ACCOUNT.CREATE` | สร้างบัญชีรับเงิน (Settings) |
| `PAYMENT_ACCOUNT.UPDATE` | แก้บัญชี / อัปโหลด QR |
| `RECONCILIATION.UPSERT` | บันทึก reconcile ท้ายวัน |

Entity type แนะนำ: `payment`, `payment_account`, `daily_reconciliation`

## Payment Number Generator

รูปแบบเดียวกับ Sales order number:

```
PAY-YYYYMMDD-XXXX
// ตัวอย่าง: PAY-20260709-0001
// XXXX = running sequence ต่อวัน (4 หลัก zero-pad)
```

อ้างอิง implementation: `generate-order-number` ในโมดูล sales

## Error Codes

แมปใน `domain/http/map-error.ts` (pattern เดียวกับ sales):

| Code | HTTP | ความหมาย |
|---|---|---|
| `NOT_FOUND` | 404 | payment / account / order / schedule ไม่พบ |
| `VALIDATION_LINK` | 422 | ต้องมี `salesOrderId` หรือ `paymentScheduleId` อย่างน้อยหนึ่ง |
| `SLIP_REQUIRED` | 422 | `bank_transfer` ต้องมี `slipImageKey` |
| `ALREADY_VERIFIED` | 409 | verify ซ้ำ |
| `ALREADY_REJECTED` | 409 | reject ซ้ำ |
| `INVALID_STATUS` | 422 | เปลี่ยนสถานะไม่ได้ (เช่น verify payment ที่ rejected แล้ว) |
| `AMOUNT_EXCEEDS_DUE` | 422 | partial รวมแล้วเกินยอดงวด/ค้างชำระ |
| `CURRENCY_MISMATCH` | 422 | สกุลเงินไม่ตรง order/schedule/account |
| `FORBIDDEN_VERIFY` | 403 | ไม่มี `payments:verify` |

## API Endpoints

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/payments` | `payments:read` | List + filter (date, account, status) |
| GET | `/api/payments/:id` | `payments:read` | รายละเอียด + `slipUrl` (`/api/files/{key}`) |
| POST | `/api/payments` | `payments:create` | บันทึกการชำระ + แนบสลิป |
| POST | `/api/payments/:id/verify` | `payments:verify` | ยืนยันสลิป |
| POST | `/api/payments/:id/reject` | `payments:reject` | ปฏิเสธสลิป |
| GET | `/api/payments/accounts` | `payments:read` | รายการบัญชีรับเงิน |
| GET | `/api/payments/accounts/:id/qr` | `payments:read` | QR code สำหรับโอน |
| GET | `/api/payments/reconciliation` | `payments:reconcile` | สรุปยอดตามวัน/บัญชี |
| POST | `/api/payments/reconciliation` | `payments:reconcile` | บันทึก reconcile ท้ายวัน |
| GET | `/api/payments/reconciliation/:date` | `payments:reconcile` | รายละเอียด reconcile วันนั้น |

ลงทะเบียนใน `src/server/api/rest/index.ts` เป็น prefix `/payments` (ผ่าน `src/modules/payments/api/index.ts`)

### Payment Accounts CRUD (Settings — Phase 0 / 3.1)

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/payments/accounts` | `payments:read` | รายการบัญชี (active filter) |
| POST | `/api/payments/accounts` | `payments:update` | สร้างบัญชี (admin) |
| PUT | `/api/payments/accounts/:id` | `payments:update` | แก้ไข + อัปโหลด QR key |
| PATCH | `/api/payments/accounts/:id/status` | `payments:update` | เปิด/ปิด `isActive` |

> UI: tab ใหม่ **«ບັນຊີຮັບເງິນ»** ใน `SettingsPage` (ไม่ใส่ใน Master Data — แยกจาก brands/models)

## File Upload & Read Pattern

ใช้ module upload ที่มีอยู่แล้ว — **ไม่ต้องสร้าง presigned read URL แยก**

| ขั้นตอน | API / Component |
|---|---|
| อัปโหลดสลิป | `POST /api/upload/presign` → PUT ไป MinIO → เก็บ `slipImageKey` |
| แสดงสลิป | `GET /api/files/{slipImageKey}` หรือ `AppImage` / `PresignedFileUpload` |
| อัปโหลด QR บัญชี | `ImageKeyUploadField` ใน Settings → เก็บ `qrCodeImageKey` |

อ้างอิง: `VehicleDocumentsPanel`, `src/modules/upload/domain/http/files.routes.ts`

## Integration จาก Sales (02)

| จุดเชื่อม | รายละเอียด |
|---|---|
| `SaleDetailPage` | ปุ่ม «ຮັບຊຳລະ» → `/app/payments/new?salesOrderId=...` |
| `PaymentSchedulePage` | ปุ่ม «ຊຳລະງວດ» ต่อแถว `pending`/`overdue` → `?paymentScheduleId=...` |
| ยอดค้างชำระ | คำนวณจาก `schedule.amount - SUM(verified payments)` หรือ `salePrice` สำหรับ cash |
| อัปเดต schedule | เมื่อ verify payment ที่ผูก `paymentScheduleId` → set `status: paid`, `paidAt`, `paidAmount` |
| ปิด gap ใน doc 02 | ✅ mark `[x]` ข้อ `paid/paidAt` ใน [02-sales-financing.md](./02-sales-financing.md) |

## Bank Finance vs Customer Payment

**แยก concern ชัดเจน** — อย่าปนกับ `financeTransferReceived` ใน Sales:

| ประเภท | จัดการโดย | หมายเหตุ |
|---|---|---|
| เงินโอนจากไฟแนนซ์ (bank → ร้าน) | **Sales** — `PATCH .../finance-transfer` | ไม่ผ่านโมดูล Payment |
| เงินจากลูกค้า (ดาวน์ / ซื้อสด / งวดผ่อน) | **Payment (03)** | อัปโหลดสลิป + verify |

Payment module รับชำระจาก **ลูกค้า** เท่านั้นใน MVP

## Partial Payment Logic

MVP รองรับ partial — กำหนดดังนี้:

1. งวดหนึ่ง (`paymentScheduleId`) รับชำระได้หลาย `payments` (แต่ละรายการ verify แยก)
2. `paidAmount` บน schedule = **ผลรวม** `amount` ของ payments ที่ `status === 'verified'` สำหรับงวดนั้น
3. เมื่อ `paidAmount >= schedule.amount` → `status = paid`, `paidAt` = เวลา verify ครั้งสุดท้ายที่ทำให้ครบ
4. ถ้า `paidAmount < schedule.amount` → schedule ยัง `pending` (หรือ `overdue` ถ้าเลย due)
5. ไม่รองรับ overpay เกินยอดงวดใน MVP (`AMOUNT_EXCEEDS_DUE`)

## Reject Workflow

```
pending → (reject) → rejected
```

- Reject **ไม่ลบ** record — เก็บ audit + `slipVerifiedBy` / เหตุผลใน `notes`
- พนักงานขายสร้าง **payment ใหม่** แนบสลิปใหม่ (ไม่แก้ record ที่ rejected)
- Payment ที่ `rejected` ไม่นับใน reconciliation และไม่นับใน `paidAmount` ของ schedule
- (ทางเลือกภายหลัง) อนุญาต re-open rejected → pending ถ้าต้องการ UX แก้สลิป record เดิม

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/payments` | รายการชำระ | Table + filter (วันที่, บัญชี, สถานะ) |
| `/app/payments/new` | รับชำระ | เลือก order/งวด → บัญชี → อัปโหลดสลิป |
| `/app/payments/:id` | รายละเอียด | ดูสลิป + verify/reject |
| `/app/payments/reconciliation` | Reconcile | สรุปยอดท้ายวันแยกบัญชี |

### Payment Create Flow

```
1. เลือก Sales Order (หรือ Payment Schedule งวด)
2. แสดงยอดค้างชำระ
3. เลือก Payment Account (เงินสด / ธนาคาร A / B)
4. แสดง QR Code ของบัญชี (ถ้า bank_transfer)
5. กรอกจำนวนเงิน + วันเวลาโอน
6. อัปโหลดสลิป (`PresignedFileUpload` / `SlipUploader` — `POST /api/upload/presign`)
7. บันทึก → status: `pending` (cash ที่ไม่มีสลิป → verify อัตโนมัติหรือรอหัวหน้า — ดู Business Rules)
```

### Payment Accounts UI (Settings)

```
Settings → tab «ບັນຊີຮັບເງິນ»
├── ตารางบัญชี (name, type, bank, currency, active)
├── ฟอร์มสร้าง/แก้ (รวมอัปโหลด QR ผ่าน ImageKeyUploadField)
└── เรียงลำดับ displayOrder
```

## Implementation Phases

### Phase 3.1 — Schema & Accounts (2–3 วัน)

- [x] Schema `payment_accounts`, `payments`, `daily_reconciliations`
- [x] Seed payment accounts (เงินสด, BCEL, JDB ฯลฯ) — `bun run seed:payment-accounts`
- [x] CRUD payment accounts ใน Settings (admin) — tab «ບັນຊີຮັບເງິນ»
- [x] RBAC permissions — `payments:*` + `bun run rbac:sync`

### Phase 3.2 — Payment Recording (4–5 วัน)

- [x] Record payment service — `recordPaymentService`
- [x] Link กับ sales order / payment schedule
- [x] อัปเดต schedule status → `paid` เมื่อ verify — `verifyPaymentService` + `syncScheduleAfterVerify`
- [x] Slip upload integration (`presign` → S3, อ่านผ่าน `/api/files/{key}` + `slipUrl` ใน API)
- [x] API routes + audit log — `PAYMENT.CREATE`, `PAYMENT.VERIFY`
- [x] Payment number generator (`PAY-YYYYMMDD-XXXX`)
- [x] Acceptance: `bun run test:payments`

### Phase 3.3 — Slip Verification (3–4 วัน)

- [x] Verify / Reject workflow — `verifyPaymentService`, `rejectPaymentService`, `POST /:id/reject`
- [x] Permission แยก: พนักงานขาย `create`, หัวหน้า/เจ้าของ `verify` — roles `staff` / `manager` ใน `roles.ts`
- [x] แสดงรูปสลิป (`GET /api/files/{slipImageKey}` / `AppImage`) — `PaymentDetailPage` + `PaymentSlipPreview`
- [x] Notification badge สำหรับ pending slips (optional MVP) — `GET /pending-count` + sidebar badge

### Phase 3.4 — Reconciliation (3–4 วัน)

- [x] คำนวณ expected amount จาก verified payments ตามวัน/บัญชี — `sumVerifiedAmountsByAccountForDay` + `getReconciliationSummary`
- [x] กรอก actual amount manual — `POST /api/payments/reconciliation`
- [x] แสดง difference + status — `balanced` / `discrepancy` / `open`
- [x] ReconciliationPage + ReconciliationSummary — `/app/payments/reconciliation`

### Phase 3.5 — Frontend (5–6 วัน)

- [x] PaymentsPage + PaymentsTable + PaymentsFilter (shadcn Select) — list + filter
- [x] PaymentCreatePage + PaymentLinkPicker + SalesOrderCombobox + SlipUploader + QRCodeDisplay — `/app/payments/new`
- [x] PaymentDetailPage (verify/reject actions) — Phase 3.3
- [x] ReconciliationPage — Phase 3.4
- [x] Sidebar: "ການຊຳລະເງິນ" → `/app/payments`
- [x] Deep link จาก `SaleDetailPage` / `PaymentSchedulePage`

### Phase 3.6 — Testing (1–2 วัน)

- [x] `test-payments-core-acceptance.ts` — create, verify, reject, list
- [x] `test-payments-schedule-acceptance.ts` — partial payment → schedule `paid`
- [x] `test-payments-reconciliation-acceptance.ts` — expected vs actual
- [x] รวมใน `package.json`: `test:payments` (chain ทั้ง 3 scripts)

## Scripts

| คำสั่ง | รายละเอียด |
|---|---|
| `bun run seed:payment-accounts` | seed เงินสด, BCEL, JDB ตัวอย่าง |
| `bun run test:payments` | รัน acceptance scripts ทั้งชุด |
| `bun run rbac:sync` | หลังเพิ่ม `payments:*` permissions |

## Business Rules

1. Payment ต้องผูก `salesOrderId` หรือ `paymentScheduleId` อย่างน้อยหนึ่ง
2. จำนวนเงิน + สกุลเงินต้องตรงกับ order/schedule (หรือ partial payment ได้ — MVP รองรับ partial)
3. **Slip required** สำหรับ `bank_transfer`; ไม่บังคับสำหรับ `cash`
4. Verify แล้วเท่านั้นที่นับใน reconciliation
5. Reject → พนักงานสร้าง payment ใหม่แนบสลิป (record เดิมคง `rejected`)
6. QR Code แสดงจาก `payment_accounts.qrCodeImageKey` (admin upload ใน Settings)
7. **Cash** — ไม่บังคับสลิป; MVP: บันทึก `pending` แล้วให้ผู้มี `payments:verify` ยืนยัน (หรือ auto-verify ถ้า policy อนุญาต)
8. Reconciliation นับเฉพาะ `verified` ที่ `paidAt` อยู่ในวันนั้น (ตาม timezone ร้าน)

## Acceptance Criteria

> **สถานะปัจจุบัน:** ผ่าน — รัน `bun run test:payments` ได้ครบ 3 scripts

- [x] พนักงานขายอัปโหลดสลิป BCEL One ได้
- [x] แยกยอดตามบัญชี (เงินสด / ธนาคาร A / B) ได้
- [x] Verify/Reject สลิป พร้อม audit trail
- [x] Reconcile ท้ายวัน: เปรียบเทียบ expected vs actual ได้
- [x] ชำระงวด in-house → schedule status อัปเดตเป็น `paid` (รวม partial payment)

## Definition of Done

อ้างอิง [README.md](./README.md) § Definition of Done:

- [x] Drizzle schema + `db:push` / migration
- [x] RBAC `payments:*` + `rbac:sync`
- [x] API routes (Elysia) + Zod contracts + `map-error.ts`
- [x] Repository + Service layer
- [x] React pages + TanStack Query hooks
- [x] Sidebar + route ใน `router.tsx` + `route-meta.ts`
- [x] Audit logging + allowlist entity types
- [x] `bun run test:payments` ผ่าน
- [x] อัปเดต doc 02 ข้อ `paid/paidAt` เป็น `[x]` (ดู [02-sales-financing.md](./02-sales-financing.md))

## โมดูลที่เกี่ยวข้อง

- **Sales (02)** — order + payment schedule; `financeTransferReceived` แยกจาก customer payment
- **Upload** — `POST /api/upload/presign` + `GET /api/files/{key}` สำหรับสลิปและ QR
- **Settings** — tab ບັນຊີຮັບເງິນ (payment accounts + QR codes)
