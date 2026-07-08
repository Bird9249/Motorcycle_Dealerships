# แผน Implementation — Motorcycle Dealership ERP (MVP)

เอกสารชุดนี้แยกแผน implement ตามโมดูลธุรกิจใน [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) และต่อยอด Reports หลัง 01–04

## ไฟล์แผน

| ลำดับ | โมดูล | ไฟล์ |
|---|---|---|
| 0 | Master Data CRUD UI | [00-master-data-crud-ui.md](./00-master-data-crud-ui.md) |
| 1 | Inventory & Vehicle Tracking | [01-inventory-vehicle-tracking.md](./01-inventory-vehicle-tracking.md) |
| 2 | Sales & Financing Options | [02-sales-financing.md](./02-sales-financing.md) |
| 3 | Payment & Slip Verification | [03-payment-slip-verification.md](./03-payment-slip-verification.md) |
| 4 | After-Sales & Warranty | [04-after-sales-warranty.md](./04-after-sales-warranty.md) |
| 5 | Reports & Analytics | [05-reports-analytics.md](./05-reports-analytics.md) |

## ลำดับการ implement ที่แนะนำ

```
Phase 0: Shared Foundation
    ├── Master Data CRUD UI     ← 00-master-data-crud-ui.md
    ├── Multi-Currency Settings
    └── Payment Accounts (บัญชีรับเงิน)

Phase 1: Inventory          ← 01-inventory-vehicle-tracking.md
Phase 2: Customers (CRM)    ← 04-after-sales-warranty.md (Phase 1 ของโมดูล)
Phase 3: Sales & Financing  ← 02-sales-financing.md
Phase 4: Payment            ← 03-payment-slip-verification.md
Phase 5: After-Sales        ← 04-after-sales-warranty.md (Phase 4.1–4.4)
Phase 6: Reports            ← 05-reports-analytics.md ✅ (Phase 5.1–5.5)
```

## สถานะโมดูล Reports (อัปเดต)

| Phase | รายการ | สถานะ |
|---|---|---|
| 5.1 | Dashboard KPIs จริง | ✅ |
| 5.2 | Reports Hub + Sales Report | ✅ |
| 5.3 | Inventory + Payments Reports | ✅ |
| 5.4 | After-Sales + CSV Export | ✅ |
| 5.5 | `test:reports` + docs | ✅ |

ทดสอบ: `bun run test:reports` (ต้องมี dev server + `rbac:sync`)

## หลักการออกแบบ (ใช้ร่วมทุกโมดูล)

- โครงสร้างตาม **Modular Monolith** ที่มีอยู่: `src/modules/[feature]/domain|presentation|api`
- Schema อยู่ที่ `src/server/platform/db/schema/`
- Validation ด้วย **Zod** ใน `domain/contracts/`
- RBAC เพิ่มใน `src/modules/roles/domain/contracts/permissions.ts` แล้ว sync ด้วย `bun run rbac:sync`
- Audit log ผ่าน `append-audit` สำหรับ action สำคัญ (สร้าง/แก้/ลบ/เปลี่ยนสถานะ)
- UI ภาษาลาว ตาม pattern ใน sidebar และ labels ที่มีอยู่
- Upload ไฟล์ (สลิป, เอกสาร) ใช้ module `upload` + S3/MinIO ที่มีอยู่แล้ว

## Shared Foundation (Phase 0)

implement ก่อนเริ่มโมดูลธุรกิจ — รายละเอียดกระจายอยู่ในแต่ละไฟล์ แต่สรุป schema ร่วม:

| ตาราง | ใช้โดย |
|---|---|
| `brands` | Inventory |
| `models` | Inventory |
| `colors` | Inventory |
| `exchange_rates` | Sales, Payment |
| `payment_accounts` | Payment |

**Module แนะนำ:** `src/modules/settings/` (ขยายจากที่มี) หรือ `src/modules/master-data/`

## Definition of Done (ทุกโมดูล)

- [ ] Drizzle schema + migration
- [ ] RBAC permissions + sync
- [ ] API routes (Elysia) + Zod contracts
- [ ] Repository + Service layer
- [ ] React pages + TanStack Query hooks
- [ ] Sidebar navigation + route registration
- [ ] Audit logging สำหรับ mutation สำคัญ
- [ ] Manual test ผ่าน UI ภาษาลาว

## การอ้างอิง

- [Project Overview](../PROJECT_OVERVIEW.md)
- Module ตัวอย่าง: `src/modules/users/`
- Permissions: `src/modules/roles/domain/contracts/permissions.ts`
- API registration: `src/server/api/rest/index.ts`
- Router: `src/app/router.tsx`
