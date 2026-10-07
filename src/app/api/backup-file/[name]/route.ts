import { NextResponse } from "next/server";
import { getSession } from "@/lib/current-user";
import { getApiUrl } from "@/lib/env";

/** Download one nightly dump (Backups page, Admin), streamed from the backend. */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const name = (await params).name;
  if (!/^[A-Za-z0-9_]+-\d{8}-\d{6}\.dump$/.test(name)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}/api/v1/system/backups/files/${name}/`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Could not reach the API server." }, { status: 502 });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message ?? "Could not download." }, { status: response.status });
  }
  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename="${name}"`,
    "Cache-Control": "no-store",
  });
  const length = response.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  return new NextResponse(response.body, { headers });
}
