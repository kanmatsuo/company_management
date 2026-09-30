import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DjangoError } from "@/lib/django";
import { getSession } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    if (error instanceof DjangoError && error.status === 401) {
      redirect("/api/session/reset");
    }
    const message = error instanceof DjangoError ? error.message : "Could not load your account.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="max-w-md text-muted-foreground text-sm">{message}</p>
      </main>
    );
  }

  if (!session) redirect("/login");
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  return (
    <DashboardShell user={session.user} defaultOpen={defaultOpen}>
      {children}
    </DashboardShell>
  );
}
