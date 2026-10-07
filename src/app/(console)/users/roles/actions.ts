"use server";

import type { FormState } from "@/lib/form";
import { commit } from "@/lib/submit";

export async function createRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  return commit({
    permission: "role.manage",
    path: "/api/v1/roles/",
    body: {
      code,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      permissions: formData.getAll("permissions").map(String),
    },
    redirectTo: `/users/roles/${code}`,
  });
}

export async function updateRole(code: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "role.manage",
    path: `/api/v1/roles/${encodeURIComponent(code)}/`,
    method: "PATCH",
    body: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      ...(formData.get("locked") ? {} : { permissions: formData.getAll("permissions").map(String) }),
    },
    notice: "Saved.",
  });
}

export async function deleteRole(code: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({
    permission: "role.manage",
    path: `/api/v1/roles/${encodeURIComponent(code)}/`,
    method: "DELETE",
    redirectTo: "/users/roles",
  });
}
