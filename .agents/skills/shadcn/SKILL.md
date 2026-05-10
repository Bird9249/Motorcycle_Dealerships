---
name: shadcn
description: shadcn/ui patterns for Admin — import components from @devhop/ui (shadcn lives in that package, not copied into the app). Use shadcn CLI for docs, search, and reference only. Applies when working with shadcn-style UI, @devhop/ui, registries, or presets in other contexts.
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *), Bash(bun add @devhop/ui*), Bash(pnpm add @devhop/ui*), Bash(npm install @devhop/ui*)
---

# shadcn/ui + `@devhop/ui` (Admin)

In **this repository (Admin)**, shadcn-style components are **not** added with `npx shadcn add` into `src/`. They ship in the **`@devhop/ui`** package; **import from `@devhop/ui`** (see `package.json` and `styles/globals.css` which sources Tailwind from the package).

1. **Use `@devhop/ui` for all standard UI** — e.g. `import { Button, Input, Card, cn, toast } from "@devhop/ui"`.
2. **Do not copy shadcn component source into the Admin app** to “install” a button or dialog; bump or add the package instead — e.g. `bun add @devhop/ui@latest` (use the same package manager as the project).
3. **Use the shadcn CLI for documentation and discovery only** — `npx shadcn@latest docs <component>`, and optionally `search` / `view` when you need API examples. Optional: if you need JSON project info from a repo that has `components.json`, run `npx shadcn@latest info --json` there; **Admin may not have `components.json`**.

> **IMPORTANT:** When running shadcn CLI examples below, use the project's runner: `npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest` — match the repo's `packageManager`. Examples use `npx` for brevity.

## Current project (Admin)

- **UI source of truth:** `@devhop/ui` (dependency in `package.json`).
- **Imports:** `import { ... } from "@devhop/ui"`. รวม `cn` และคอมโพเนนต์ shadcn มาตรฐาน — ไม่ import จาก `@/components/ui/...` สำหรับ UI ชุดนั้น.
- **Component updates / new primitives:** อัปเดตเวอร์ชัน `@devhop/ui` หรือประสานทีมที่รักแพ็กเกจ ไม่ใช้ `shadcn add` ใน Admin เพื่อเติมไฟล์ใน repo.
- **Reference docs:** `npx shadcn@latest docs <component>` สำหรับ URL เอกสาร/ตัวอย่าง ของ API ที่สอดคล้องกับ shadcn.

## Principles

1. **Use `@devhop/ui` first (Admin).** ก่อนเขียน UI เอง ตรวจว่ามีคอมโพเนนต์ที่ต้องการจาก `@devhop/ui` หรือไม่ ใช้ `npx shadcn@latest search` หรือ `docs` เฉพาะเมื่อต้องการค้นหาชื่อ/อ้างอิง registries อื่น (ไม่ใช้ `add` ลง Admin).
2. **Compose, don't reinvent.** Settings page = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table — ล้วน import จาก `@devhop/ui` ได้ถ้าแพ็กเกจ export ไว้
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct code pairs.

### Styling & Tailwind → [styling.md](./rules/styling.md)

- **`className` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Forms & Inputs → [forms.md](./rules/forms.md)

- **Forms use `FieldGroup` + `Field`.** Never use raw `div` with `space-y-*` or `grid gap-*` for form layout.
- **`InputGroup` uses `InputGroupInput`/`InputGroupTextarea`.** Never raw `Input`/`Textarea` inside `InputGroup`.
- **Buttons inside inputs use `InputGroup` + `InputGroupAddon`.**
- **Option sets (2–7 choices) use `ToggleGroup`.** Don't loop `Button` with manual active state.
- **`FieldSet` + `FieldLegend` for grouping related checkboxes/radios.** Don't use a `div` with a heading.
- **Field validation uses `data-invalid` + `aria-invalid`.** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

### Component Structure → [composition.md](./rules/composition.md)

