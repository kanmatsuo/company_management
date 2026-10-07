"use client";

import { SearchSelect } from "@/components/search-select";
import { AutoText } from "@/components/auto-text";
import { useState } from "react";
import { createReader, updateReader } from "@/app/(console)/mutations";
import { FieldForm, type Field } from "@/components/field-form";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

const PURPOSE = [
  { value: "ATTENDANCE", label: "Attendance door" },
  { value: "TILL", label: "Till reader" },
  { value: "ENROLL", label: "Card assign reader" },
];

const HELP: Record<string, string> = {
  ATTENDANCE: "Register every unit of a door separately: the same code (the door's ID, e.g. Door1), its own name (e.g. Door1-1) and its own fixed IP. The unit is recognised by its ID and IP.",
  TILL: "Register the till reader here, then assign it to a seller (on the reader's page, the seller's page or New store). Only that seller's purchases use it. It is recognised by its ID alone. Each ID can be used once.",
  ENROLL: "A card assign reader is recognised by its ID alone (e.g. Master1). Tapping a card on it fills the New card and Assign card pages. Each ID can be used once.",
};

export function DeviceForm({
  id,
  buildings,
  defaults,
}: {
  id?: number;
  buildings: { id: number; label: string }[];
  defaults?: {
    code: string;
    name: string;
    location: string;
    purpose: string;
    building: string;
    servicePosition: string;
    allowedIp: string;
    direction: string;
    active: boolean;
  };
}) {
  const [purpose, setPurpose] = useState(defaults?.purpose || "ATTENDANCE");
  const locale = useLocale();
  const door = purpose === "ATTENDANCE";
  const fields: Field[] = [
    { name: "purpose", label: "Purpose", type: "hidden", defaultValue: purpose },
    { name: "code", label: "Code (the ID the hardware sends)", required: true, defaultValue: defaults?.code, placeholder: door ? "Door1" : purpose === "ENROLL" ? "Master1" : "Reader1" },
    { name: "name", label: door ? "Name of this unit" : "Name", defaultValue: defaults?.name, placeholder: door ? "Door1-1" : undefined },
    { name: "location", label: "Location", defaultValue: defaults?.location },
  ];
  if (door) {
    fields.push(
      { name: "building", label: "Building", type: "select", required: true, options: buildings.map((building) => ({ value: String(building.id), label: building.label })), defaultValue: defaults?.building },
      { name: "allowed_ip", label: "Fixed IP of this unit", required: true, defaultValue: defaults?.allowedIp, placeholder: "192.168.100.151" },
      { name: "direction", label: "Direction", type: "select", options: [{ value: "IN", label: "In" }, { value: "OUT", label: "Out" }, { value: "BOTH", label: "Both" }], defaultValue: defaults?.direction || "BOTH" },
    );
  }
  fields.push({ name: "is_active", label: "Active", type: "checkbox", defaultValue: defaults ? (defaults.active ? "on" : "") : "on" });

  return (
    <div className="grid gap-3">
      <label className="grid max-w-md gap-1.5 text-sm">
        <AutoText>Kind</AutoText>
        <SearchSelect
          value={purpose}
          onValueChange={setPurpose}
          locale={locale}
          options={PURPOSE.map((option) => ({ value: option.value, label: t(locale, option.label) }))}
        />
      </label>
      <p className="max-w-md text-muted-foreground text-sm">
        <AutoText>{HELP[purpose] ?? HELP.ATTENDANCE}</AutoText>
      </p>
      <FieldForm key={purpose} action={id ? updateReader.bind(null, id) : createReader} submitLabel={id ? "Save" : "Create device"} fields={fields} />
    </div>
  );
}
