import type { FilterConditionDTO } from "./base";

export function findCondition(
  filters: FilterConditionDTO[] | undefined,
  field: string,
): FilterConditionDTO | undefined {
  if (!filters) return undefined;
  for (const item of filters) {
    if (item.op === "and" || item.op === "or") {
      const nested = item.value as unknown as
        | FilterConditionDTO
        | FilterConditionDTO[]
        | undefined;
      if (Array.isArray(nested)) {
        const hit = nested.find((c) => c.field === field);
        if (hit) return hit;
      } else if (nested && nested.field === field) {
        return nested;
      }
    } else if (item.field === field) {
      return item;
    }
  }
  return undefined;
}

export function removeConditions(
  filters: FilterConditionDTO[] | undefined,
  field: string,
): FilterConditionDTO[] | undefined {
  if (!filters) return undefined;
  const next: FilterConditionDTO[] = [];
  for (const item of filters) {
    if (item.op === "and" || item.op === "or") {
      const nested = item.value as unknown as
        | FilterConditionDTO
        | FilterConditionDTO[]
        | undefined;
      if (Array.isArray(nested)) {
        const kept = nested.filter((c) => c.field !== field);
        if (kept.length > 0) {
          next.push({ ...item, value: kept } as unknown as FilterConditionDTO);
        }
      } else if (!nested || nested.field !== field) {
        next.push(item);
      }
    } else if (item.field !== field) {
      next.push(item);
    }
  }
  return next.length ? next : undefined;
}

export function upsertCondition(
  filters: FilterConditionDTO[] | undefined,
  cond: FilterConditionDTO,
): FilterConditionDTO[] {
  const without = removeConditions(filters, cond.field) ?? [];
  return [...without, cond];
}

export function upsertOrGroup(
  filters: FilterConditionDTO[] | undefined,
  conds: FilterConditionDTO[],
): FilterConditionDTO[] {
  let next = filters ?? [];
  for (const c of conds) next = removeConditions(next, c.field) ?? [];
  if (conds.length === 0) return next;
  // Represent OR as a single logical node with an array payload
  const orNode = {
    field: "*",
    op: "or",
    value: conds,
  } as unknown as FilterConditionDTO;
  return [...next, orNode];
}

export function andGroup(...conds: FilterConditionDTO[]): FilterConditionDTO[] {
  // Top-level list is AND by default
  return conds;
}

export function orGroup(...conds: FilterConditionDTO[]): FilterConditionDTO[] {
  // Used by UI to indicate OR semantics; upsertOrGroup will convert to chain
  return conds;
}