- **Items always inside their Group.** `SelectItem` → `SelectGroup`. `DropdownMenuItem` → `DropdownMenuGroup`. `CommandItem` → `CommandGroup`.
- **Use `asChild` (radix) or `render` (base) for custom triggers.** Check `base` field from `npx shadcn@latest info`. → [base-vs-radix.md](./rules/base-vs-radix.md)
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`. Don't dump everything in `CardContent`.
- **Button has no `isPending`/`isLoading`.** Compose with `Spinner` + `data-icon` + `disabled`.
- **`TabsTrigger` must be inside `TabsList`.** Never render triggers directly in `Tabs`.
- **`Avatar` always needs `AvatarFallback`.** For when the image fails to load.

### Use Components, Not Custom Markup → [composition.md](./rules/composition.md)

- **Use existing components before custom markup.** Check if a component exists before writing a styled `div`.
- **Callouts use `Alert`.** Don't build custom styled divs.
- **Empty states use `Empty`.** Don't build custom empty state markup.
- **Toast via `sonner`.** ใน Admin ใช้ `toast` ที่ re-export จาก `@devhop/ui` ถ้ามี (มิฉะนั้น `import { toast } from "sonner"` ตาม peer ของแพ็กเกจ)
- **Use `Separator`** instead of `<hr>` or `<div className="border-t">`.
- **Use `Skeleton`** for loading placeholders. No custom `animate-pulse` divs.
- **Use `Badge`** instead of custom styled spans.

### Icons → [icons.md](./rules/icons.md)

- **Icons in `Button` use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"` on the icon.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS. No `size-4` or `w-4 h-4`.
- **Pass icons as objects, not string keys.** `icon={CheckIcon}`, not a string lookup.

### CLI

- **Admin:** ห้ามใช้ `npx shadcn@latest add` เพื่อดึง source เข้า repo ถือว่าเป็น anti-pattern — ใช้ `@devhop/ui` แทน
- **Other workflows / โปรเจกต์อื่น:** **Never decode or fetch preset codes manually.** Pass them directly to `npx shadcn@latest apply --preset <code>` for existing projects, or `npx shadcn@latest init --preset <code>` when initializing.

## Key Patterns

These are the most common patterns that differentiate correct shadcn/ui code. For edge cases, see the linked rule files above.

```tsx
// Form layout: FieldGroup + Field, not div + Label.
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// Validation: data-invalid on Field, aria-invalid on the control.
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>

// Icons in buttons: data-icon, no sizing classes.
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// Spacing: gap-*, not space-y-*.
<div className="flex flex-col gap-4">  // correct
<div className="space-y-4">           // wrong

// Equal dimensions: size-*, not w-* h-*.
<Avatar className="size-10">   // correct
<Avatar className="w-10 h-10"> // wrong

// Status colors: Badge variants or semantic tokens, not raw colors.
<Badge variant="secondary">+20.1%</Badge>    // correct
<span className="text-emerald-600">+20.1%</span> // wrong
```

## Component Selection

| Need                       | Use                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Button/action              | `Button` with appropriate variant                                                                   |
| Form inputs                | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| Toggle between 2–5 options | `ToggleGroup` + `ToggleGroupItem`                                                                   |
| Data display               | `Table`, `Card`, `Badge`, `Avatar`                                                                  |
| Navigation                 | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                     |
| Overlays                   | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation)       |
| Feedback                   | `sonner` (toast), `Alert`, `Progress`, `Skeleton`, `Spinner`                                        |
| Command palette            | `Command` inside `Dialog`                                                                           |
| Charts                     | `Chart` (wraps Recharts)                                                                            |
| Layout                     | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                          |
| Empty states               | `Empty`                                                                                             |
| Menus                      | `DropdownMenu`, `ContextMenu`, `Menubar`                                                            |
| Tooltips/info              | `Tooltip`, `HoverCard`, `Popover`                                                                   |

## Key Fields

**Admin:** Prefer `@devhop/ui` as the import path for UI; app-level aliases (e.g. `@/`) are for app code, not for vendoring shadcn primitives.

If you run `npx shadcn@latest info` in a project that has `components.json`, the output includes these fields (สำหรับอ้างอิงหรือโปรเจกต์อื่น):

