import { nanoid } from "nanoid";

export function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `brand-${nanoid(6).toLowerCase()}`;
}

export function toOptionalPriceString(
  value: string | number | undefined | null,
): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === "number" ? value.toFixed(2) : value;
}
