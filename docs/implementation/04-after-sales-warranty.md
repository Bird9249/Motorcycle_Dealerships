# แผน Implement: 04 — After-Sales & Warranty

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) § 4

## เป้าหมาย

จัดการ **CRM ลูกค้า**, **ติดตามประกัน** (แยกตัวรถ/มอเตอร์/แบตเตอรี่) และ **Service Check-in** ระยะ MVP

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| 01 — Inventory | ข้อมูล vehicle/battery สำหรับ warranty |
| 02 — Sales | trigger สร้าง warranty เมื่อ confirm sale |
| (ไม่มี) | Customers module ควร implement ก่อน Sales (Phase 2 ใน roadmap) |

> **หมายเหตุ:** โมดูล Customers (`customers`) implement ใน Phase 1 ของไฟล์นี้ เพราะ Sales ต้องใช้ — ดู [README.md](./README.md)

## สถานะปัจจุบัน

> อัปเดตเมื่อเทียบกับ codebase — โมดูล After-Sales implement ครบ **Phase 4.1–4.4**

| ส่วน | สถานะ |
|---|---|
| Schema `customers` | ✅ (ใช้ร่วม Sales) |
| Customers CRM (Phase 4.1) | ✅ CRUD API + UI (detail + delete guard + service history) |
| RBAC `customers:*`, `after-sales:*` | ✅ + `rbac:sync` |
| API customers | ✅ `/api/sales/customers` (ใน sales module) |
| Frontend `/app/customers` | ✅ list + detail |
| Schema `warranties`, `warranty_settings`, `service_records` | ✅ |
| Warranty auto-create on confirm (ICE/EV) | ✅ Phase 4.2 |
| Warranty settings (Settings tab «ປະກັນ») | ✅ Phase 4.2 |
| Warranty tracking UI + Dashboard alert | ✅ Phase 4.3 |
| Service check-in + history | ✅ Phase 4.4 |
| โมดูล `src/modules/after-sales/` | ✅ ครบ (warranty + service) |
| API `/api/after-sales/*` | ✅ |
| Frontend หน้า after-sales + sidebar | ✅ |
| Acceptance scripts | ✅ `bun run test:sales` (รวม warranty + service records) |

## Module Structure (ตาม codebase จริง)

```
src/modules/sales/                    # Customers CRM (Phase 4.1)
├── domain/repo/customers.ts
├── domain/http/sales.routes.ts       # /api/sales/customers
└── presentation/
    ├── pages/CustomersPage.tsx
    ├── pages/CustomerDetailPage.tsx  # + ServiceHistoryTable
    └── ui/CustomerForm.tsx, CustomerOrdersTable.tsx

src/modules/after-sales/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── warranties.ts
│   │   ├── warranty-settings.ts
│   │   └── service-records.ts
│   ├── http/after-sales.routes.ts
│   ├── repo/
│   │   ├── warranties.ts
│   │   ├── warranty-settings.ts
│   │   └── service-records.ts
│   └── service/
│       ├── create-warranty-on-sale.ts
│       ├── create-service-record.ts
│       └── warranty-settings.ts
└── presentation/
    ├── pages/
    │   ├── WarrantiesPage.tsx
    │   ├── WarrantyDetailPage.tsx
    │   └── ServiceCheckInPage.tsx
    ├── api/client.ts, queries.ts
    └── ui/
        ├── WarrantyCard.tsx, WarrantiesFilter.tsx
        ├── ServiceRecordForm.tsx, ServiceHistoryTable.tsx
        └── SoldVehicleCombobox.tsx

src/modules/dashboard/presentation/ui/
└── WarrantyExpiryAlert.tsx             # Dashboard widget (Phase 4.3)
```

## Database Schema

### `customers` (Phase 1 — ใช้ร่วม Sales)

```typescript
{
  id: uuid
  fullName: string
  phone: string                // primary contact
  phoneSecondary: string | null

  // ที่อยู่ลาว
  village: string | null       // ບ້ານ
  district: string | null      // ເມືອງ
  province: string | null      // ແຂວງ

  // เอกสาร (สำหรับทะเบียนป้าย)
  idCardNumber: string | null
  householdBookNumber: string | null

  notes: text | null
  createdAt, updatedAt, createdBy
}
```