- **`aliases`** → use the actual alias prefix for imports (e.g. `@/`, `~/`), never hardcode.
- **`isRSC`** → when `true`, components using `useState`, `useEffect`, event handlers, or browser APIs need `"use client"` at the top of the file. Always reference this field when advising on the directive.
- **`tailwindVersion`** → `"v4"` uses `@theme inline` blocks; `"v3"` uses `tailwind.config.js`.
- **`tailwindCssFile`** → the global CSS file where custom CSS variables are defined. In Admin, also ensure `@source` ครอบคลุม `node_modules/@devhop/ui` ตามที่กำหนดใน `styles/globals.css`.
- **`style`** → component visual treatment (e.g. `nova`, `vega`) — ใน Admin กำหนดที่แพ็กเกจ `@devhop/ui` มากกว่าในแอป
- **`base`** → primitive library (`radix` or `base`). Affects component APIs and available props.
- **`iconLibrary`** → ตรงกับที่ `@devhop/ui` ใช้ (มัก `lucide-react`); ตรวจจาก re-export ในแพ็กเกจหรือเอกสาร
- **`resolvedPaths`** → N/A สำหรับ shadcn ใน Admin (ไม่มี path คอมโพเนนต์ใน repo)
- **`framework`** → routing and file conventions (e.g. TanStack Start / Vite ใน Admin).
- **`packageManager`** → ใช้กับ `bun add` / `pnpm add` รวมอัปเดต `@devhop/ui` และ dependencies อื่น

See [cli.md — `info` command](./cli.md) for the full field reference.

## Component Docs, Examples, and Usage

Run `npx shadcn@latest docs <component>` to get the URLs for a component's documentation, examples, and API reference. Fetch these URLs to get the actual content.

```bash
npx shadcn@latest docs button dialog select
```

**When creating, fixing, debugging, or using a component, always run `npx shadcn@latest docs` and fetch the URLs first.** This ensures you're working with the correct API and usage patterns rather than guessing.

## Workflow

### Admin (ใช้ `@devhop/ui`)

