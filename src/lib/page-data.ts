import "server-only";
import { redirect } from "next/navigation";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getSession } from "@/lib/current-user";
import { loadFlexible } from "@/lib/load-all";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function loadOne<T>(path: string) {
  const session = await requireSession();
  try {
    const value = await djangoFetch<T>(path, { accessToken: session.token });
    return { error: null, value, session };
  } catch (caught) {
    const error = caught instanceof DjangoError ? caught.message : "Could not load this record.";
    return { error, value: null, session };
  }
}

export async function loadCount(path: string) {
  const session = await requireSession();
  const joiner = path.includes("?") ? "&" : "?";
  try {
    const page = await djangoFetch<{ count: number }>(`${path}${joiner}page_size=1`, { accessToken: session.token });
    return { error: null, count: page.count ?? 0 };
  } catch (caught) {
    const error = caught instanceof DjangoError ? caught.message : "Could not load this list.";
    return { error, count: 0 };
  }
}

export async function loadList<T>(path: string) {
  const session = await requireSession();
  try {
    const loaded = await loadFlexible<T>(session.token, path);
    return { error: null, session, ...loaded };
  } catch (caught) {
    const error = caught instanceof DjangoError ? caught.message : "Could not load this list.";
    return { error, session, count: 0, results: [] as T[] };
  }
}
