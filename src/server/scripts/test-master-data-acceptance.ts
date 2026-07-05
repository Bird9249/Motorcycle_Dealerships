/**
 * Manual acceptance test for Master Data CRUD (Phase 0).
 * Run: bun run src/server/scripts/test-master-data-acceptance.ts
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const ADMIN = { email: "admin@admin.com", password: "123456" };

type Result = { name: string; ok: boolean; detail: string };

const results: Result[] = [];

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}: ${detail}`);
}

async function jsonFetch(
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<{ status: number; body: unknown; setCookie?: string }> {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body, setCookie: res.headers.get("set-cookie") ?? undefined };
}

function extractSessionCookie(setCookie?: string): string | undefined {
  if (!setCookie) return undefined;
  return setCookie
    .split(/,(?=\s*admin-)/)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function login(): Promise<string> {
  const res = await jsonFetch("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(ADMIN),
  });
  const cookie = extractSessionCookie(res.setCookie);
  if (res.status !== 200 || !cookie) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return cookie;
}

async function main() {
  console.log(`\n🧪 Master Data Acceptance Tests @ ${BASE}\n`);

  let cookie: string;
  try {
    cookie = await login();
    pass("Login", "admin session obtained");
  } catch (e) {
    fail("Login", String(e));
    printSummary();
    process.exit(1);
  }

  const suffix = Date.now();
  const brandName = `TestBrand-${suffix}`;
  const iceName = `TestICE-${suffix}`;
  const evName = `TestEV-${suffix}`;
  const colorName = `TestColor-${suffix}`;
  const hexCode = "#A1B2C3";

  // 1. Create brand + ICE/EV models
  const brandRes = await jsonFetch(
    "/api/master-data/brands",
    { method: "POST", body: JSON.stringify({ name: brandName }) },
    cookie,
  );
  const brand = brandRes.body as { id?: string; name?: string; slug?: string };
  if (brandRes.status === 201 && brand.id) {
    pass("Create brand", `${brand.name} (${brand.slug})`);
  } else {
    fail("Create brand", `${brandRes.status} ${JSON.stringify(brandRes.body)}`);
  }

  const brandId = brand.id;
  if (!brandId) {
    printSummary();
    process.exit(1);
  }

  const iceRes = await jsonFetch(
    "/api/master-data/models",
    {
      method: "POST",
      body: JSON.stringify({
        brandId,
        name: iceName,
        vehicleType: "ice",
        engineCc: 150,
        year: 2025,
      }),
    },
    cookie,
  );
  const ice = iceRes.body as { id?: string; vehicleType?: string };
  if (iceRes.status === 201 && ice.id && ice.vehicleType === "ice") {
    pass("Create ICE model", iceName);
  } else {
    fail("Create ICE model", `${iceRes.status} ${JSON.stringify(iceRes.body)}`);
  }

  const evRes = await jsonFetch(
    "/api/master-data/models",
    {
      method: "POST",
      body: JSON.stringify({
        brandId,
        name: evName,
        vehicleType: "ev",
        batteryCapacityKwh: "4.5",
        year: 2025,
      }),
    },
    cookie,
  );
  const ev = evRes.body as { id?: string; vehicleType?: string };
  if (evRes.status === 201 && ev.id && ev.vehicleType === "ev") {
    pass("Create EV model", evName);
  } else {
    fail("Create EV model", `${evRes.status} ${JSON.stringify(evRes.body)}`);
  }

  // 2. Create color with hex
  const colorRes = await jsonFetch(
    "/api/master-data/colors",
    {
      method: "POST",
      body: JSON.stringify({ name: colorName, hexCode }),
    },
    cookie,
  );
  const color = colorRes.body as { id?: string; hexCode?: string };
  if (colorRes.status === 201 && color.id && color.hexCode === hexCode) {
    pass("Create color with hex", `${colorName} ${hexCode}`);
  } else {
    fail(
      "Create color with hex",
      `${colorRes.status} ${JSON.stringify(colorRes.body)}`,
    );
  }

  // 3. Duplicate name → 409
  const dupRes = await jsonFetch(
    "/api/master-data/models",
    {
      method: "POST",
      body: JSON.stringify({
        brandId,
        name: iceName,
        vehicleType: "ice",
        engineCc: 125,
      }),
    },
    cookie,
  );
  const dupBody = dupRes.body as { error?: string; message?: string };
  if (dupRes.status === 409 && dupBody.error === "CONFLICT") {
    pass("Duplicate model name → 409", dupBody.message ?? "CONFLICT");
  } else {
    fail(
      "Duplicate model name → 409",
      `${dupRes.status} ${JSON.stringify(dupRes.body)}`,
    );
  }

  const dupColorRes = await jsonFetch(
    "/api/master-data/colors",
    {
      method: "POST",
      body: JSON.stringify({ name: colorName, hexCode: "#FF0000" }),
    },
    cookie,
  );
  const dupColorBody = dupColorRes.body as { error?: string; message?: string };
  if (dupColorRes.status === 409 && dupColorBody.error === "CONFLICT") {
    pass("Duplicate color name → 409", dupColorBody.message ?? "CONFLICT");
  } else {
    fail(
      "Duplicate color name → 409",
      `${dupColorRes.status} ${JSON.stringify(dupColorRes.body)}`,
    );
  }

  // 4. Deactivate model → hidden from inventory dropdown; existing vehicles keep model
  const iceId = ice.id;
  if (iceId) {
    // Prefer a seeded vehicle's model for the "existing vehicle" scenario
    const vehiclesRes = await jsonFetch(
      "/api/inventory/vehicles?limit=1&offset=0",
      {},
      cookie,
    );
    const vehiclesPayload = vehiclesRes.body as {
      data?: Array<{ id: string; modelId?: string }>;
    };
    const seededVehicle = vehiclesPayload.data?.[0];
    const modelToDeactivate = seededVehicle?.modelId ?? iceId;
    const modelLabel = seededVehicle ? "seeded vehicle model" : iceName;

    const deactivateRes = await jsonFetch(
      `/api/master-data/models/${modelToDeactivate}/status`,
      { method: "PATCH", body: JSON.stringify({ isActive: false }) },
      cookie,
    );
    if (deactivateRes.status === 200) {
      pass("Deactivate model", modelLabel);
    } else {
      fail("Deactivate model", `${deactivateRes.status}`);
    }

    const invModelsRes = await jsonFetch("/api/inventory/models", {}, cookie);
    const invModels = invModelsRes.body as Array<{ id: string }>;
    const inDropdown =
      Array.isArray(invModels) &&
      invModels.some((m) => m.id === modelToDeactivate);
    if (invModelsRes.status === 200 && !inDropdown) {
      pass(
        "Inactive model hidden from inventory dropdown",
        `model ${modelToDeactivate} not in list`,
      );
    } else {
      fail(
        "Inactive model hidden from inventory dropdown",
        inDropdown ? "still visible" : `${invModelsRes.status}`,
      );
    }

    if (seededVehicle) {
      const detailRes = await jsonFetch(
        `/api/inventory/vehicles/${seededVehicle.id}`,
        {},
        cookie,
      );
      const detail = detailRes.body as {
        model?: { id?: string; name?: string };
      };
      if (
        detailRes.status === 200 &&
        detail.model?.id === modelToDeactivate
      ) {
        pass(
          "Existing vehicle still shows deactivated model",
          detail.model.name ?? modelToDeactivate,
        );
      } else {
        fail(
          "Existing vehicle still shows deactivated model",
          `${detailRes.status} model=${detail.model?.id}`,
        );
      }

      // Restore model for seed data
      await jsonFetch(
        `/api/master-data/models/${modelToDeactivate}/status`,
        { method: "PATCH", body: JSON.stringify({ isActive: true }) },
        cookie,
      );
    } else {
      const mdModelRes = await jsonFetch(
        `/api/master-data/models/${iceId}`,
        {},
        cookie,
      );
      const mdModel = mdModelRes.body as { id?: string; isActive?: boolean };
      if (
        mdModelRes.status === 200 &&
        mdModel.id === iceId &&
        mdModel.isActive === false
      ) {
        pass(
          "Deactivated model readable via master-data API",
          "(no seeded vehicles; verified via master-data GET)",
        );
      } else {
        fail("Deactivated model still accessible", `${mdModelRes.status}`);
      }
    }
  }

  // 5. RBAC — unauthenticated blocked
  const unauthRes = await jsonFetch("/api/master-data/brands");
  if (unauthRes.status === 401 || unauthRes.status === 403) {
    pass("RBAC blocks unauthenticated", `HTTP ${unauthRes.status}`);
  } else {
    fail("RBAC blocks unauthenticated", `HTTP ${unauthRes.status}`);
  }

  // Admin has full CRUD
  const permsCheck = await jsonFetch("/api/master-data/brands", {}, cookie);
  if (permsCheck.status === 200) {
    pass("RBAC admin can read master-data", "GET /brands 200");
  } else {
    fail("RBAC admin can read master-data", `${permsCheck.status}`);
  }

  // 6. Audit log
  const auditRes = await jsonFetch(
    `/api/audit?limit=20&offset=0&filters=${encodeURIComponent(
      JSON.stringify([
        { field: "action", op: "contains", value: "MASTER_DATA" },
      ]),
    )}`,
    {},
    cookie,
  );
  const audit = auditRes.body as { data?: Array<{ action: string; entityType?: string }> };
  const actions = audit.data?.map((a) => a.action) ?? [];
  const hasCreate = actions.some((a) => a.includes("MASTER_DATA.BRAND.CREATE"));
  const hasModelCreate = actions.some((a) => a.includes("MASTER_DATA.MODEL.CREATE"));
  const hasStatus = actions.some((a) => a.includes("MASTER_DATA.MODEL.STATUS_UPDATE"));
  if (auditRes.status === 200 && hasCreate && hasModelCreate) {
    pass(
      "Audit log records create",
      `found BRAND.CREATE + MODEL.CREATE${hasStatus ? " + STATUS_UPDATE" : ""}`,
    );
  } else {
    fail(
      "Audit log records create/update",
      `${auditRes.status} actions=${actions.slice(0, 5).join(", ")}`,
    );
  }

  // Cleanup: deactivate test entities (soft)
  if (brandId) {
    await jsonFetch(
      `/api/master-data/brands/${brandId}/status`,
      { method: "PATCH", body: JSON.stringify({ isActive: false }) },
      cookie,
    );
  }
  if (color.id) {
    await jsonFetch(
      `/api/master-data/colors/${color.id}/status`,
      { method: "PATCH", body: JSON.stringify({ isActive: false }) },
      cookie,
    );
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n📋 Summary: ${ok}/${total} passed\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
