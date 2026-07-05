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

## Module Structure

```
src/modules/customers/          # Phase 1 — แยก module เพื่อ Sales ใช้ได้
src/modules/after-sales/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── customers.ts
│   │   ├── warranties.ts
│   │   └── service-records.ts
│   ├── http/
│   │   ├── customers.routes.ts
│   │   └── after-sales.routes.ts
│   ├── repo/
│   ├── service/
│   │   ├── create-warranty-on-sale.ts
│   │   └── check-warranty-expiry.ts
│   └── types.ts
└── presentation/
    ├── pages/
    │   ├── CustomersPage.tsx
    │   ├── CustomerCreatePage.tsx
    │   ├── CustomerDetailPage.tsx
    │   ├── WarrantiesPage.tsx
    │   ├── WarrantyDetailPage.tsx
    │   └── ServiceCheckInPage.tsx
    └── ui/
        ├── CustomersTable.tsx
        ├── CustomerForm.tsx
        ├── WarrantyCard.tsx
        ├── WarrantyExpiryAlert.tsx
        ├── ServiceRecordForm.tsx
        └── ServiceHistoryTable.tsx
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
| GET | `/api/customers` | `customers:read` | List + search (name, phone) |
| GET | `/api/customers/:id` | `customers:read` | รายละเอียด + vehicles + warranties |
| POST | `/api/customers` | `customers:create` | สร้างลูกค้า |
| PUT | `/api/customers/:id` | `customers:update` | แก้ไข |
| DELETE | `/api/customers/:id` | `customers:delete` | ลบ (ถ้าไม่มี sale) |

### Warranties & Service

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/after-sales/warranties` | `after-sales:read` | List + filter (type, status, expiring) |
| GET | `/api/after-sales/warranties/:id` | `after-sales:read` | รายละเอียด |
| GET | `/api/after-sales/warranties/expiring` | `after-sales:read` | ใกล้หมดอายุ (30 วัน) |
| POST | `/api/after-sales/service-records` | `after-sales:create-service` | บันทึก check-in |
| GET | `/api/after-sales/service-records` | `after-sales:read` | List by vehicle/customer |
| GET | `/api/after-sales/vehicles/:vehicleId/history` | `after-sales:read` | ประวัติ service ของรถ |

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/customers` | รายการลูกค้า | Table + search |
| `/app/customers/new` | เพิ่มลูกค้า | Form (ชื่อ, โทร, ที่อยู่, บัตร) |
| `/app/customers/:id` | รายละเอียด | ข้อมูล + รถที่ซื้อ + warranties |
| `/app/after-sales/warranties` | ประกัน | List + filter + expiry alerts |
| `/app/after-sales/warranties/:id` | รายละเอียดประกัน | ข้อมูล + vehicle link |
| `/app/after-sales/service` | Service Check-in | บันทึกเข้าบริการ |
| `/app/after-sales/service/:vehicleId` | ประวัติ service | ServiceHistoryTable |

## Implementation Phases

### Phase 4.1 — Customers CRM (4–5 วัน) ⭐ ทำก่อน Sales

- [ ] Schema `customers`
- [ ] CRUD API + RBAC
- [ ] CustomersPage, CustomerForm, CustomerDetailPage
- [ ] Search by name/phone
- [ ] Sidebar: "ລູກຄ້າ" → `/app/customers`
- [ ] Quick-create customer จาก Sale form (inline)

### Phase 4.2 — Warranty Auto-Create (3–4 วัน)

- [ ] Schema `warranties`
- [ ] Hook ใน Sales confirm:
  - ICE → สร้าง `vehicle` + `motor` warranty
  - EV → สร้าง `vehicle` + `motor` + `battery` warranty
- [ ] Default duration config (settings): vehicle 24 เดือน, motor 12 เดือน, battery 36 เดือน
- [ ] Copy `batterySerialNumber` จาก vehicle

### Phase 4.3 — Warranty Tracking UI (3–4 วัน)

- [ ] WarrantiesPage + WarrantyCard
- [ ] Filter: type, status, expiring soon
- [ ] WarrantyExpiryAlert — แสดงใน Dashboard (optional)
- [ ] `/api/after-sales/warranties/expiring` endpoint

### Phase 4.4 — Service Check-in (4–5 วัน)

- [ ] Schema `service_records`
- [ ] ServiceCheckInPage + ServiceRecordForm
- [ ] Service types: oil_change, battery_check, electrical_check, general
- [ ] Odometer + battery health (EV)
- [ ] ServiceHistoryTable ใน CustomerDetail / VehicleDetail

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

- [ ] CRUD ลูกค้าพร้อมที่อยู่ (บ้าน/เมือง/แขวง) และเลขบัตร/ทะเบียนบ้าน
- [ ] Confirm sale → สร้าง warranty ครบตามประเภทรถ (ICE/EV)
- [ ] ดูรายการประกันใกล้หมดอายุได้
- [ ] บันทึก service check-in (เปลี่ยนน้ำมัน / ตรวจแบต) ได้
- [ ] ดูประวัติ service ตามรถ/ลูกค้าได้

## โมดูลที่เกี่ยวข้อง

- **Inventory (01)** — vehicle + battery data
- **Sales (02)** — trigger warranty creation on confirm
- **Dashboard** — warranty expiry widget (optional enhancement)
