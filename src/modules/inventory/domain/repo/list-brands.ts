import { eq } from "drizzle-orm";
import { brands } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

export async function listBrands(client: DbTransaction) {
  return client
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      isActive: brands.isActive,
    })
    .from(brands)
    .where(eq(brands.isActive, true))
    .orderBy(brands.name);
}
