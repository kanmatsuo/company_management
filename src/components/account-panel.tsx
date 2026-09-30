"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
  last_login: string | null;
};

export function AccountPanel({ user }: { user: User }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const lastLogin = user.last_login
    ? new Date(user.last_login).toLocaleString()
    : "No previous sign-in";

  async function onLogout() {
    setPending(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500">Signed in</p>
      <h1 className="mt-1 text-2xl font-semibold">{user.full_name || user.email}</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{user.email}</p>
      <dl className="mt-6 grid gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Roles</dt>
          <dd>{user.roles.length > 0 ? user.roles.join(", ") : "None"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last sign-in</dt>
          <dd>{lastLogin}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Permissions</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {user.permissions.map((code) => (
              <span
                key={code}
                className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-900"
              >
                {code}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className="mt-6 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </section>
  );
}
