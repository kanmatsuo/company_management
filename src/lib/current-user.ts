import { cache } from "react";
import type { components } from "@/api/schema";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, canManage, canOpen } from "@/lib/permissions";
import { getAccessToken } from "@/lib/session";

export { can, canManage, canOpen };

export type CurrentUser = components["schemas"]["Me"];

export type Session = {
  token: string;
  user: CurrentUser;
};

type OwnStore = { id?: number; status?: string; user?: number | null };

export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  const user = await djangoFetch<CurrentUser>("/api/v1/auth/me/", { accessToken: token });
  return { token, user };
});

export const ownStore = cache(async (): Promise<OwnStore | null> => {
  const session = await getSession();
  if (!session) return null;
  try {
    return await djangoFetch<OwnStore>("/api/v1/sellers/me/", { accessToken: session.token });
  } catch (error) {
    if (error instanceof DjangoError) return null;
    throw error;
  }
});

export async function runsStore() {
  const store = await ownStore();
  return store?.status === "ACTIVE";
}

export async function ownsStore(userId: number) {
  const store = await ownStore();
  return store?.status === "ACTIVE" && store.user === userId;
}

