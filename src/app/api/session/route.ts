import { NextResponse } from "next/server";
import type { components } from "@/api/schema";
import { DjangoError, djangoFetch } from "@/lib/django";
import { clearSession, getRefreshToken, setSession } from "@/lib/session";

type TokenPair = components["schemas"]["TokenObtainPair"];
type Me = components["schemas"]["Me"];

export async function POST(request: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const details: Record<string, string[]> = {};
  if (!email) details.email = ["Enter your email."];
  if (!password) details.password = ["Enter your password."];
  if (Object.keys(details).length > 0) {
    return NextResponse.json(
      { message: "Invalid input.", code: "VALIDATION_ERROR", details },
      { status: 400 },
    );
  }

  try {
    const tokens = await djangoFetch<TokenPair>("/api/v1/auth/token/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const user = await djangoFetch<Me>("/api/v1/auth/me/", {
      accessToken: tokens.access,
    });
    await setSession(tokens.access, tokens.refresh);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles,
        permissions: user.permissions,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    if (error instanceof DjangoError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          details: error.details,
          requestId: error.requestId,
        },
        { status: error.status === 502 ? 502 : error.status },
      );
    }
    throw error;
  }
}

export async function DELETE() {
  const refresh = await getRefreshToken();
  if (refresh) {
    try {
      await djangoFetch<void>("/api/v1/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Clear the browser session even if the refresh token is already revoked.
    }
  }
  await clearSession();
  return new NextResponse(null, { status: 204 });
}
