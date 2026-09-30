import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { AccountPanel } from "@/components/account-panel";
import { LoginForm } from "@/components/login-form";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getAccessToken } from "@/lib/session";

type Me = components["schemas"]["Me"];

export const dynamic = "force-dynamic";

export default async function Home() {
  const token = await getAccessToken();
  if (!token) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <LoginForm />
      </main>
    );
  }

  try {
    const user = await djangoFetch<Me>("/api/v1/auth/me/", { accessToken: token });
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <AccountPanel user={user} />
      </main>
    );
  } catch (error) {
    if (error instanceof DjangoError && error.status === 401) {
      redirect("/api/session/reset");
    }
    const message =
      error instanceof DjangoError ? error.message : "Could not load your account.";
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <LoginForm notice={message} />
      </main>
    );
  }
}
