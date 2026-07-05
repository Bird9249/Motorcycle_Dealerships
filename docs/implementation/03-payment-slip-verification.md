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
        ├── PaymentForm.tsx
        ├── SlipUploader.tsx
        ├── PaymentAccountSelector.tsx
        ├── QRCodeDisplay.tsx
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
  verify: "payments:verify",
  reject: "payments:reject",
  reconcile: "payments:reconcile",
}
// Labels: payments → "ການຊຳລະເງິນ"
```

## API Endpoints

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/payments` | `payments:read` | List + filter (date, account, status) |
| GET | `/api/payments/:id` | `payments:read` | รายละเอียด + slip URL |
| POST | `/api/payments` | `payments:create` | บันทึกการชำระ + แนบสลิป |
| POST | `/api/payments/:id/verify` | `payments:verify` | ยืนยันสลิป |
| POST | `/api/payments/:id/reject` | `payments:reject` | ปฏิเสธสลิป |
| GET | `/api/payments/accounts` | `payments:read` | รายการบัญชีรับเงิน |
| GET | `/api/payments/accounts/:id/qr` | `payments:read` | QR code สำหรับโอน |
| GET | `/api/payments/reconciliation` | `payments:reconcile` | สรุปยอดตามวัน/บัญชี |
| POST | `/api/payments/reconciliation` | `payments:reconcile` | บันทึก reconcile ท้ายวัน |
| GET | `/api/payments/reconciliation/:date` | `payments:reconcile` | รายละเอียด reconcile วันนั้น |

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
6. อัปโหลดสลิป (SlipUploader — ใช้ presign upload)
7. บันทึก → status: pending
```

## Implementation Phases

### Phase 3.1 — Schema & Accounts (2–3 วัน)

- [ ] Schema `payment_accounts`, `payments`, `daily_reconciliations`
- [ ] Seed payment accounts (เงินสด, BCEL, JDB ฯลฯ)
- [ ] CRUD payment accounts ใน Settings (admin)
- [ ] RBAC permissions

### Phase 3.2 — Payment Recording (4–5 วัน)

- [ ] Record payment service
- [ ] Link กับ sales order / payment schedule
- [ ] อัปเดต schedule status → `paid` เมื่อ verify
- [ ] Slip upload integration (presign → S3)
- [ ] API routes + audit log

### Phase 3.3 — Slip Verification (3–4 วัน)

- [ ] Verify / Reject workflow
- [ ] Permission แยก: พนักงานขาย `create`, หัวหน้า/เจ้าของ `verify`
- [ ] แสดงรูปสลิป (presigned read URL)
- [ ] Notification badge สำหรับ pending slips (optional MVP)

### Phase 3.4 — Reconciliation (3–4 วัน)

- [ ] คำนวณ expected amount จาก verified payments ตามวัน/บัญชี
- [ ] กรอก actual amount manual
- [ ] แสดง difference + status
- [ ] ReconciliationPage + ReconciliationSummary

### Phase 3.5 — Frontend (5–6 วัน)

- [ ] PaymentsPage + PaymentsTable
- [ ] PaymentCreatePage + SlipUploader + QRCodeDisplay
- [ ] PaymentDetailPage (verify/reject actions)
- [ ] ReconciliationPage
- [ ] Sidebar: "ການຊຳລະເງິນ" → `/app/payments`

## Business Rules

1. Payment ต้องผูก `salesOrderId` หรือ `paymentScheduleId` อย่างน้อยหนึ่ง
2. จำนวนเงิน + สกุลเงินต้องตรงกับ order/schedule (หรือ partial payment ได้ — MVP รองรับ partial)
3. **Slip required** สำหรับ `bank_transfer`; ไม่บังคับสำหรับ `cash`
4. Verify แล้วเท่านั้นที่นับใน reconciliation
5. Reject → กลับไปให้พนักงานอัปโหลดสลิปใหม่
6. QR Code แสดงจาก `payment_accounts.qrCodeImageKey` (admin upload ใน settings)

## Acceptance Criteria

- [ ] พนักงานขายอัปโหลดสลิป BCEL One ได้
- [ ] แยกยอดตามบัญชี (เงินสด / ธนาคาร A / B) ได้
- [ ] Verify/Reject สลิป พร้อม audit trail
- [ ] Reconcile ท้ายวัน: เปรียบเทียบ expected vs actual ได้
- [ ] ชำระงวด in-house → schedule status อัปเดตเป็น `paid`

## โมดูลที่เกี่ยวข้อง

- **Sales (02)** — order + payment schedule
- **Upload** — presign upload/read สำหรับสลิป
- **Settings** — จัดการ payment accounts + QR codes
