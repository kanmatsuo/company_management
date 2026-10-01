import "server-only";
import type { components } from "@/api/schema";
import { djangoFetch } from "@/lib/django";
import { getRefreshToken, setSession } from "@/lib/session";

type TokenRefresh = components["schemas"]["TokenRefresh"];

const CACHE_MS = 15_000;

type Cached = { tokens: TokenRefresh; at: number };

const recent = new Map<string, Cached>();
let inflightKey: string | null = null;
let inflight: Promise<TokenRefresh> | null = null;

/** One Django refresh per refresh token, shared by parallel requests. */
export function refreshTokens(refresh: string): Promise<TokenRefresh> {
  const cached = recent.get(refresh);
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.tokens);
  if (inflight && inflightKey === refresh) return inflight;

  inflightKey = refresh;
  inflight = djangoFetch<TokenRefresh>("/api/v1/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  })
    .then((tokens) => {
      recent.set(refresh, { tokens, at: Date.now() });
      return tokens;
    })
    .finally(() => {
      if (inflightKey === refresh) {
        inflight = null;
        inflightKey = null;
      }
    });
  return inflight;
}

export async function refreshStoredSession(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  const tokens = await refreshTokens(refresh);
  await setSession(tokens.access, tokens.refresh);
  return tokens.access;
}
