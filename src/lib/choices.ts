import "server-only";
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

type Named = { id: number; full_name: string; employee_number?: string; email?: string; name?: string };

export function developerChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/developers/?ordering=full_name", (row) =>
    row.employee_number ? `${row.full_name} · ${row.employee_number}` : row.full_name,
  );
}

export function userChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/users/?ordering=full_name", (row) =>
    row.full_name ? `${row.full_name} · ${row.email ?? ""}` : (row.email ?? row.full_name),
  );
}

export function sellerChoices(token: string) {
  return asChoices<Named>(token, "/api/v1/sellers/?ordering=name", (row) => row.name ?? row.full_name);
}

export function positionChoices(token: string) {
  return asChoices<{ id: number; name: string; seller_detail?: { name?: string } }>(
    token,
    "/api/v1/service-positions/?ordering=name",
    (row) => (row.seller_detail?.name ? `${row.name} · ${row.seller_detail.name}` : row.name),
  );
}

export function goodChoices(token: string, servicePosition?: number) {
  const filter = servicePosition ? `&service_position=${servicePosition}` : "";
  return asChoices<Named>(token, `/api/v1/goods/?ordering=name&is_active=true${filter}`, (row) => row.name ?? row.full_name);
}
