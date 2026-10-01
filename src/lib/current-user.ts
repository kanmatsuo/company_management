import { cache } from "react";
import type { components } from "@/api/schema";
import { djangoFetch } from "@/lib/django";
import { can, canManage, canOpen } from "@/lib/permissions";
import { getAccessToken } from "@/lib/session";

export { can, canManage, canOpen };

export type CurrentUser = components["schemas"]["Me"];

export type Session = {
  token: string;
  user: CurrentUser;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  const user = await djangoFetch<CurrentUser>("/api/v1/auth/me/", { accessToken: token });
  return { token, user };
});

