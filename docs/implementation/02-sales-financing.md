# แผน Implement: 02 — Sales & Financing Options

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) § 2

## เป้าหมาย

รองรับการขายทั้ง **ซื้อสด** และ **ผ่อนชำระ 2 รูปแบบ** (ไฟแนนซ์ภายนอก / ร้านปล่อยเอง) พร้อม **Multi-Currency** (LAK / THB / USD)

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| 01 — Inventory | `vehicles` พร้อม status `in_stock` |
| 04 — Customers (Phase 1) | `customers` สำหรับผูกการขาย |
| Phase 0 — Exchange Rates | อัตราแลกเปลี่ยน |
| Phase 0 — Finance Companies | master data บริษัทไฟแนนซ์ |

## Module Structure

```
src/modules/sales/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── sales-orders.ts
│   │   ├── financing.ts
│   │   └── index.ts
│   ├── http/sales.routes.ts
│   ├── repo/
│   ├── service/
│   │   ├── create-sale.ts
│   │   ├── generate-payment-schedule.ts
│   │   └── convert-currency.ts
│   └── types.ts
└── presentation/
    ├── pages/
    │   ├── SalesPage.tsx
    │   ├── SaleCreatePage.tsx
    │   ├── SaleDetailPage.tsx
    │   └── PaymentSchedulePage.tsx
    └── ui/
        ├── SalesTable.tsx
        ├── SaleForm.tsx
        ├── FinancingTypeSelector.tsx
        ├── BankFinanceSection.tsx
        ├── InHouseLeasingSection.tsx
        ├── PaymentScheduleTable.tsx
        └── CurrencySelector.tsx
```

## Database Schema

### `finance_companies` (Master Data)

```typescript
{ id, name, code, contactPhone?, isActive, createdAt }
// ตัวอย่าง: Welcome, ວັດທະນາ, T-Ke
```

### `exchange_rates`

```typescript
{
  id, baseCurrency: 'USD', targetCurrency: 'LAK' | 'THB'
  rate: decimal, effectiveDate: date, createdAt
}
// MVP: manual entry ใน settings, ไม่ต้อง auto-fetch
```

### `sales_orders`

```typescript
{
  id: uuid
  orderNumber: string        // auto: SO-YYYYMMDD-XXXX
  vehicleId: uuid            // FK → vehicles
  customerId: uuid             // FK → customers
  salespersonId: uuid          // FK → users

  // ราคา
  salePrice: decimal
  saleCurrency: 'LAK' | 'THB' | 'USD'
  exchangeRateUsed: decimal | null  // snapshot ณ วันขาย

  // ประเภทการขาย
  paymentType: 'cash' | 'bank_finance' | 'in_house_leasing'

  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'

  // Bank Finance
  financeCompanyId: uuid | null
  financeApprovedAmount: decimal | null
  financeTransferReceived: boolean
  financeTransferDate: date | null

  // In-House Leasing
  downPayment: decimal | null
  downPaymentCurrency: 'LAK' | 'THB' | 'USD' | null
  installmentMonths: int | null
  interestRatePercent: decimal | null   // ดอกเบี้ย % ต่อปี
  monthlyInstallment: decimal | null

  notes: text | null
  soldAt: timestamp | null
  createdAt, updatedAt, createdBy
}
```

### `payment_schedules` (In-House Leasing)

```typescript
{
  id, salesOrderId
  installmentNumber: int       // 1, 2, 3, ...
  dueDate: date
  amount: decimal
  currency: 'LAK' | 'THB' | 'USD'
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  paidAt: timestamp | null
  paidAmount: decimal | null
}
```

## RBAC Permissions

```typescript
sales: {
  create: "sales:create",
  read: "sales:read",
  update: "sales:update",
  cancel: "sales:cancel",
  confirm: "sales:confirm",
}
// Labels: sales → "ການຂາຍ"
```

