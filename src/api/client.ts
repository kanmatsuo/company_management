import "server-only";
import createClient from "openapi-fetch";
import { getApiUrl } from "@/lib/env";
import type { paths } from "./schema";

/** Typed Django client. Pass the access token from the httpOnly session cookie. */
export function createApiClient(accessToken?: string) {
  return createClient<paths>({
    baseUrl: getApiUrl(),
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
}
