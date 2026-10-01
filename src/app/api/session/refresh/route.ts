import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshTokens } from "@/lib/refresh-session";
import { ACCESS_MAX_AGE, REFRESH_MAX_AGE, cookieOptions, originFrom } from "@/lib/session";
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_RETRY_COOKIE } from "@/lib/session-cookies";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/";
  if (value.startsWith("/api/session/") || value.startsWith("/login")) return "/";
  return value;
}

async function clearAuthCookies(response: NextResponse) {
  const options = await cookieOptions(0);
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, SESSION_RETRY_COOKIE]) {
    response.cookies.set(name, "", options);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  if (jar.get(SESSION_RETRY_COOKIE)) {
    const login = NextResponse.redirect(new URL("/login", originFrom(request)));
    await clearAuthCookies(login);
    return login;
  }

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    const login = NextResponse.redirect(new URL("/login", originFrom(request)));
    await clearAuthCookies(login);
    return login;
  }

  try {
    const tokens = await refreshTokens(refresh);
    const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), originFrom(request)));
    response.cookies.set(ACCESS_COOKIE, tokens.access, await cookieOptions(ACCESS_MAX_AGE));
    response.cookies.set(REFRESH_COOKIE, tokens.refresh, await cookieOptions(REFRESH_MAX_AGE));
    response.cookies.set(SESSION_RETRY_COOKIE, "1", await cookieOptions(15));
    return response;
  } catch {
    const login = NextResponse.redirect(new URL("/login", originFrom(request)));
    await clearAuthCookies(login);
    return login;
  }
}