## API Endpoints

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/sales/orders` | `sales:read` | List orders + filter |
| GET | `/api/sales/orders/:id` | `sales:read` | รายละเอียด + price conversions |
| POST | `/api/sales/orders` | `sales:create` | สร้าง order (draft) |
| PUT | `/api/sales/orders/:id` | `sales:update` | แก้ draft |
| POST | `/api/sales/orders/:id/confirm` | `sales:confirm` | ยืนยันขาย → vehicle `sold` |
| POST | `/api/sales/orders/:id/complete` | `sales:confirm` | ปิดการขาย `confirmed → completed` |
| POST | `/api/sales/orders/:id/cancel` | `sales:cancel` | ยกเลิก → vehicle `in_stock` |
| GET | `/api/sales/orders/:id/schedule` | `sales:read` | ตารางผ่อนชำระ |
| POST | `/api/sales/schedule/preview` | `sales:read` | Preview ค่างวด (stateless) |
| POST | `/api/sales/orders/:id/schedule/preview` | `sales:create` | Preview ค่างวดจาก order |
| PATCH | `/api/sales/orders/:id/finance-transfer` | `sales:update` | ติดตามเงินโอนไฟแนนซ์ |
| GET | `/api/sales/orders/:id/price-conversions` | `sales:read` | ราคาเทียบสกุล |
| POST | `/api/sales/convert-currency` | `sales:read` | แปลงจำนวนเงิน |
| POST | `/api/sales/price-conversions/preview` | `sales:read` | preview ราคา 3 สกุล |
| GET | `/api/sales/finance-companies` | `sales:read` | Master data |
| POST | `/api/sales/finance-companies` | `sales:create` | สร้างบริษัทไฟแนนซ์ |
| PUT | `/api/sales/finance-companies/:id` | `sales:update` | แก้ไขบริษัทไฟแนนซ์ |
| PATCH | `/api/sales/finance-companies/:id/status` | `sales:update` | เปิด/ปิดใช้งาน |
| GET | `/api/sales/customers` | `sales:read` | ค้นหาลูกค้า |
| POST | `/api/sales/customers` | `sales:create` | สร้างลูกค้าขั้นต่ำ |
| GET | `/api/sales/customers/:id` | `sales:read` | รายละเอียดลูกค้า |
| PUT | `/api/sales/customers/:id` | `sales:update` | แก้ไขลูกค้า |
| GET | `/api/sales/exchange-rates` | `sales:read` | อัตราแลกเปลี่ยนล่าสุด |
| GET | `/api/sales/exchange-rates/history` | `sales:read` | ประวัติอัตราแลกเปลี่ยน |
| PUT | `/api/sales/exchange-rates` | `sales:update` | bulk upsert LAK+THB |
| POST | `/api/sales/payment-schedules/mark-overdue` | `sales:update` | mark งวดเลย due เป็น overdue |

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/sales` | รายการขาย | Table + filter (status, type, date) |
| `/app/sales/new` | สร้างการขาย | Wizard: เลือกรถ → ลูกค้า → ประเภทชำระ |
| `/app/sales/:id` | รายละเอียด | ข้อมูลขาย + financing + link ไป payment |
| `/app/sales/:id/schedule` | ตารางผ่อน | Payment schedule (in-house only) |

### Sale Form Flow

```
Step 1: เลือกรถ (in_stock เท่านั้น)
Step 2: เลือก/สร้างลูกค้า
Step 3: กำหนดราคา + สกุลเงิน
Step 4: เลือกประเภทชำระ
    ├── ซื้อสด (cash)
    ├── ไฟแนนซ์ (bank_finance) → เลือกบริษัท + วงเงิน
    └── ผ่อนร้าน (in_house_leasing) → ดาวน์ + งวด + ดอกเบี้ย → preview schedule
Step 5: ยืนยัน
```

## Implementation Phases

### Phase 2.1 — Schema & Master Data (2–3 วัน)

- [x] Schema `finance_companies`, `exchange_rates`, `sales_orders`, `payment_schedules`
- [x] Seed finance companies (`bun run seed:finance`)
- [x] RBAC permissions (`sales:*` + `bun run rbac:sync`)

> **หมายเหตุ:** เพิ่ม `customers` table ขั้นต่ำใน `schema/customers.ts` เพื่อ FK ของ `sales_orders` (CRM UI อยู่ after-sales Phase 1)

### Phase 2.2 — Sales Core (5–6 วัน)

- [x] Create/Update/Cancel sale service
- [x] Confirm sale → update vehicle status `sold`, set `soldAt`
- [x] Order number generator
- [x] API routes + audit log

### Phase 2.3 — Financing Logic (4–5 วัน)

- [x] **Bank Finance** — บันทึกบริษัท, วงเงิน, สถานะรับเงินจากไฟแนนซ์
- [x] **In-House Leasing** — คำนวณค่างวด:

  ```
  monthly = (principal - downPayment) × [r(1+r)^n] / [(1+r)^n - 1]
  r = interestRatePercent / 12 / 100
  n = installmentMonths
  ```

- [x] Generate `payment_schedules` อัตโนมัติเมื่อ confirm
- [x] Preview endpoint (ไม่บันทึก)

### Phase 2.4 — Multi-Currency (2–3 วัน)

- [x] Currency selector ใน form
- [x] Snapshot `exchangeRateUsed` ณ วันขาย
- [x] แสดงราคาเทียบสกุลอื่น (read-only conversion)

### Phase 2.5 — Frontend (6–7 วัน)

- [x] SalesPage + SalesTable
- [x] SaleCreatePage (multi-step wizard)
- [x] SaleDetailPage
- [x] PaymentSchedulePage + PaymentScheduleTable
- [x] Sidebar: "ການຂາຍ" → `/app/sales`

> **Phase 2.1–2.5:** core backend + frontend MVP เสร็จแล้ว — รายการด้านล่างเป็นงานเสริม/ปิด gap ก่อนถือว่า module สมบูรณ์

