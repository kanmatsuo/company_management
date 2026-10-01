import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DjangoError } from "@/lib/django";
import { getSession } from "@/lib/current-user";
import { REFRESH_COOKIE, SESSION_RETRY_COOKIE } from "@/lib/session-cookies";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    if (error instanceof DjangoError && error.status === 401) {
      await redirectToRefresh();
    }
    const message = error instanceof DjangoError ? error.message : "Could not load your account.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="max-w-md text-muted-foreground text-sm">{message}</p>
      </main>
    );
  }

  if (!session) {
    await redirectToRefresh();
  }
  const user = session?.user;
  if (!user) return null;
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  return (
    <DashboardShell user={user} defaultOpen={defaultOpen}>
      {children}
    </DashboardShell>
  );
}

async function redirectToRefresh(): Promise<never> {
  const jar = await cookies();
  if (!jar.get(REFRESH_COOKIE)) redirect("/login");
  if (jar.get(SESSION_RETRY_COOKIE)) redirect("/api/session/reset");
  const path = (await headers()).get("x-pathname") || "/";
  redirect(`/api/session/refresh?next=${encodeURIComponent(path)}`);
}
