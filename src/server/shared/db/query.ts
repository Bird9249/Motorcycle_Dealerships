import type { AnyColumn, SQLWrapper } from "drizzle-orm";
import { and, asc, desc, or, sql, type SQL } from "drizzle-orm";
import type { FilterConditionDTO, SortFieldDTO } from "../contracts/base";

export type OrderClause = ReturnType<typeof asc> | ReturnType<typeof desc>;
export type WhereExpr = SQL<unknown>;

type Column = AnyColumn | SQLWrapper;

export function buildOrderBy<TCols extends Record<string, Column>>(
  columns: TCols,
  sorts: SortFieldDTO[] | undefined,
): OrderClause[] | undefined {
  if (!sorts || sorts.length === 0) return undefined;
  return sorts
    .map((s) => {
      const col = (columns as Record<string, Column>)[s.field];
      if (!col) return undefined;
      return s.dir === "asc" ? asc(col) : desc(col);
    })
    .filter((v): v is OrderClause => Boolean(v));
}

function toWherePart(
  columns: Record<string, Column>,
  f: FilterConditionDTO,
): WhereExpr | undefined {
  const col = (columns as Record<string, Column>)[f.field];
  if (!col) return undefined;
  switch (f.op) {
    case "eq":
      return sql`${col} = ${f.value}`;
    case "ne":
      return sql`${col} <> ${f.value}`;
    case "gt":
      return sql`${col} > ${f.value}`;
    case "gte":
      return sql`${col} >= ${f.value}`;
    case "lt":
      return sql`${col} < ${f.value}`;
    case "lte":
      return sql`${col} <= ${f.value}`;
    case "contains": {
      const v = `%${String(f.value)}%`;
      return sql`${col} ilike ${v}`;
    }
    case "startsWith": {
      const v = `${String(f.value)}%`;
      return sql`${col} ilike ${v}`;
    }
    case "endsWith": {
      const v = `%${String(f.value)}`;
      return sql`${col} ilike ${v}`;
    }
    case "in": {
      const arr = Array.isArray(f.value) ? (f.value as unknown[]) : [];
      const list = sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      );
      return sql`${col} in (${list})`;
    }
    case "nin": {
      const arr = Array.isArray(f.value) ? (f.value as unknown[]) : [];
      const list = sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      );
      return sql`${col} not in (${list})`;
    }
    case "between": {
      const [a, b] = f.value as [number, number];
      return sql`${col} between ${a} and ${b}`;
    }
    case "isNull":
      return sql`${col} is null`;
    case "isNotNull":
      return sql`${col} is not null`;
  }
}

function toExprRecursive(
  columns: Record<string, Column>,
  cond: FilterConditionDTO,
): WhereExpr | undefined {
  if (cond.op === "and" || cond.op === "or") {
    const nested = cond.value as unknown as
      | FilterConditionDTO
      | FilterConditionDTO[]
      | undefined;
    if (!nested) return undefined;
    const parts: Array<WhereExpr | undefined> = Array.isArray(nested)
      ? nested.map((c) => toExprRecursive(columns, c))
      : [toExprRecursive(columns, nested)];
    const kept = parts.filter((p): p is WhereExpr => Boolean(p));
    if (kept.length === 0) return undefined;
    return cond.op === "and" ? and(...kept) : or(...kept);
  }
  return toWherePart(columns, cond);
}

export function buildWhere<TCols extends Record<string, Column>>(
  columns: TCols,
  filters: FilterConditionDTO[] | undefined,
  orFilters?: FilterConditionDTO[] | undefined,
): WhereExpr | undefined {
  let acc: WhereExpr | undefined;
  for (const f of filters ?? []) {
    const expr = toExprRecursive(columns, f);
    if (!expr) continue;
    acc = acc ? and(acc, expr) : expr;
  }
  if (orFilters && orFilters.length > 0) {
    const orParts: WhereExpr[] = [];
    for (const f of orFilters) {
      const part = toExprRecursive(columns, f);
      if (part) orParts.push(part);
    }
    const orExpr = orParts.length > 0 ? or(...orParts) : undefined;
    acc = acc && orExpr ? and(acc, orExpr) : (acc ?? orExpr);
  }
  return acc;
}

// Legacy shim: accept array of conditions and delegate to buildWhere
export function buildWhereGroups<TCols extends Record<string, Column>>(
  columns: TCols,
  groups: FilterConditionDTO[],
): WhereExpr | undefined {
  return buildWhere(columns, groups);
}