### Phase 2.6 — Polish & Gaps (งานที่ยังต้องทำ)

#### Frontend / UX

- [x] **แก้ไข draft order** — หน้า `/app/sales/$id/edit` + ปุ่ม Edit ใน detail/table (`PUT /api/sales/orders/:id`)
- [x] **Preview ตารางผ่อนใน wizard** — `InHouseLeasingSection.onPreview` + `POST /api/sales/schedule/preview` (stateless)
- [x] **Filter ตามวันที่** — SalesPage: ช่วง `createdAt` / `soldAt`
- [x] ใช้ `CurrencySelect` ใน wizard แทน `<select>` ธรรมดา
- [x] (ทางเลือก) Confirm จาก wizard ขั้น 5 โดยตรง — checkbox «ຢືນຢັນທັນທີ»

#### Master Data & Settings

- [x] **Exchange rates UI** — tab Settings + `PUT /api/sales/exchange-rates` (bulk upsert LAK+THB)
- [x] **Finance companies CRUD UI** — tab ໄຟແນນ ใน Master Data + CRUD API
- [x] **Customers CRM เต็มรูปแบบ** — `/app/sales/customers` + `GET/PUT /api/sales/customers/:id`

#### Business Logic ที่ยังไม่ครบ

- [x] สถานะ order **`completed`** — `POST /api/sales/orders/:id/complete` + ปุ่ม «ປິດການຂາຍ» ใน detail
- [x] Schedule status **`overdue`** — worker interval + `POST /api/sales/payment-schedules/mark-overdue` + `bun run sales:mark-overdue`
- [x] บันทึก **`paid` / `paidAt`** บน schedule — อัปเดตเมื่อ verify payment (Phase 3.2)
- [x] (ทางเลือก) เก็บ **`soldAt` ที่ `vehicles`** — set ตอน confirm พร้อม snapshot ที่ `sales_orders.soldAt`

- [x] อัปเดตตาราง **API Endpoints** ด้านบนให้ครบ endpoint จริง

#### ทดสอบ & Acceptance

- [x] รวมสคริปต์ acceptance เป็นชุดเดียว (`bun run test:sales`):
  - `test-sales-core-acceptance.ts`
  - `test-sales-financing-acceptance.ts`
  - `test-sales-multi-currency-acceptance.ts`
- [x] Mark **Acceptance Criteria** ด้านล่างเป็น `[x]` หลังรัน API acceptance ครบ
- [ ] (ทางเลือก) Joyride tour หน้า Sales เหมือน inventory / master-data

#### โมดูลถัดไป (นอก scope Phase 2)

- [ ] **Payment (03)** — รับชำระจากลูกค้า/ไฟแนนซ์ (Phase 3.2 record+verify ✅; UI/reject/reconcile ยังเหลือ)
- [ ] **After-Sales (04)** — warranty record เมื่อ confirm sale; CRM ลูกค้าเต็มรูปแบบ

## Business Rules

1. ขายได้เฉพาะรถ `in_stock` — confirm แล้วเปลี่ยนเป็น `sold`
2. Cancel ก่อน confirm → คืนรถเป็น `in_stock`
3. **Cash** — ไม่สร้าง payment schedule
4. **Bank Finance** — ติดตาม `financeTransferReceived` แยกจาก customer payment
5. **In-House** — สร้าง schedule ทันทีเมื่อ confirm; งวดแรก due = soldAt + 1 month
6. Exchange rate ใช้ค่าล่าสุด ณ วันขาย (manual entry MVP)

## Acceptance Criteria

> **สถานะปัจจุบัน:** ผ่าน API acceptance scripts ครบ (`bun run test:sales`) — Joyride tour ยังเป็น optional

- [x] ขายสด: confirm แล้วรถเป็น `sold`, สร้าง order สำเร็จ — API ✅ (`test-sales-core-acceptance.ts`)
- [x] ไฟแนนซ์: บันทึกบริษัท + ติดตามเงินโอนจากไฟแนนซ์ — API ✅; UI detail ✅
- [x] ผ่อนร้าน: คำนวณค่างวด + สร้าง schedule ครบทุกงวด — API ✅ (`test-sales-financing-acceptance.ts`)
- [x] ตั้งราคา/รับชำระ LAK, THB, USD ได้ — API ✅ (`test-sales-multi-currency-acceptance.ts`); wizard ✅
- [x] Preview ตารางผ่อนก่อนยืนยันได้ — API ✅; wizard UI ✅

## โมดูลที่เกี่ยวข้อง

- **Inventory** — vehicle status lifecycle
- **Customers** — buyer info
- **Payment (03)** — รับชำระจากลูกค้า/ไฟแนนซ์ อ้างอิง `salesOrderId`
- **After-Sales (04)** — สร้าง warranty record เมื่อ confirm sale
