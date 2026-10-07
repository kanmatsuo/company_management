import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/current-user";
import { getApiUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";

/** Excel downloads (exports and import templates), fetched with the session's token. */
const FILES: Record<string, string> = {
  developers: "/api/v1/exports/developers/",
  money: "/api/v1/exports/money/",
  goods: "/api/v1/exports/goods/",
  "finance-stats": "/api/v1/exports/finance-stats/",
  purchases: "/api/v1/purchases/export/",
  cards: "/api/v1/rfid/cards/export/",
  readers: "/api/v1/rfid/devices/export/",
  "template-developers": "/api/v1/imports/developers/template/",
  "template-cards": "/api/v1/imports/cards/template/",
  "template-balances": "/api/v1/imports/balances/template/",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const path = FILES[(await params).file];
  if (!path) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const query = new URLSearchParams();
  for (const name of ["date_from", "date_to", "out_after", "out_before"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) query.set(name, value);
  }
  // The lists' filters, so a list's download matches what it shows.
  for (const name of ["status", "search", "birthday_month", "department", "building", "assigned", "purpose", "online", "is_active"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value) query.set(name, value.slice(0, 100));
  }
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}${query.size ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${session.token}`, "Accept-Language": await getLocale() },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Could not reach the API server." }, { status: 502 });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message ?? "Could not make the file." }, { status: response.status });
  }
  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  });
}
