export type FormState = {
  message?: string;
  notice?: string;
  fields?: Record<string, string[]>;
} | null;

export function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export function optionalText(form: FormData, name: string) {
  const value = text(form, name);
  return value ? value : undefined;
}

export function optionalInt(form: FormData, name: string) {
  const value = text(form, name);
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function checked(form: FormData, name: string) {
  return form.get(name) === "on";
}

export function dateTime(form: FormData, name: string) {
  const value = text(form, name);
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function idFrom(data: unknown) {
  if (data && typeof data === "object" && "id" in data && typeof data.id === "number") return data.id;
  return null;
}
