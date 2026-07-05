# แผน Implement: 01 — Inventory & Vehicle Tracking

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) § 1

## เป้าหมาย

ติดตามรถจักรยานยนต์ **รายคัน (Unit-level)** ไม่ใช่แค่รุ่น/จำนวน รองรับทั้งรถน้ำมันและ EV พร้อมติดตามสถานะเอกสารนำเข้า/ทะเบียน

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| Phase 0 — Master Data | `brands`, `models`, `colors` |
| Upload module | อัปโหลดเอกสาร (ใบเสียภาษี, ใบตรวจ) |
| RBAC foundation | มีอยู่แล้ว |

## Module Structure

```
src/modules/inventory/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── vehicles.ts
│   │   ├── documents.ts
│   │   └── index.ts
│   ├── http/inventory.routes.ts
│   ├── repo/
│   │   ├── list-vehicles.ts
│   │   ├── get-vehicle-by-id.ts
│   │   ├── create-vehicle.ts
│   │   ├── update-vehicle.ts
│   │   ├── update-document-status.ts
│   │   └── ...
│   ├── service/
│   │   ├── create-vehicle.ts
│   │   ├── update-status.ts
│   │   └── ...
│   └── types.ts
└── presentation/
    ├── api/client.ts, queries.ts
    ├── pages/
    │   ├── VehiclesPage.tsx
    │   ├── VehicleCreatePage.tsx
    │   ├── VehicleDetailPage.tsx
    │   └── VehicleEditPage.tsx
    └── ui/
        ├── VehiclesTable.tsx
        ├── VehicleForm.tsx
        ├── VehicleFilter.tsx
        ├── DocumentStatusBadge.tsx
        └── BatteryInfoSection.tsx
```

## Database Schema

### `brands` / `models` / `colors` (Master Data — Phase 0)

```typescript
// brands
{ id, name, slug, isActive, createdAt, updatedAt }

// models
{ id, brandId, name, vehicleType: 'ice' | 'ev', engineCc?, batteryCapacityKwh?, year, isActive }

// colors
{ id, name, hexCode?, isActive }
```

### `vehicles` (Unit หลัก)

```typescript
{
  id: uuid
  modelId: uuid          // FK → models
  colorId: uuid          // FK → colors

  // Chassis & Engine (ICE)
  chassisNumber: string  // unique, required for ICE
  engineNumber: string   // unique, required for ICE

  // EV Battery Mapping
  batterySerialNumber: string | null   // unique when set
  batteryCapacityKwh: decimal | null

  // สถานะรถ
  status: 'in_stock' | 'reserved' | 'sold' | 'in_service' | 'written_off'

  // ราคา (อ้างอิง currency จาก settings)
  costPrice: decimal
  costCurrency: 'LAK' | 'THB' | 'USD'
  listPrice: decimal
  listCurrency: 'LAK' | 'THB' | 'USD'

  // เอกสารนำเข้า
  importInvoiceReceived: boolean      // ใบเสียภาษี
  technicalInspectionReceived: boolean // ใบตรวจทางเทคนิค
  registrationReady: boolean          // พร้อมทำทะเบียนป้าย

  // ข้อมูลเพิ่มเติม
  importDate: date | null
  notes: text | null
  createdAt, updatedAt, createdBy
}
```

### `vehicle_documents`

```typescript
{
  id, vehicleId, documentType: 'import_invoice' | 'technical_inspection' | 'other'
  fileKey: string        // S3 key
  fileName: string
  uploadedAt, uploadedBy
}
```

### Indexes & Constraints

- `UNIQUE(chassis_number)` WHERE chassis_number IS NOT NULL
- `UNIQUE(engine_number)` WHERE engine_number IS NOT NULL
- `UNIQUE(battery_serial_number)` WHERE battery_serial_number IS NOT NULL
- Index บน `status`, `model_id`

## RBAC Permissions

```typescript
inventory: {
  create: "inventory:create",
  read: "inventory:read",
  update: "inventory:update",
  delete: "inventory:delete",
  updateStatus: "inventory:update-status",
}
// Labels: inventory → "ສິນຄ້າຄົງຄັງ"
```

