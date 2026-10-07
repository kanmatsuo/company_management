"use client";

import { CreatableSelect } from "@/components/creatable-select";
import { DatePicker } from "@/components/date-picker";
import { useLocale } from "@/components/locale-context";
import { SearchSelect } from "@/components/search-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

export type Choice = { value: string; label: string };
export type ProfileDefaults = Partial<
  Record<
    | "employee_number"
    | "full_name"
    | "phone"
    | "birthday"
    | "home_address"
    | "department"
    | "position_title"
    | "building"
    | "status"
    | "start_date"
    | "out_date",
    string
  >
>;

const STATUS: Choice[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
];

/** A developer's profile fields in two columns (New developer and the developer's page). */
export function ProfileFields({
  defaults = {},
  buildings,
  departments,
  state,
}: {
  defaults?: ProfileDefaults;
  buildings: Choice[];
  departments: string[];
  state: FormState;
}) {
  const locale = useLocale();
  const errors = (name: string) =>
    state?.fields?.[name]?.map((error) => (
      <p key={error} className="text-destructive text-xs">
        {error}
      </p>
    ));
  const field = (name: keyof ProfileDefaults, label: string, props: React.ComponentProps<typeof Input> = {}, wide = false) => (
    <div className={`grid gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={name}>
        {t(locale, label)}
        {props.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input id={name} name={name} defaultValue={defaults[name] ?? ""} {...props} />
      {errors(name)}
    </div>
  );
  const date = (name: keyof ProfileDefaults, label: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{t(locale, label)}</Label>
      <DatePicker id={name} name={name} defaultValue={defaults[name] ?? ""} locale={locale} />
      {errors(name)}
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("employee_number", "Employee number", { required: true })}
      {field("full_name", "Full name", { required: true })}
      {field("phone", "Phone")}
      {date("birthday", "Birthday")}
      {field("home_address", "Home address", {}, true)}
      <div className="grid gap-1.5">
        <Label htmlFor="department">{t(locale, "Department")}</Label>
        <CreatableSelect id="department" name="department" values={departments} defaultValue={defaults.department ?? ""} locale={locale} placeholder="Choose or add a department" />
        {errors("department")}
      </div>
      {field("position_title", "Title")}
      <div className="grid gap-1.5">
        <Label htmlFor="building">{t(locale, "Home building")}</Label>
        <SearchSelect id="building" name="building" locale={locale} options={buildings} defaultValue={defaults.building ?? ""} />
        {errors("building")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="status">{t(locale, "Status")}</Label>
        <SearchSelect
          id="status"
          name="status"
          locale={locale}
          defaultValue={defaults.status ?? "ACTIVE"}
          options={STATUS.map((o) => ({ ...o, label: t(locale, o.label) }))}
        />
        {errors("status")}
      </div>
      {date("start_date", "Start date")}
      {date("out_date", "Last working day")}
    </div>
  );
}
