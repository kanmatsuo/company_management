import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session-cookies";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type Tokens = { access: string; refresh: string; at: number };

// Refresh tokens rotate, so concurrent requests reuse a fresh exchange for REUSE_MS.
const REUSE_MS = 15_000;
const recent = new Map<string, Tokens>();
let inflightKey: string | null = null;
let inflight: Promise<Tokens> | null = null;

function accessExpired(token: string) {
  const part = token.split(".")[1];
  if (!part) return true;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString()) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now() + 10_000;
  } catch {
    return true;
  }
}

function exchange(refresh: string) {
  const cached = recent.get(refresh);
  if (cached && Date.now() - cached.at < REUSE_MS) return Promise.resolve(cached);
  if (inflight && inflightKey === refresh) return inflight;
  inflightKey = refresh;
  const api = process.env.API_URL?.trim().replace(/\/$/, "");
  if (!api) throw new Error("refresh failed");
  inflight = fetch(`${api}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("refresh failed");
      const body = (await response.json()) as { access?: string; refresh?: string };
      if (!body.access || !body.refresh) throw new Error("refresh failed");
      const tokens = { access: body.access, refresh: body.refresh, at: Date.now() };
      for (const [key, value] of recent) {
        if (tokens.at - value.at >= REUSE_MS) recent.delete(key);
      }
      recent.set(refresh, tokens);
      recent.set(tokens.refresh, tokens);
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

function cookieHeader(request: NextRequest, access: string, refresh: string) {
  const pairs = request.cookies
    .getAll()
    .filter((cookie) => cookie.name !== ACCESS_COOKIE && cookie.name !== REFRESH_COOKIE)
    .map((cookie) => `${cookie.name}=${cookie.value}`);
  pairs.push(`${ACCESS_COOKIE}=${access}`, `${REFRESH_COOKIE}=${refresh}`);
  return pairs.join("; ");
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.set("x-pathname", path);

  if (refresh && (!access || accessExpired(access))) {
    try {
      const tokens = await exchange(refresh);
      headers.set("cookie", cookieHeader(request, tokens.access, tokens.refresh));
      const next = NextResponse.next({ request: { headers } });
      const secure = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
      const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
      next.cookies.set(ACCESS_COOKIE, tokens.access, { ...base, maxAge: ACCESS_MAX_AGE });
      next.cookies.set(REFRESH_COOKIE, tokens.refresh, { ...base, maxAge: REFRESH_MAX_AGE });
      return next;
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      const login = NextResponse.redirect(url);
      login.cookies.delete(ACCESS_COOKIE);
      login.cookies.delete(REFRESH_COOKIE);
      return login;
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
