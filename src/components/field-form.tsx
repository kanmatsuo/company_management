"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/locale-context";
import { CreatableSelect } from "@/components/creatable-select";
import { SearchSelect } from "@/components/search-select";
import { UserMultiSelect } from "@/components/user-multi-select";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "datetime-local" | "textarea" | "select" | "users" | "checkbox" | "file" | "hidden";
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** A dropdown of these values that also takes a new one (CreatableSelect). */
  suggestions?: string[];
  /** Hide this field until another field (usually a select) has this value. */
  visibleWhen?: { name: string; value: string };
};

const control =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FieldForm({
  action,
  fields,
  submitLabel,
  pendingLabel = "Saving…",
  variant = "default",
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel?: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, null as FormState);
  const locale = useLocale();
  const watched = useMemo(() => new Set(fields.flatMap((field) => (field.visibleWhen ? [field.visibleWhen.name] : []))), [fields]);
  const [values, setValues] = useState(() => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      if (watched.has(field.name)) next[field.name] = field.defaultValue ?? "";
    }
    return next;
  });

  return (
    <form action={formAction} encType={fields.some((field) => field.type === "file") ? "multipart/form-data" : undefined} className="grid max-w-md gap-4">
      {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
      {state?.notice ? (
        <div className="grid gap-2 rounded-lg border bg-muted p-3">
          <p className="text-sm">{t(locale, "This key is shown only once. Copy it before you leave the page.")}</p>
          <p className="break-all font-mono text-sm">{state.notice}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const key = state.notice?.split(": ").pop() ?? state.notice ?? "";
              void navigator.clipboard.writeText(key);
            }}
          >
            {t(locale, "Copy key")}
          </Button>
        </div>
      ) : null}
      {fields.map((field) => {
        if (field.visibleWhen && values[field.visibleWhen.name] !== field.visibleWhen.value) return null;
        const errors = state?.fields?.[field.name];
        if (field.type === "hidden") {
          return <input key={field.name} type="hidden" name={field.name} value={field.defaultValue ?? ""} />;
        }
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm">
              <input name={field.name} type="checkbox" defaultChecked={field.defaultValue === "on"} className="size-4" />
              {t(locale, field.label)}
            </label>
          );
        }
        return (
          <div key={field.name} className="grid gap-1.5">
            <Label htmlFor={field.name}>{t(locale, field.label)}</Label>
            {field.type === "textarea" ? (
              <textarea id={field.name} name={field.name} required={field.required} defaultValue={field.defaultValue} className={`${control} min-h-20 py-2`} />
            ) : field.type === "users" ? (
              <UserMultiSelect
                name={field.name}
                locale={locale}
                defaultValue={field.defaultValue}
                options={(field.options ?? []).map((option) => ({ value: option.value, label: t(locale, option.label) }))}
              />
            ) : field.type === "select" ? (
              <SearchSelect
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={field.defaultValue}
                locale={locale}
                options={(field.options ?? []).map((option) => ({ value: option.value, label: t(locale, option.label) }))}
                onValueChange={watched.has(field.name) ? (value) => setValues((prev) => ({ ...prev, [field.name]: value })) : undefined}
              />
            ) : field.suggestions ? (
              <CreatableSelect
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={field.defaultValue}
                values={field.suggestions}
                placeholder={field.placeholder ?? "Choose"}
                locale={locale}
              />
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder ? t(locale, field.placeholder) : undefined}
              />
            )}
            {errors?.map((error) => (
              <p key={error} className="text-destructive text-xs">{error}</p>
            ))}
          </div>
        );
      })}
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? t(locale, pendingLabel) : t(locale, submitLabel)}
      </Button>
    </form>
  );
}