## API Endpoints

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/inventory/vehicles` | `inventory:read` | List + filter (status, brand, model, type) |
| GET | `/api/inventory/vehicles/:id` | `inventory:read` | รายละเอียดรถ + documents |
| POST | `/api/inventory/vehicles` | `inventory:create` | สร้าง unit ใหม่ |
| PUT | `/api/inventory/vehicles/:id` | `inventory:update` | แก้ไขข้อมูล |
| PATCH | `/api/inventory/vehicles/:id/status` | `inventory:update-status` | เปลี่ยนสถานะ |
| POST | `/api/inventory/vehicles/:id/documents` | `inventory:update` | อัปโหลดเอกสาร |
| DELETE | `/api/inventory/vehicles/:id/documents/:docId` | `inventory:update` | ลบเอกสาร |
| GET | `/api/inventory/brands` | `inventory:read` | Master data |
| GET | `/api/inventory/models` | `inventory:read` | Master data (filter by brand) |

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/inventory/vehicles` | รายการรถ | Table + filter (สถานะ, ยี่ห้อ, รุ่น, ICE/EV) |
| `/app/inventory/vehicles/new` | เพิ่มรถ | Form แยก section ICE / EV |
| `/app/inventory/vehicles/:id` | รายละเอียด | ข้อมูล unit + เอกสาร + timeline สถานะ + เปลี่ยนสถานะ |
| `/app/inventory/vehicles/:id/edit` | แก้ไข | Form เดียวกับ create |

### UI Components สำคัญ

- **VehicleForm** — แสดง/ซ่อน field ตาม `vehicleType` (ICE vs EV)
- **DocumentStatusBadge** — สถานะเอกสาร 3 ช่อง (ใบเสียภาษี / ใบตรวจ / พร้อมทะเบียน)
- **BatteryInfoSection** — เฉพาะ EV: serial, capacity, warranty link (เชื่อม After-Sales ภายหลัง)
- **VehiclesFilter** — filter ตาม status, brand, model, document readiness

## Implementation Phases

### Phase 1.1 — Schema & Master Data (3–4 วัน)

- [x] สร้าง schema `brands`, `models`, `colors`, `vehicles`, `vehicle_documents`
- [x] Seed ข้อมูลยี่ห้อ/รุ่นตัวอย่าง (Honda, Yamaha, VinFast ฯลฯ)
- [x] RBAC permissions + `rbac:sync`
- [x] Migration

### Phase 1.2 — Backend CRUD (4–5 วัน)

- [x] Contracts (Zod) + validation rules (unique chassis/engine/battery)
- [x] Repo + Service layer
- [x] API routes ลงทะเบียนใน `createRestRoutes()`
- [x] Audit log: create, update, status change

### Phase 1.3 — Frontend List & Form (5–6 วัน)

- [x] VehiclesPage + VehiclesTable + VehiclesFilter
- [x] VehicleCreatePage / VehicleEditPage + VehicleForm
- [x] ICE/EV conditional fields
- [x] Sidebar: "ລາຍການລົດ" → `/app/inventory/vehicles`

### Phase 1.4 — Documents & Status (3–4 วัน)

- [x] อัปโหลดเอกสารผ่าน presign upload
- [x] Document status toggles + auto-calc `registrationReady`
- [x] VehicleDetailPage แสดงเอกสารแนบ
- [x] ลบไฟล์ใน S3/MinIO เมื่อลบเอกสาร (best-effort ผ่าน `deleteObjectFromS3`)

## Business Rules

1. **ICE** — `chassisNumber` และ `engineNumber` บังคับ, unique ทั้งระบบ
2. **EV** — `batterySerialNumber` บังคับ, unique; `engineNumber` อาจว่าง
3. **registrationReady** = `importInvoiceReceived` AND `technicalInspectionReceived` (auto-set)
4. รถ `sold` หรือ `reserved` ห้ามลบ — เปลี่ยนสถานะเท่านั้น
5. รถ `sold` จะถูก link จาก Sales module (Phase 3)

## Acceptance Criteria

- [x] เพิ่มรถ ICE พร้อมเลขถัง/เลขเครื่อง unique ได้
- [x] เพิ่มรถ EV พร้อม battery serial + capacity ได้
- [x] อัปโหลดใบเสียภาษี/ใบตรวจ และเห็นสถานะ "พร้อมทะเบียน" เมื่อครบ
- [x] Filter รถตามสถานะและประเภท (ICE/EV) ได้
- [x] Permission ควบคุมการเข้าถึงตาม RBAC

## โมดูลที่เกี่ยวข้องภายหลัง

- **Sales** — อ้างอิง `vehicleId`, เปลี่ยน status → `reserved` / `sold`
- **After-Sales** — Warranty จาก battery/vehicle data
- **Payment** — ไม่เกี่ยวโดยตรง
