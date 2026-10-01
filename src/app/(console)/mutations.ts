"use server";

import { randomUUID } from "node:crypto";
import type { FormState } from "@/lib/form";
import { checked, dateTime, idFrom, optionalInt, optionalText, text } from "@/lib/form";
import { commit } from "@/lib/submit";

const idempotent = () => ({ "Idempotency-Key": randomUUID() });

function readerKey(data: unknown) {
  if (data && typeof data === "object" && "api_key" in data && typeof data.api_key === "string") {
    return `Save this reader key now. It is shown only once: ${data.api_key}`;
  }
  return "Saved.";
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/auth/password/",
    body: { old_password: text(formData, "old_password"), new_password: text(formData, "new_password") },
    notice: "Password updated.",
  });
}

export async function createDeveloper(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/developers/",
    body: {
      employee_number: text(formData, "employee_number"),
      full_name: text(formData, "full_name"),
      phone: optionalText(formData, "phone"),
      home_address: optionalText(formData, "home_address"),
      birthday: optionalText(formData, "birthday"),
      department: optionalText(formData, "department"),
      position_title: optionalText(formData, "position_title"),
      manager: optionalInt(formData, "manager"),
      user: optionalInt(formData, "user"),
      start_date: optionalText(formData, "start_date"),
      out_date: optionalText(formData, "out_date"),
      status: optionalText(formData, "status"),
    },
    redirectTo: (data) => {
      const id = idFrom(data);
      return id ? `/developers/${id}` : "/developers";
    },
  });
}

export async function updateDeveloper(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/developers/${id}/`,
    method: "PATCH",
    body: {
      employee_number: optionalText(formData, "employee_number"),
      full_name: optionalText(formData, "full_name"),
      phone: text(formData, "phone"),
      home_address: text(formData, "home_address"),
      birthday: optionalText(formData, "birthday"),
      department: text(formData, "department"),
      position_title: text(formData, "position_title"),
      manager: optionalInt(formData, "manager"),
      user: optionalInt(formData, "user"),
      start_date: optionalText(formData, "start_date"),
      out_date: optionalText(formData, "out_date"),
      status: optionalText(formData, "status"),
    },
    redirectTo: `/developers/${id}`,
  });
}

export async function deleteDeveloper(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/developers/${id}/`, method: "DELETE", redirectTo: "/developers" });
}

export async function createAttendanceRecord(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/attendance/records/",
    body: {
      developer: optionalInt(formData, "developer"),
      event_time: dateTime(formData, "event_time"),
      note: text(formData, "note"),
      direction: optionalText(formData, "direction"),
    },
    redirectTo: (data) => {
      const id = idFrom(data);
      return id ? `/attendance/records/${id}` : "/attendance/records";
    },
  });
}

export async function voidAttendance(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/attendance/records/${id}/void/`,
    body: { reason: text(formData, "reason") },
    redirectTo: `/attendance/records/${id}`,
  });
}

export async function createCard(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/rfid/cards/",
    body: { uid: text(formData, "uid"), label: optionalText(formData, "label"), notes: optionalText(formData, "notes") },
    redirectTo: (data) => `/cards/${idFrom(data) ?? ""}`,
  });
}

export async function updateCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/`,
    method: "PATCH",
    body: { label: text(formData, "label"), notes: text(formData, "notes") },
    redirectTo: `/cards/${id}`,
  });
}

export async function assignCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/assign/`,
    body: { developer: optionalInt(formData, "developer") },
    redirectTo: `/cards/${id}`,
  });
}

export async function unassignCard(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/rfid/cards/${id}/unassign/`, redirectTo: `/cards/${id}` });
}

export async function blockCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/block/`,
    body: { reason: optionalText(formData, "reason") },
    redirectTo: `/cards/${id}`,
  });
}

export async function unblockCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/unblock/`,
    body: { reason: optionalText(formData, "reason") },
    redirectTo: `/cards/${id}`,
  });
}

export async function retireCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/retire/`,
    body: { reason: optionalText(formData, "reason") },
    redirectTo: `/cards/${id}`,
  });
}

export async function replaceCard(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/cards/${id}/replace/`,
    body: {
      new_card_uid: text(formData, "new_card_uid"),
      new_card_label: optionalText(formData, "new_card_label"),
      reason: optionalText(formData, "reason"),
    },
    redirectTo: (data) => `/cards/${idFrom(data) ?? id}`,
  });
}

