import "server-only";
import { redirect } from "next/navigation";
import { DjangoError } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { loadAll } from "@/lib/load-all";

export async function loadRecords<T>(permission: string, path: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, permission)) {
    return { denied: true as const, error: null, count: 0, results: [] as T[] };
  }
  try {
    const loaded = await loadAll<T>(session.token, path);
    return { denied: false as const, error: null, ...loaded };
  } catch (caught) {
    const error = caught instanceof DjangoError ? caught.message : "Could not load this list.";
    return { denied: false as const, error, count: 0, results: [] as T[] };
  }
}
