import "server-only";
import { cookies, headers } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_RETRY_COOKIE } from "@/lib/session-cookies";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/** Secure cookies are only stored by the browser on HTTPS. nginx sets this header when it terminates TLS. */
export async function cookieOptions(maxAge: number) {
  const forwarded = (await headers()).get("x-forwarded-proto");
  const secure = forwarded?.split(",")[0]?.trim() === "https";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

export { ACCESS_MAX_AGE, REFRESH_MAX_AGE };

export async function setSession(access: string, refresh: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access, await cookieOptions(ACCESS_MAX_AGE));
  jar.set(REFRESH_COOKIE, refresh, await cookieOptions(REFRESH_MAX_AGE));
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(SESSION_RETRY_COOKIE);
}

/** Browser-facing origin. Binding Next to 0.0.0.0 makes request.url that address, which the browser cannot open. */
export function originFrom(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  if (host && !host.startsWith("0.0.0.0")) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}
