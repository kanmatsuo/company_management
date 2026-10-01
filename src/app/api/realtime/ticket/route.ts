import { NextResponse } from "next/server";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getSession } from "@/lib/current-user";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  try {
    const ticket = await djangoFetch<{ ticket: string; expires_in: number }>("/api/v1/realtime/ticket/", {
      method: "POST",
      accessToken: session.token,
    });
    return NextResponse.json(ticket);
  } catch (error) {
    const message = error instanceof DjangoError ? error.message : "Could not open a live connection.";
    const status = error instanceof DjangoError ? error.status : 502;
    return NextResponse.json({ message }, { status });
  }
}