function devicePayload(formData: FormData, patch: boolean) {
  const purpose = optionalText(formData, "purpose") || "ATTENDANCE";
  const shared = {
    code: patch ? optionalText(formData, "code") : text(formData, "code"),
    name: patch ? text(formData, "name") : optionalText(formData, "name"),
    location: patch ? text(formData, "location") : optionalText(formData, "location"),
    purpose,
    direction: optionalText(formData, "direction"),
    is_active: checked(formData, "is_active"),
  };
  if (purpose === "TILL") {
    return {
      ...shared,
      service_position: optionalInt(formData, "service_position"),
      sn: optionalText(formData, "sn"),
      ...(patch ? { building: null, allowed_ip: null } : {}),
    };
  }
  return {
    ...shared,
    building: optionalInt(formData, "building"),
    allowed_ip: optionalText(formData, "allowed_ip"),
    ...(patch ? { service_position: null, sn: null } : {}),
  };
}

export async function createReader(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/rfid/devices/",
    body: devicePayload(formData, false),
    notice: readerKey,
  });
}

export async function updateReader(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/devices/${id}/`,
    method: "PATCH",
    body: devicePayload(formData, true),
    redirectTo: `/readers/${id}`,
  });
}

export async function rotateReaderKey(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/rfid/devices/${id}/rotate-key/`, notice: readerKey });
}

export async function createBuilding(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/rfid/buildings/",
    body: { code: text(formData, "code"), name: text(formData, "name") },
    redirectTo: "/buildings",
  });
}

export async function updateBuilding(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/rfid/buildings/${id}/`,
    method: "PATCH",
    body: { code: optionalText(formData, "code"), name: optionalText(formData, "name") },
    redirectTo: "/buildings",
  });
}

export async function deleteBuilding(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/rfid/buildings/${id}/`, method: "DELETE", redirectTo: "/buildings" });
}

export async function submitScan(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = text(formData, "device_key");
  if (!key) return { message: "Enter the reader key.", fields: { device_key: ["Enter the reader key."] } };
  return commit({
    path: "/api/v1/rfid/events/",
    authorization: `Device ${key}`,
    body: {
      uid: text(formData, "uid"),
      device_id: optionalText(formData, "device_id"),
      event_time: dateTime(formData, "event_time"),
      client_event_id: optionalText(formData, "client_event_id"),
    },
    notice: (data) => {
      if (data && typeof data === "object" && "result" in data) {
        const result = (data as { result?: string; accepted?: boolean }).result;
        return `Scan recorded: ${result ?? "done"}.`;
      }
      return "Scan recorded.";
    },
  });
}

export async function deposit(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/finance/deposits/",
    headers: idempotent(),
    body: {
      developer: optionalInt(formData, "developer"),
      amount: text(formData, "amount"),
      description: optionalText(formData, "description"),
    },
    redirectTo: (data) => `/finance/transactions/${idFrom(data) ?? ""}`,
  });
}

export async function adjustBalance(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/finance/adjustments/",
    headers: idempotent(),
    body: {
      developer: optionalInt(formData, "developer"),
      amount: text(formData, "amount"),
      reason: text(formData, "reason"),
    },
    redirectTo: (data) => `/finance/transactions/${idFrom(data) ?? ""}`,
  });
}

function accountStatus(id: number, action: string) {
  return async (_prev: FormState, formData: FormData): Promise<FormState> =>
    commit({
      path: `/api/v1/finance/accounts/${id}/${action}/`,
      body: action === "reset-pin" ? undefined : { reason: optionalText(formData, "reason") },
      redirectTo: `/finance/accounts/${id}`,
    });
}

export async function freezeAccount(id: number, prev: FormState, formData: FormData) {
  return accountStatus(id, "freeze")(prev, formData);
}
export async function unfreezeAccount(id: number, prev: FormState, formData: FormData) {
  return accountStatus(id, "unfreeze")(prev, formData);
}
export async function closeAccount(id: number, prev: FormState, formData: FormData) {
  return accountStatus(id, "close")(prev, formData);
}
export async function reopenAccount(id: number, prev: FormState, formData: FormData) {
  return accountStatus(id, "reopen")(prev, formData);
}
export async function resetAccountPin(id: number, prev: FormState, formData: FormData) {
  return accountStatus(id, "reset-pin")(prev, formData);
}