### `warranties`

```typescript
{
  id: uuid
  vehicleId: uuid              // FK → vehicles
  customerId: uuid             // FK → customers
  salesOrderId: uuid           // FK → sales_orders

  warrantyType: 'vehicle' | 'motor' | 'battery'

  startDate: date
  endDate: date
  durationMonths: int

  // Battery specific
  batterySerialNumber: string | null  // copy from vehicle

  status: 'active' | 'expired' | 'claimed' | 'voided'
  notes: text | null
  createdAt, updatedAt
}
```

### `service_records` (MVP Check-in)

```typescript
{
  id: uuid
  vehicleId: uuid
  customerId: uuid

  serviceType: 'oil_change' | 'battery_check' | 'electrical_check' | 'general'
  odometerKm: int | null
  description: text
  performedAt: timestamp
  performedBy: uuid            // FK → users

  // Battery/EV check (optional)
  batteryHealthPercent: int | null
  batteryNotes: text | null

  createdAt
}
```

## RBAC Permissions

```typescript
customers: {
  create: "customers:create",
  read: "customers:read",
  update: "customers:update",
  delete: "customers:delete",
}
afterSales: {
  read: "after-sales:read",
  createService: "after-sales:create-service",
  manageWarranty: "after-sales:manage-warranty",
}
// Labels:
// customers → "ລູກຄ້າ"
// after-sales → "ຫຼັງການຂາຍ"
```

## API Endpoints

