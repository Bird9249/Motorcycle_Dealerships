# แผน Implement: 00 — Master Data CRUD UI

> อ้างอิง: [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md), [README.md](./README.md) § Phase 0  
> ตาราง schema มีอยู่แล้วใน `src/server/platform/db/schema/inventory.ts` — seed ผ่าน `bun run seed:inventory`

## เป้าหมาย

ให้ผู้ดูแลระบบจัดการ **ข้อมูลหลัก (Master Data)** ที่ Inventory อ้างอิง ผ่าน UI ภาษาลาว โดยไม่ต้องแก้ seed/DB โดยตรง:

- **ຍີ່ຫໍ້ (Brands)** — Honda, Yamaha, VinFast ฯลฯ
- **ລຸ່ນ (Models)** — ผูก brand, แยก ICE / EV
- **ສີ (Colors)** — ชื่อ + hex code สำหรับแสดง swatch

## สถานะปัจจุบัน

| ส่วน | สถานะ |
|---|---|
| Drizzle schema `brands`, `models`, `colors` | ✅ มีแล้ว |
| Seed ตัวอย่าง | ✅ `seed-inventory-master-data.ts` |
| API อ่านอย่างเดียว | ✅ `GET /api/inventory/brands`, `/colors`, `/models` |
| CRUD API + UI | ✅ Phase 0.1–0.3 |

## Dependencies

| ต้องมีก่อน | รายละเอียด |
|---|---|
| RBAC foundation | มีอยู่แล้ว |
| Inventory schema | มีแล้ว (FK จาก `vehicles` → `models`, `colors`) |
| Users module pattern | อ้างอิง CRUD UI: `src/modules/users/` |

## Module Structure

แนะนำ module ใหม่ **`src/modules/master-data/`** (แยกจาก inventory เพื่อไม่ปน vehicle logic)

```
src/modules/master-data/
├── api/index.ts
├── domain/
│   ├── contracts/
│   │   ├── brands.ts
│   │   ├── models.ts
│   │   ├── colors.ts
│   │   └── index.ts
│   ├── http/master-data.routes.ts
│   ├── repo/
│   │   ├── list-brands.ts
│   │   ├── mutate-brand.ts
│   │   ├── list-models.ts
│   │   ├── mutate-model.ts
│   │   ├── list-colors.ts
│   │   └── mutate-color.ts
│   ├── service/
│   │   ├── create-brand.ts
│   │   ├── update-brand.ts
│   │   ├── deactivate-brand.ts
│   │   └── ... (models, colors)
│   └── types.ts
└── presentation/
    ├── api/client.ts, queries.ts
    ├── pages/
    │   └── MasterDataPage.tsx          # Tabs: Brands | Models | Colors
    └── ui/
        ├── BrandsTable.tsx
        ├── BrandForm.tsx
        ├── ModelsTable.tsx
        ├── ModelForm.tsx               # ICE/EV conditional fields
        ├── ColorsTable.tsx
        └── ColorForm.tsx               # name + hex picker
```

ลงทะเบียน route ใน `src/server/api/rest/index.ts` เป็น prefix `/master-data`

## RBAC Permissions

เพิ่มใน `permissions.ts`:

```typescript
masterData: {
  create: "master-data:create",
  read: "master-data:read",
  update: "master-data:update",
  delete: "master-data:delete",
}
// Labels: master-data → "ຂໍ້ມູນຫຼັກ"
```

| Permission | ใครใช้ |
|---|---|
| `master-data:read` | ดูรายการ brands/models/colors |
| `master-data:create` | เพิ่มรายการใหม่ |
| `master-data:update` | แก้ไข / เปิด-ปิด `isActive` |
| `master-data:delete` | soft-deactivate (ไม่ hard delete ถ้ามี FK) |

รัน `bun run rbac:sync` หลังเพิ่ม permission

## API Endpoints

### Brands

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/master-data/brands` | `master-data:read` | List (+ filter `isActive`, search name) |
| GET | `/api/master-data/brands/:id` | `master-data:read` | รายละเอียด |
| POST | `/api/master-data/brands` | `master-data:create` | สร้าง (auto slug จาก name) |
| PUT | `/api/master-data/brands/:id` | `master-data:update` | แก้ name, slug, isActive |
| PATCH | `/api/master-data/brands/:id/status` | `master-data:update` | toggle `isActive` |

### Models

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/master-data/models` | `master-data:read` | List (+ filter `brandId`, `vehicleType`, `isActive`) |
| GET | `/api/master-data/models/:id` | `master-data:read` | รายละเอียด + brand |
| POST | `/api/master-data/models` | `master-data:create` | สร้าง |
| PUT | `/api/master-data/models/:id` | `master-data:update` | แก้ไข |
| PATCH | `/api/master-data/models/:id/status` | `master-data:update` | toggle `isActive` |

### Colors

| Method | Path | Permission | รายละเอียด |
|---|---|---|---|
| GET | `/api/master-data/colors` | `master-data:read` | List |
| GET | `/api/master-data/colors/:id` | `master-data:read` | รายละเอียด |
| POST | `/api/master-data/colors` | `master-data:create` | สร้าง |
| PUT | `/api/master-data/colors/:id` | `master-data:update` | แก้ name, hexCode, isActive |
| PATCH | `/api/master-data/colors/:id/status` | `master-data:update` | toggle `isActive` |