export async function setMyPin(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/finance/accounts/me/pin/",
    body: { pin: text(formData, "pin"), current_pin: optionalText(formData, "current_pin") },
    redirectTo: "/finance/accounts/me",
    notice: "PIN saved.",
  });
}

export async function createGood(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/goods/",
    body: {
      service_position: optionalInt(formData, "service_position"),
      name: text(formData, "name"),
      description: optionalText(formData, "description"),
      sku: optionalText(formData, "sku"),
      price: text(formData, "price"),
      kind: optionalText(formData, "kind") || "PRODUCT",
      is_active: checked(formData, "is_active"),
      track_stock: checked(formData, "track_stock"),
      initial_quantity: optionalInt(formData, "initial_quantity"),
      rental: text(formData, "kind") === "RENTAL"
        ? {
            slot_minutes: optionalInt(formData, "slot_minutes"),
            opening_time: optionalText(formData, "opening_time"),
            closing_time: optionalText(formData, "closing_time"),
            max_slots_per_booking: optionalInt(formData, "max_slots_per_booking"),
            max_days_ahead: optionalInt(formData, "max_days_ahead"),
          }
        : undefined,
    },
    redirectTo: (data) => `/goods/${idFrom(data) ?? ""}`,
  });
}

export async function updateGood(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/goods/${id}/`,
    method: "PATCH",
    body: {
      service_position: optionalInt(formData, "service_position"),
      name: optionalText(formData, "name"),
      description: text(formData, "description"),
      sku: text(formData, "sku"),
      price: optionalText(formData, "price"),
      kind: optionalText(formData, "kind"),
      is_active: checked(formData, "is_active"),
      track_stock: checked(formData, "track_stock"),
      rental: text(formData, "kind") === "RENTAL"
        ? {
            slot_minutes: optionalInt(formData, "slot_minutes"),
            opening_time: optionalText(formData, "opening_time"),
            closing_time: optionalText(formData, "closing_time"),
            max_slots_per_booking: optionalInt(formData, "max_slots_per_booking"),
            max_days_ahead: optionalInt(formData, "max_days_ahead"),
          }
        : undefined,
    },
    redirectTo: `/goods/${id}`,
  });
}

export async function deleteGood(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/goods/${id}/`, method: "DELETE", redirectTo: "/goods" });
}

export async function changeStock(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/goods/${id}/stock/`,
    body: {
      kind: text(formData, "kind"),
      quantity: optionalInt(formData, "quantity"),
      counted_quantity: optionalInt(formData, "counted_quantity"),
      reason: optionalText(formData, "reason"),
    },
    redirectTo: (data) => `/inventory/${idFrom(data) ?? ""}`,
  });
}

export async function uploadImage(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose an image.", fields: { image: ["Choose an image."] } };
  }
  const body = new FormData();
  body.set("image", file);
  const alt = optionalText(formData, "alt_text");
  const position = optionalText(formData, "position");
  if (alt) body.set("alt_text", alt);
  if (position) body.set("position", position);
  return commit({ path: `/api/v1/goods/${id}/images/`, rawBody: body, redirectTo: `/goods/${id}` });
}

export async function deleteImage(goodId: number, imageId: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/goods/${goodId}/images/${imageId}/`,
    method: "DELETE",
    redirectTo: `/goods/${goodId}`,
  });
}

export async function createPurchase(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/purchases/",
    body: { service_position: optionalInt(formData, "service_position") },
    redirectTo: (data) => `/purchases/${idFrom(data) ?? ""}`,
  });
}

export async function addPurchaseItem(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/purchases/${id}/items/`,
    body: { good: optionalInt(formData, "good"), quantity: optionalInt(formData, "quantity") },
    redirectTo: `/purchases/${id}`,
  });
}

export async function updatePurchaseItem(id: number, itemId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/purchases/${id}/items/${itemId}/`,
    method: "PATCH",
    body: { quantity: optionalInt(formData, "quantity") },
    redirectTo: `/purchases/${id}`,
  });
}

