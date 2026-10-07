import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/current-user";
import { getApiUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";

/** Backups page: upload a .dump, streamed through to the backend (no size limit here;
 * nginx allows 2 GB on this path, the backup helper checks UPLOAD_MAX_BYTES). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data") || !request.body) {
    return NextResponse.json({ message: "Choose a backup file." }, { status: 400 });
  }
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}/api/v1/system/backups/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}`, "Content-Type": type, "Accept-Language": await getLocale() },
      body: request.body,
      cache: "no-store",
      duplex: "half",
    } as RequestInit & { duplex: "half" });
  } catch {
    return NextResponse.json({ message: "Could not reach the API server." }, { status: 502 });
  }
  const body = (await response.json().catch(() => null)) as { name?: string; error?: { message?: string } } | null;
  if (!response.ok) {
    return NextResponse.json({ message: body?.error?.message ?? "The upload failed." }, { status: response.status });
  }
  return NextResponse.json(body, { status: 201 });
}