1. **เลือกคอมโพเนนต์** — ดูว่า export อะไรจาก `@devhop/ui` (เช่น ดู `node_modules/@devhop/ui/dist/index.d.ts` หรือเอกสารแพ็กเกจ) ใช้ `npx shadcn@latest docs <name>` เมื่อต้องการ URL อ้างอิง shadcn
2. **Import** — `import { X, Y, cn, toast, ... } from "@devhop/ui"`
3. **อัปเดต** — bump `@devhop/ui` ตาม [Updating Components](#updating-components) — **ไม่** ใช้ `shadcn add`
4. **Snippet ที่ใช้ `@/components/ui/...`** — แปลงเป็น `@devhop/ui` หรือถามว่าต้องเพิ่ม export ที่แพ็กเกจ
5. **Registry / block จาก community** — ไม่ `add` ลง Admin ตาม default; ถ้าจำเป็นจริงๆ ต้องสอดคล้องกับนโยบายทีม (มัก wrap หรือเพิ่มใน `@devhop/ui` ก่อน)

### โปรเจกต์อื่นที่ copy ไฟล์ shadcn ลง repo

1. **Get project context** — `npx shadcn@latest info --json` ถ้ามี `components.json`
2. **Check installed** — ก่อน `add` ดู list จาก `info` หรือ `resolvedPaths.ui`
3. **Find** — `npx shadcn@latest search`
4. **Docs** — `npx shadcn@latest docs` + fetch; `view` หรือ `add --dry-run` ตามต้องการ
5. **Install or update** — `npx shadcn@latest add` / `--diff` ตาม [Updating Components](#updating-components) (กระบวนการ “แยก project” ไม่ใช่ default ของ Admin)
6. **Fix imports** หลัง add จาก registries — แก้ path ที่ hardcode; ใน **Admin** ตั้งใจชี้ไป **`@devhop/ui`**
7. **Review** — อ่านไฟล์ที่ add, ตรวจ sub-components, icons ตาม `iconLibrary`, และ [Critical Rules](#critical-rules)
8. **Registry ต้องชัด** — ถ้าผู้ใช้ไม่บอก registry ให้ถาม
9. **Switching presets** — ถาม **overwrite** / **merge** / **skip** ตาม shadcn docs; ใช้กับโปรเจกต์ที่มี `components.json` (ไม่ใช่ path หลักของ Admin UI)

## Updating Components

**Admin — อัปเดต shadcn UI ที่อยู่ในแพ็กเกจ:** bump เวอร์ชัน `@devhop/ui` (เช่น `bun add @devhop/ui@latest` ตาม package manager) แล้วทดสอบ breaking changes ตาม release ของแพ็กเกจ ไม่ใช้ `npx shadcn@latest add` เพื่อ merge ไฟล์ใน `Admin/`

**โปรเจกต์ที่เก็บ source shadcn ใน repo เอง:** When the user asks to update a component from upstream while keeping local changes, use `--dry-run` and `--diff` to intelligently merge. **NEVER fetch raw files from GitHub manually — always use the CLI.**

1. Run `npx shadcn@latest add <component> --dry-run` to see all files that would be affected.
2. For each file, run `npx shadcn@latest add <component> --diff <file>` to see what changed upstream vs local.
3. Decide per file based on the diff:
   - No local changes → safe to overwrite.
   - Has local changes → read the local file, analyze the diff, and apply upstream updates while preserving local modifications.
   - User says "just update everything" → use `--overwrite`, but confirm first.
4. **Never use `--overwrite` without the user's explicit approval.**

## Quick Reference

```bash
# Admin — ใช้ UI จากแพ็กเกจ (ไม่ shadcn add ลง repo)
# bun add @devhop/ui@latest
# หรือ: pnpm add @devhop/ui@latest

# เอกสาร API / ตัวอย่าง (ใช้ได้กับ Admin)
npx shadcn@latest docs button dialog
```

```bash
# --- ข้างล่าง: คำสั่ง shadcn แบบ copy-source ในโปรเจกต์อื่น (ไม่ใช่ default ของ Admin) ---

# Create a new project.
npx shadcn@latest init --name my-app --preset base-nova
npx shadcn@latest init --name my-app --preset a2r6bw --template vite

# Create a monorepo project.
npx shadcn@latest init --name my-app --preset base-nova --monorepo
npx shadcn@latest init --name my-app --preset base-nova --template next --monorepo

# Initialize existing project.
npx shadcn@latest init --preset base-nova
npx shadcn@latest init --defaults  # shortcut: --template=next --preset=nova (base style implied)

# Apply a preset to an existing project.
npx shadcn@latest apply --preset a2r6bw
npx shadcn@latest apply a2r6bw

# Add components.
npx shadcn@latest add button card dialog
npx shadcn@latest add @magicui/shimmer-button
npx shadcn@latest add --all

# Preview changes before adding/updating.
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx
npx shadcn@latest add @acme/form --view button.tsx

# Search registries.
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @tailark -q "stats"

# Get component docs and example URLs.
npx shadcn@latest docs button dialog select

# View registry item details (for items not yet installed).
npx shadcn@latest view @shadcn/button
```

**Named presets:** `nova`, `vega`, `maia`, `lyra`, `mira`, `luma`
**Templates:** `next`, `vite`, `start`, `react-router`, `astro` (all support `--monorepo`) and `laravel` (not supported for monorepo)
**Preset codes:** Version-prefixed base62 strings (e.g. `a2r6bw` or `b0`), from [ui.shadcn.com](https://ui.shadcn.com).

## Detailed References

- [rules/forms.md](./rules/forms.md) — FieldGroup, Field, InputGroup, ToggleGroup, FieldSet, validation states
- [rules/composition.md](./rules/composition.md) — Groups, overlays, Card, Tabs, Avatar, Alert, Empty, Toast, Separator, Skeleton, Badge, Button loading
- [rules/icons.md](./rules/icons.md) — data-icon, icon sizing, passing icons as objects
- [rules/styling.md](./rules/styling.md) — Semantic colors, variants, className, spacing, size, truncate, dark mode, cn(), z-index
- [rules/base-vs-radix.md](./rules/base-vs-radix.md) — asChild vs render, Select, ToggleGroup, Slider, Accordion
- [cli.md](./cli.md) — Commands, flags, presets, templates
- [customization.md](./customization.md) — Theming, CSS variables, extending components