export async function deletePurchaseItem(id: number, itemId: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/purchases/${id}/items/${itemId}/`,
    method: "DELETE",
    redirectTo: `/purchases/${id}`,
  });
}

export async function cancelPurchase(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/purchases/${id}/cancel/`, redirectTo: `/purchases/${id}` });
}

export async function confirmPurchase(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/purchases/${id}/confirm/`,
    headers: idempotent(),
    body: { pin: text(formData, "pin") },
    redirectTo: `/purchases/${id}`,
  });
}

export async function createBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/bookings/",
    headers: idempotent(),
    body: {
      good: optionalInt(formData, "good"),
      start: text(formData, "start"),
      slots: optionalInt(formData, "slots") ?? 1,
      pin: text(formData, "pin"),
    },
    redirectTo: "/bookings/me",
  });
}

export async function createSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/sellers/",
    body: {
      name: text(formData, "name"),
      contact_name: optionalText(formData, "contact_name"),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      status: optionalText(formData, "status"),
      notes: optionalText(formData, "notes"),
      user: optionalInt(formData, "user"),
    },
    redirectTo: (data) => `/sellers/${idFrom(data) ?? ""}`,
  });
}

export async function updateSeller(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/sellers/${id}/`,
    method: "PATCH",
    body: {
      name: optionalText(formData, "name"),
      contact_name: text(formData, "contact_name"),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      status: optionalText(formData, "status"),
      notes: text(formData, "notes"),
      user: optionalInt(formData, "user"),
    },
    redirectTo: `/sellers/${id}`,
  });
}

export async function createPosition(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/service-positions/",
    body: {
      seller: optionalInt(formData, "seller"),
      name: text(formData, "name"),
      location: optionalText(formData, "location"),
      is_active: checked(formData, "is_active"),
    },
    redirectTo: (data) => `/positions/${idFrom(data) ?? ""}`,
  });
}

export async function updatePosition(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/service-positions/${id}/`,
    method: "PATCH",
    body: {
      seller: optionalInt(formData, "seller"),
      name: optionalText(formData, "name"),
      location: text(formData, "location"),
      is_active: checked(formData, "is_active"),
    },
    redirectTo: `/positions/${id}`,
  });
}

export async function deletePosition(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/service-positions/${id}/`, method: "DELETE", redirectTo: "/positions" });
}

export async function requestPayout(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/seller-finance/payouts/",
    body: {
      seller: optionalInt(formData, "seller"),
      amount: text(formData, "amount"),
      note: optionalText(formData, "note"),
    },
    redirectTo: (data) => `/seller-finance/payouts/${idFrom(data) ?? ""}`,
  });
}

export async function adjustSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/seller-finance/adjustments/",
    body: {
      seller: optionalInt(formData, "seller"),
      amount: text(formData, "amount"),
      reason: text(formData, "reason"),
    },
    redirectTo: (data) => `/seller-finance/transactions/${idFrom(data) ?? ""}`,
  });
}

function payoutAction(id: number, action: string, withBody: "none" | "pay" | "reject") {
  return async (_prev: FormState, formData: FormData): Promise<FormState> =>
    commit({
      path: `/api/v1/seller-finance/payouts/${id}/${action}/`,
      body:
        withBody === "pay"
          ? { payment_reference: text(formData, "payment_reference") }
          : withBody === "reject"
            ? { reason: text(formData, "reason") }
            : undefined,
      redirectTo: `/seller-finance/payouts/${id}`,
    });
}

export async function approvePayout(id: number, prev: FormState, formData: FormData) {
  return payoutAction(id, "approve", "none")(prev, formData);
}
export async function cancelPayout(id: number, prev: FormState, formData: FormData) {
  return payoutAction(id, "cancel", "none")(prev, formData);
}
export async function processingPayout(id: number, prev: FormState, formData: FormData) {
  return payoutAction(id, "processing", "none")(prev, formData);
}
export async function payPayout(id: number, prev: FormState, formData: FormData) {
  return payoutAction(id, "pay", "pay")(prev, formData);
}
export async function rejectPayout(id: number, prev: FormState, formData: FormData) {
  return payoutAction(id, "reject", "reject")(prev, formData);
}
