import "server-only";
import { djangoFetch } from "@/lib/django";
import { loadFlexible } from "@/lib/load-all";

export type Choice = { value: string; label: string };

async function asChoices<T extends { id: number }>(token: string, path: string, label: (row: T) => string): Promise<Choice[]> {
  try {
    const page = await loadFlexible<T>(token, path);
    return page.results.map((row) => ({ value: String(row.id), label: label(row) || `Record ${row.id}` }));
  } catch {
    return [];
  }
}

type Named = { id: number; full_name: string; employee_number?: string; username?: string; name?: string };

/** "E1001 · Kim Chol", sorted by employee number (search finds either part). */
export function developerChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/developers/?ordering=employee_number", (row) =>
    row.employee_number ? `${row.employee_number} · ${row.full_name}` : row.full_name,
  );
}

export function userChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/users/?ordering=full_name", (row) =>
    row.full_name ? `${row.full_name} · ${row.username ?? ""}` : (row.username ?? row.full_name),
  );
}

export function buildingChoices(token: string) {
  return asChoices<{ id: number; code?: string; name?: string }>(token, "/api/v1/rfid/buildings/", (row) =>
    row.code ? `${row.name ?? row.code} · ${row.code}` : (row.name ?? `Building ${row.id}`),
  );
}

/** Users with one role: the only ones who can be linked to that job. */
export function roleUserChoices(token: string, role: string) {
  return asChoices<Named>(token, `/api/v1/users/?role=${encodeURIComponent(role)}&ordering=full_name`, (row) =>
    row.full_name ? `${row.full_name} · ${row.username ?? ""}` : (row.username ?? row.full_name),
  );
}

/** Users with the SELLER role: the only ones who can run a store or a position. */
export function sellerUserChoices(token: string) {
  return roleUserChoices(token, "SELLER");
}

export function sellerChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/sellers/?ordering=name", (row) => row.name ?? row.full_name);
}

export function positionChoices(token: string, { sellingOnly = false } = {}) {
  // sellingOnly: counters that can sell now (active, of an active seller), e.g. for the till.
  const filters = sellingOnly ? "&is_active=true&seller_status=ACTIVE" : "";
  return asChoices<{ id: number; name: string; seller_detail?: { name?: string } }>(
    token,
    `/api/v1/service-positions/?ordering=name${filters}`,
    (row) => (row.seller_detail?.name ? `${row.name} · ${row.seller_detail.name}` : row.name),
  );
}

export async function goodChoices(token: string, servicePosition?: number) {
  const filter = servicePosition ? `&service_position=${servicePosition}` : "";
  try {
    const page = await loadFlexible<{ id: number; name?: string; kind?: string }>(
      token,
      `/api/v1/goods/?ordering=name&is_active=true${filter}`,
    );
    return page.results
      .filter((row) => row.kind !== "RENTAL")
      .map((row) => ({ value: String(row.id), label: row.name || `Record ${row.id}` }));
  } catch {
    return [];
  }
}

/** Departments already used, to suggest while typing one. */
export async function departmentNames(token: string): Promise<string[]> {
  try {
    return await djangoFetch<string[]>("/api/v1/developers/departments/", { accessToken: token });
  } catch {
    return [];
  }
}

/** Goods with stock tracking (the caller's own for a seller), labelled with the stock now. */
export function stockGoodChoices(token: string) {
  return asChoices<{ id: number; name: string; quantity?: number; position_detail?: { name?: string } }>(
    token,
    "/api/v1/goods/?track_stock=true&is_active=true&ordering=name",
    (row) => `${row.name}${row.position_detail?.name ? ` · ${row.position_detail.name}` : ""} · ${row.quantity ?? 0} in stock`,
  );
}
