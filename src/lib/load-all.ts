import "server-only";
import { djangoFetch } from "@/lib/django";

type Page<T> = {
  count: number;
  results: T[];
};

/** Load every page of a paginated Django list. */
export async function loadAll<T>(token: string, path: string): Promise<{ count: number; results: T[] }> {
  const pageSize = 200;
  const joiner = path.includes("?") ? "&" : "?";
  const first = await djangoFetch<Page<T>>(`${path}${joiner}page_size=${pageSize}`, {
    accessToken: token,
  });
  const results = [...first.results];
  let page = 2;
  while (results.length < first.count && page <= 20) {
    const next = await djangoFetch<Page<T>>(`${path}${joiner}page_size=${pageSize}&page=${page}`, {
      accessToken: token,
    });
    if (next.results.length === 0) break;
    results.push(...next.results);
    page += 1;
  }
  return { count: first.count, results };
}

export function show(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** UTC timestamp shown in the viewer's local time. Date-only strings stay as-is. */
export function listPath(path: string, filters: Record<string, string | undefined>) {
  const [base, existing] = path.split("?");
  const params = new URLSearchParams(existing ?? "");
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

/** UTC timestamp shown in the viewer's local time. Date-only strings stay as-is. */
export function showTime(value: string | null | undefined) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
