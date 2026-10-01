"use server";

import { redirect } from "next/navigation";
import { DjangoError, djangoFetch } from "@/lib/django";
import type { FormState } from "@/lib/form";
import { can, getSession } from "@/lib/current-user";

export async function commit(options: {
  permission?: string | null;
  path: string;
  method?: string;
  body?: unknown;
  rawBody?: BodyInit;
  authorization?: string;
  headers?: HeadersInit;
  redirectTo?: string | ((data: unknown) => string);
  notice?: string | ((data: unknown) => string);
}): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (options.permission && !can(session.user, options.permission)) {
    return { message: "You don't have access." };
  }

  let data: unknown;
  try {
    data = await djangoFetch<unknown>(options.path, {
      method: options.method ?? (options.body || options.rawBody ? "POST" : "POST"),
      accessToken: options.authorization ? undefined : session.token,
      authorization: options.authorization,
      headers: options.headers,
      body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
    });
  } catch (error) {
    if (error instanceof DjangoError) {
      return { message: error.message, fields: error.details ?? undefined };
    }
    throw error;
  }

  if (options.redirectTo) {
    redirect(typeof options.redirectTo === "function" ? options.redirectTo(data) : options.redirectTo);
  }
  const notice = typeof options.notice === "function" ? options.notice(data) : options.notice;
  return { notice: notice ?? "Saved." };
}