> **หมายเหตุ:** `GET /api/inventory/brands|models|colors` ยังคงไว้สำหรับ dropdown ในฟอร์มรถ — คืนเฉพาะ `isActive = true` (หรือ refactor ให้ inventory เรียก service ร่วม)

## Business Rules

1. **Slug (brand)** — unique, lowercase, สร้างอัตโนมัติจาก name (เช่น `Honda` → `honda`) แก้ได้แต่ต้อง unique
2. **Model name** — unique ภายใน brand เดียวกัน (`models_brand_id_name_unique`)
3. **Color name** — unique ทั้งระบบ
4. **ICE model** — ใส่ `engineCc` ได้; `batteryCapacityKwh` ว่าง
5. **EV model** — ใส่ `batteryCapacityKwh` ได้; `engineCc` ว่าง
6. **Soft delete** — ใช้ `isActive = false` เป็นหลัก ไม่ hard delete ถ้ามี FK:
   - มี `vehicles` อ้างอิง model/color → ห้าม hard delete (DB `onDelete: restrict`)
   - มี `models` ภายใต้ brand → ห้าม hard delete brand
7. **Deactivate model/brand/color** — รายการที่ inactive ไม่แสดงใน dropdown สร้างรถใหม่ แต่รถเดิมยังอ้างอิงได้

## UI Pages

| Route | หน้า | ฟีเจอร์ |
|---|---|---|
| `/app/master-data` | ຂໍ້ມູນຫຼັກ | Tabs 3 แท็บ: ຍີ່ຫໍ້ / ລຸ່ນ / ສີ |

### UX แต่ละแท็บ

- **Table** — DataTable + pagination + search
- **Toolbar** — ปุ่ม "ເພີ່ມ" (permission `master-data:create`)
- **Form (Modal หรือ Sheet)** — create/edit
- **Status toggle** — Switch `isActive` ในแถว (permission `master-data:update`)
- **Models tab** — filter ยี่ห้อ, แสดง badge ICE/EV
- **Colors tab** — color swatch จาก `hexCode`, input `#RRGGBB`

### Sidebar

เพิ่มใต้กลุ่ม **ການຕັ້ງຄ່າ** หรือ **ທຸລະກິດ**:

```
ຂໍ້ມູນຫຼັກ → /app/master-data
requiredPermissions: ["master-data:read"]
```

## Implementation Phases

### Phase 0.1 — Backend CRUD (3–4 วัน)

- [x] RBAC `master-data:*` + `rbac:sync`
- [x] Zod contracts (brands, models, colors)
- [x] Repo + Service + validation (slug, ICE/EV fields, unique constraints)
- [x] API routes + audit log (`MASTER_DATA.BRAND.*`, `MODEL.*`, `COLOR.*`)
- [x] ปรับ inventory list endpoints ให้ filter `isActive = true` (brands, models, colors + brand active ใน models join)

### Phase 0.2 — Frontend UI (4–5 วัน)

- [x] `MasterDataPage` + Tabs
- [x] BrandsTable + BrandForm
- [x] ModelsTable + ModelForm (ICE/EV conditional)
- [x] ColorsTable + ColorForm (hex swatch)
- [x] TanStack Query hooks + optimistic invalidate
- [x] Router + sidebar + breadcrumbs

### Phase 0.3 — Polish (1–2 วัน)

- [x] Empty state + confirm deactivate
- [x] แสดงจำนวน models ต่อ brand / vehicles ต่อ model (optional count)
- [x] Joyride tour สั้นๆ (optional)

## Acceptance Criteria

- [x] Admin สร้าง brand ใหม่ + model ICE/EV ใต้ brand ได้
- [x] Admin สร้างสีพร้อม hex code และเห็น swatch ในตาราง
- [x] Deactivate model แล้วไม่โผล่ใน dropdown สร้างรถ แต่รถเดิมยังแสดง model ได้
- [x] แก้ชื่อซ้ำใน scope เดียวกัน → error 409 ชัดเจน
- [x] Permission ควบคุม CRUD ตาม RBAC
- [x] Audit log บันทึก create/update/deactivate

> ทดสอบอัตโนมัติ: `bun run src/server/scripts/test-master-data-acceptance.ts` (ต้องรัน `bun dev` ก่อน)

## ความสัมพันธ์กับโมดูลอื่น

| โมดูล | การใช้ master data |
|---|---|
| **Inventory** | dropdown model/color ตอนสร้างรถ |
| **Sales** (Phase 3) | อ้างอิง model ในใบเสนอราคา |
| **After-Sales** (Phase 5) | warranty ตาม model type (EV) |

## อ้างอิงโค้ด

- Schema: `src/server/platform/db/schema/inventory.ts`
- Seed: `src/server/scripts/seed-inventory-master-data.ts`
- Inventory read API (ปัจจุบัน): `src/modules/inventory/domain/http/inventory.routes.ts`
- UI pattern: `src/modules/users/presentation/`
- Permissions: `src/modules/roles/domain/contracts/permissions.ts`
