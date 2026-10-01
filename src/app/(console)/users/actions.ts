"use server";

import { redirect } from "next/navigation";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";

export type FormState = {
  message?: string;
  fields?: Record<string, string[]>;
} | null;

async function sessionOrLogin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

function formError(error: unknown): FormState {
  if (error instanceof DjangoError) {
    return { message: error.message, fields: error.details ?? undefined };
  }
  throw error;
}

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await sessionOrLogin();
  if (!can(session.user, "user.manage")) return { message: "You don't have access." };
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  try {
    await djangoFetch("/api/v1/users/", {
      method: "POST",
      accessToken: session.token,
      body: JSON.stringify({
        email,
        password,
        ...(fullName ? { full_name: fullName } : {}),
      }),
    });
  } catch (error) {
    return formError(error);
  }
  redirect("/users");
}

export async function updateUser(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await sessionOrLogin();
  if (!can(session.user, "user.manage")) return { message: "You don't have access." };
  const fullName = String(formData.get("full_name") ?? "").trim();
  const isActive = formData.get("is_active") === "on";
  try {
    await djangoFetch(`/api/v1/users/${id}/`, {
      method: "PATCH",
      accessToken: session.token,
      body: JSON.stringify({ full_name: fullName, is_active: isActive }),
    });
  } catch (error) {
    return formError(error);
  }
  redirect(`/users/${id}`);
}

export async function assignRole(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await sessionOrLogin();
  if (!can(session.user, "role.assign")) return { message: "You don't have access." };
  const role = String(formData.get("role") ?? "").trim();
  if (!role) return { message: "Choose a role.", fields: { role: ["Choose a role."] } };
  try {
    await djangoFetch(`/api/v1/users/${id}/roles/`, {
      method: "POST",
      accessToken: session.token,
      body: JSON.stringify({ role }),
    });
  } catch (error) {
    return formError(error);
  }
  redirect(`/users/${id}`);
}

export async function deactivateUser(id: number, nextPath: string, prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  void formData;
  const session = await sessionOrLogin();
  if (!can(session.user, "user.manage")) return { message: "You don't have access." };
  try {
    await djangoFetch(`/api/v1/users/${id}/`, {
      method: "PATCH",
      accessToken: session.token,
      body: JSON.stringify({ is_active: false }),
    });
  } catch (error) {
    return formError(error);
  }
  redirect(nextPath.startsWith("/users") ? nextPath : "/users");
}

export async function deleteUser(id: number, prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  void formData;
  const session = await sessionOrLogin();
  if (!can(session.user, "user.manage")) return { message: "You don't have access." };
  try {
    await djangoFetch(`/api/v1/users/${id}/`, {
      method: "DELETE",
      accessToken: session.token,
    });
  } catch (error) {
    if (error instanceof DjangoError && (error.status === 405 || error.status === 403)) {
      return { message: "The server does not permanently delete users. Deactivate the account instead." };
    }
    return formError(error);
  }
  redirect("/users");
}

export async function removeRole(id: number, roleCode: string): Promise<void> {
  const session = await sessionOrLogin();
  if (!can(session.user, "role.assign")) return;
  try {
    await djangoFetch(`/api/v1/users/${id}/roles/${roleCode}/`, {
      method: "DELETE",
      accessToken: session.token,
    });
  } catch (error) {
    if (error instanceof DjangoError) return;
    throw error;
  }
  redirect(`/users/${id}`);
}