### Customers

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/sales/customers` | `customers:read` | List + search (name, phone) |
| GET | `/api/sales/customers/:id` | `customers:read` | รายละเอียด + sales orders |
| POST | `/api/sales/customers` | `customers:create` | สร้างลูกค้า |
| PUT | `/api/sales/customers/:id` | `customers:update` | แก้ไข |
| DELETE | `/api/sales/customers/:id` | `customers:delete` | ลบ (ถ้าไม่มี sale) |

### Warranties & Service

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/after-sales/warranties` | `after-sales:read` | List + filter (type, status, expiring) |
| GET | `/api/after-sales/warranties/:id` | `after-sales:read` | รายละเอียด |
| GET | `/api/after-sales/warranties/expiring` | `after-sales:read` | ใกล้หมดอายุ (30 วัน) |
| GET | `/api/after-sales/warranty-settings` | `after-sales:read` | ค่า default duration |
| PUT | `/api/after-sales/warranty-settings` | `after-sales:manage-warranty` | แก้ค่า duration |
| POST | `/api/after-sales/service-records` | `after-sales:create-service` | บันทึก check-in |
| GET | `/api/after-sales/service-records` | `after-sales:read` | List by vehicle/customer |
| GET | `/api/after-sales/vehicles/:vehicleId/history` | `after-sales:read` | ประวัติ service ของรถ |

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/customers` | รายการลูกค้า | Table + search |
| `/app/customers/$id` | รายละเอียด | ข้อมูล + คำสั่งขาย + ประวัติ service |
| `/app/after-sales/warranties` | ประกัน | List + filter + pagination |
| `/app/after-sales/warranties/:id` | รายละเอียดประกัน | ข้อมูล + ลิงก์ customer/vehicle/sale |
| `/app/after-sales/service` | Service Check-in | บันทึกเข้าบริการ + ประวัติรถที่เลือก |
| `/app/dashboard` | แผงควบคุม | WarrantyExpiryAlert (ประกันใกล้หมดอายุ) |

> **หมายเหตุ:** ประวัติ service ตามรถ/ลูกค้าแสดงใน CustomerDetail / VehicleDetail และ panel ด้านขวาของหน้า check-in — ไม่มี route แยก `/app/after-sales/service/:vehicleId` (MVP)

## Implementation Phases

### Phase 4.1 — Customers CRM (4–5 วัน) ⭐ ทำก่อน Sales

- [x] Schema `customers`
- [x] CRUD API + RBAC (`customers:*` — API อยู่ที่ `/api/sales/customers`)
- [x] CustomersPage, CustomerForm, CustomerDetailPage
- [x] Search by name/phone
- [x] Sidebar: "ລູກຄ້າ" → `/app/customers`
- [x] Quick-create customer จาก Sale form (inline)
- [x] DELETE guard — ห้ามลบถ้ามี sales order
- [x] Customer detail — แสดงคำสั่งขาย + ลิงก์ไป sale detail

### Phase 4.2 — Warranty Auto-Create (3–4 วัน)

- [x] Schema `warranties` + `warranty_settings`
- [x] Hook ใน Sales confirm:
  - ICE → สร้าง `vehicle` + `motor` warranty
  - EV → สร้าง `vehicle` + `motor` + `battery` warranty
- [x] Default duration config (settings): vehicle 24 เดือน, motor 12 เดือน, battery 36 เดือน
- [x] Copy `batterySerialNumber` จาก vehicle (battery warranty)
- [x] API `GET/PUT /api/after-sales/warranty-settings` + tab Settings «ປະກັນ»

### Phase 4.3 — Warranty Tracking UI (3–4 วัน)

- [x] WarrantiesPage + WarrantyCard
- [x] Filter: type, status, expiring soon
- [x] WarrantyExpiryAlert — แสดงใน Dashboard (optional)
- [x] `/api/after-sales/warranties/expiring` endpoint

### Phase 4.4 — Service Check-in (4–5 วัน)

- [x] Schema `service_records`
- [x] ServiceCheckInPage + ServiceRecordForm
- [x] Service types: oil_change, battery_check, electrical_check, general
- [x] Odometer + battery health (EV)
- [x] ServiceHistoryTable ใน CustomerDetail / VehicleDetail

## Warranty Defaults (Configurable in Settings)

| ประเภท | ระยะเวลา default | ใช้กับ |
|---|---|---|
| vehicle | 24 เดือน | ICE + EV |
| motor | 12 เดือน | ICE + EV |
| battery | 36 เดือน | EV only |

## Business Rules

1. ลูกค้าที่มี sale แล้วห้ามลบ — soft delete หรือ deactivate
2. Warranty สร้างอัตโนมัติเมื่อ Sales confirm — ไม่สร้าง manual (MVP)
3. `endDate` = `startDate` + `durationMonths`
4. Battery warranty ใช้ `batterySerialNumber` จาก vehicle
5. Service record ต้องผูก `vehicleId` + `customerId`
6. Expiring alert: แจ้งเตือนเมื่อเหลือ ≤ 30 วัน

## Acceptance Criteria

> **สถานะปัจจุบัน:** ผ่าน — รัน `bun run test:sales` ได้ครบ (รวม auto-create warranty, expiring endpoint, service records)

- [x] CRUD ลูกค้าพร้อมที่อยู่ (บ้าน/เมือง/แขวง) และเลขบัตร/ทะเบียนบ้าน
- [x] Confirm sale → สร้าง warranty ครบตามประเภทรถ (ICE/EV)
- [x] ดูรายการประกันใกล้หมดอายุได้
- [x] บันทึก service check-in (เปลี่ยนน้ำมัน / ตรวจแบต) ได้
- [x] ดูประวัติ service ตามรถ/ลูกค้าได้

## Definition of Done

อ้างอิง [README.md](./README.md) § Definition of Done:

- [x] Drizzle schema + `db:push` / migration (`warranties`, `warranty_settings`, `service_records`)
- [x] RBAC `customers:*`, `after-sales:*` + `rbac:sync`
- [x] API routes (Elysia) + Zod contracts + `map-error.ts`
- [x] Repository + Service layer
- [x] React pages + TanStack Query hooks
- [x] Sidebar + route ใน `router.tsx` + `route-meta.ts`
- [x] Audit logging (`WARRANTY_SETTINGS.UPDATE`, `SERVICE.RECORD.CREATE`)
- [x] `bun run test:sales` ผ่าน (warranty + service ใน `test-sales-core-acceptance.ts`)

## โมดูลที่เกี่ยวข้อง

- **Inventory (01)** — vehicle + battery data; VehicleDetail แสดงประวัติ service
- **Sales (02)** — trigger warranty creation on confirm; Customers API
- **Dashboard** — `WarrantyExpiryAlert` widget
