import { NextResponse, type NextRequest } from "next/server";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getSession } from "@/lib/current-user";

/** Polled by the Assign card page: the newest card tapped on a card assign reader. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const query = new URLSearchParams();
  for (const name of ["device", "after"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value && /^\d+$/.test(value)) query.set(name, value);
  }
  try {
    const body = await djangoFetch<unknown>(`/api/v1/rfid/card-reads/?${query}`, { accessToken: session.token });
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof DjangoError ? error.message : "Could not reach the card reader.";
    const status = error instanceof DjangoError ? error.status : 502;
    return NextResponse.json({ message }, { status });
  }
}
