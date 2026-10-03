"use client";

import { AutoText } from "@/components/auto-text";
import { useState } from "react";
import { createReader, updateReader } from "@/app/(console)/mutations";
import { FieldForm, type Field } from "@/components/field-form";

const PURPOSE = [
  { value: "ATTENDANCE", label: "Attendance door" },
  { value: "TILL", label: "Till reader" },
  { value: "ENROLL", label: "Card assign reader" },
];

const HELP: Record<string, string> = {
  ATTENDANCE: "A door needs a building. It can sign in from a fixed IP, or with the API key shown once after you save.",
  TILL: "A till reader is not tied to a counter. It needs the serial number on the device and signs in with that serial number and its code.",
  ENROLL: "A card assign reader sends ID \"Master\", so the serial number alone identifies it. The code is only a name for staff. Tapping a card on it fills the Assign card page.",
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
    sn: string;
    direction: string;
    active: boolean;
  };
}) {
  const [purpose, setPurpose] = useState(defaults?.purpose || "ATTENDANCE");
  const door = purpose === "ATTENDANCE";
  const fields: Field[] = [
    { name: "purpose", label: "Purpose", type: "hidden", defaultValue: purpose },
    { name: "code", label: "Code (the ID the hardware sends)", required: true, defaultValue: defaults?.code, placeholder: door ? "Door1" : purpose === "ENROLL" ? "Desk-1" : "Reader1" },
    { name: "name", label: "Name", defaultValue: defaults?.name },
    { name: "location", label: "Location", defaultValue: defaults?.location },
  ];
  if (door) {
    fields.push(
      { name: "building", label: "Building", type: "select", required: true, options: buildings.map((building) => ({ value: String(building.id), label: building.label })), defaultValue: defaults?.building },
      { name: "allowed_ip", label: "Allowed door IP", defaultValue: defaults?.allowedIp, placeholder: "10.20.0.11" },
      { name: "direction", label: "Direction", type: "select", options: [{ value: "IN", label: "In" }, { value: "OUT", label: "Out" }, { value: "BOTH", label: "Both" }], defaultValue: defaults?.direction || "BOTH" },
    );
  } else {
    fields.push({ name: "sn", label: "Serial number", required: !id, defaultValue: defaults?.sn });
  }
  fields.push({ name: "is_active", label: "Active", type: "checkbox", defaultValue: defaults ? (defaults.active ? "on" : "") : "on" });

  return (
    <div className="grid gap-3">
      <label className="grid max-w-md gap-1.5 text-sm">
        <AutoText>Kind</AutoText>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
        >
          {PURPOSE.map((option) => (
            <option key={option.value} value={option.value}><AutoText>{option.label}</AutoText></option>
          ))}
        </select>
      </label>
      <p className="max-w-md text-muted-foreground text-sm">
        <AutoText>{HELP[purpose] ?? HELP.ATTENDANCE}</AutoText>
      </p>
      <FieldForm key={purpose} action={id ? updateReader.bind(null, id) : createReader} submitLabel={id ? "Save" : "Create device"} fields={fields} />
    </div>
  );
}
