"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form";
import { checked, dateTime, idFrom, optionalInt, optionalText, text } from "@/lib/form";
import { commit } from "@/lib/submit";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getSession } from "@/lib/current-user";

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
      building: optionalInt(formData, "building"),
      start_date: optionalText(formData, "start_date"),
      out_date: optionalText(formData, "out_date"),
      status: optionalText(formData, "status"),
      // A card tapped on a card assign reader: assigned with the PIN in the same step.
      ...(optionalInt(formData, "card")
        ? { card: optionalInt(formData, "card"), pin: String(formData.get("pin") ?? ""), pin_confirm: String(formData.get("pin_confirm") ?? "") }
        : {}),
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
      building: text(formData, "building") ? optionalInt(formData, "building") : null,
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
    body: {
      developer: optionalInt(formData, "developer"),
      building: optionalInt(formData, "building"),
      pin: text(formData, "pin"),
      pin_confirm: text(formData, "pin_confirm"),
    },
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
  if (purpose === "TILL" || purpose === "ENROLL") {
    return {
      ...shared,
      // The seller is not set here: till readers are assigned separately (assignReader).
      ...(patch ? { building: null, allowed_ip: null, service_position: null } : {}),
    };
  }
  return {
    ...shared,
    building: optionalInt(formData, "building"),
    allowed_ip: optionalText(formData, "allowed_ip"),
    ...(patch ? { service_position: null } : {}),
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
  const managers = formData.get("managers");
  const owners = formData.get("owners");
  const ids = (field: string) =>
    text(formData, field)
      .split(/[,\s]+/)
      .map((part) => Number(part))
      .filter((userId) => Number.isInteger(userId) && userId > 0);
  return commit({
    path: `/api/v1/rfid/buildings/${id}/`,
    method: "PATCH",
    body: {
      code: optionalText(formData, "code"),
      name: optionalText(formData, "name"),
      ...(managers === null ? {} : { managers: ids("managers") }),
      ...(owners === null ? {} : { owners: ids("owners") }),
    },
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
  const key = text(formData, "idempotency") || randomUUID();
  return commit({
    path: "/api/v1/finance/deposits/",
    headers: { "Idempotency-Key": key },
    body: {
      developer: optionalInt(formData, "developer"),
      amount: text(formData, "amount"),
      description: optionalText(formData, "description"),
      pin: text(formData, "pin"),
    },
    redirectTo: (data) => `/finance/transactions/${idFrom(data) ?? ""}`,
  });
}

export type CardTap = {
  id: number;
  result: string;
  developer: { id?: number; full_name?: string; employee_number?: string; department?: string } | null;
};

export async function recentCardTaps() {
  const session = await getSession();
  if (!session) return { taps: [] as CardTap[], allowed: false };
  try {
    const page = await djangoFetch<{ results?: CardTap[] } | CardTap[]>(
      "/api/v1/rfid/events/?ordering=-event_time&page_size=5",
      { accessToken: session.token },
    );
    return { taps: Array.isArray(page) ? page : page.results ?? [], allowed: true };
  } catch {
    return { taps: [] as CardTap[], allowed: false };
  }
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

export type DeskAccount = { id: number; has_pin: boolean; pin_locked_until: string | null; status: string };

/** The wallet of a developer identified at a desk (PIN desk), or null. */
export async function developerAccount(developerId: number): Promise<DeskAccount | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const page = await djangoFetch<{ results: DeskAccount[] }>(`/api/v1/finance/accounts/?developer=${developerId}`, {
      accessToken: session.token,
    });
    return page.results[0] ?? null;
  } catch {
    return null;
  }
}

/** PIN desk: the developer types the current PIN and the new one twice. */
export async function changePinAtDesk(accountId: number, currentPin: string, pin: string, pinConfirm: string) {
  return pinDeskCall(`/api/v1/finance/accounts/${accountId}/change-pin/`, {
    current_pin: currentPin,
    pin,
    pin_confirm: pinConfirm,
  });
}

/** PIN desk: a forgotten PIN is replaced by a new one the developer types twice. */
export async function resetPinAtDesk(accountId: number, pin: string, pinConfirm: string) {
  return pinDeskCall(`/api/v1/finance/accounts/${accountId}/reset-pin/`, { pin, pin_confirm: pinConfirm });
}

async function pinDeskCall(path: string, body: Record<string, string>): Promise<{ message?: string }> {
  const session = await getSession();
  if (!session) return { message: "Not signed in." };
  try {
    await djangoFetch(path, { method: "POST", accessToken: session.token, body: JSON.stringify(body) });
    return {};
  } catch (error) {
    if (!(error instanceof DjangoError)) return { message: "Could not reach the server." };
    const details = Object.values(error.details ?? {}).flat().filter((x): x is string => typeof x === "string");
    return { message: details[0] ?? error.message };
  }
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
            max_slots_per_day: optionalInt(formData, "max_slots_per_day"),
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
            max_slots_per_day: optionalInt(formData, "max_slots_per_day"),
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

/** Inventory page: a stock change for the good chosen in the form. */
export async function addStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const good = optionalInt(formData, "good");
  if (!good) return { message: "Choose a good.", fields: { good: ["Choose a good."] } };
  const kind = text(formData, "kind");
  const amount = optionalInt(formData, "quantity");
  return commit({
    path: `/api/v1/goods/${good}/stock/`,
    body: {
      kind,
      ...(kind === "ADJUSTMENT" ? { counted_quantity: amount } : { quantity: amount }),
      reason: optionalText(formData, "reason"),
    },
    redirectTo: "/inventory",
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

export type TillReader = { code: string; name: string; online: boolean; last_seen_at: string | null };

export async function developerBalance(developerId: number) {
  const session = await getSession();
  if (!session) return null;
  try {
    const page = await djangoFetch<{ results: { balance: string }[] }>(
      `/api/v1/finance/accounts/?developer=${developerId}`,
      { accessToken: session.token },
    );
    return page.results[0]?.balance ?? null;
  } catch {
    return null;
  }
}

/** The till readers of the counter's seller (readers are assigned to sellers). */
export async function tillReaders(positionId: number): Promise<TillReader[]> {
  const session = await getSession();
  if (!session) return [];
  try {
    return await djangoFetch<TillReader[]>(`/api/v1/purchases/readers/?service_position=${positionId}`, {
      accessToken: session.token,
    });
  } catch {
    return [];
  }
}

/** "Scan card to buy": the next tap on the purchase's reader goes to this purchase. */
export async function waitForCard(id: number): Promise<{ message?: string }> {
  return purchaseStep(`/api/v1/purchases/${id}/wait/`);
}

/** The scan dialog was closed: taps no longer go to this purchase. */
export async function stopWaitingForCard(id: number): Promise<{ message?: string }> {
  return purchaseStep(`/api/v1/purchases/${id}/stop-waiting/`);
}

async function purchaseStep(path: string): Promise<{ message?: string }> {
  const session = await getSession();
  if (!session) return { message: "Not signed in." };
  try {
    await djangoFetch(path, { method: "POST", accessToken: session.token });
    return {};
  } catch (error) {
    return { message: error instanceof DjangoError ? error.message : "Could not reach the server." };
  }
}

export type TestCard = {
  developer: number;
  employee_number: string;
  full_name: string;
  developer_status: string;
  card_uid: string;
  card_status: string;
  balance: string | null;
  account_status: string | null;
  has_pin: boolean;
};

export type SimulatedTap =
  | {
      ok: true;
      result: string;
      accepted: boolean;
      message: string;
      purchase: number | null;
    }
  | { ok: false; error: string };

function tapSimulatorEnabled() {
  return process.env.TAP_SIMULATOR === "true";
}

export async function testCards(search: string): Promise<TestCard[]> {
  if (!tapSimulatorEnabled()) return [];
  const session = await getSession();
  if (!session) return [];
  try {
    return await djangoFetch<TestCard[]>(
      `/api/v1/test-console/cards/?search=${encodeURIComponent(search)}`,
      { accessToken: session.token },
    );
  } catch {
    return [];
  }
}

export async function simulateTap(
  purchaseId: number,
  who: { developer: number } | { uid: string },
): Promise<SimulatedTap> {
  if (!tapSimulatorEnabled()) return { ok: false, error: "The tap simulator is disabled." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };
  try {
    const reply = await djangoFetch<{
      result: string;
      accepted: boolean;
      display_message: string;
      purchase: number | null;
    }>("/api/v1/test-console/simulate-tap/", {
      method: "POST",
      accessToken: session.token,
      body: JSON.stringify({ purchase: purchaseId, ...who }),
    });
    return {
      ok: true,
      result: reply.result,
      accepted: reply.accepted,
      message: reply.display_message,
      purchase: reply.purchase,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof DjangoError ? error.message : "Could not simulate the tap.",
    };
  }
}

export async function createPurchase(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: "/api/v1/purchases/",
    body: {
      service_position: optionalInt(formData, "service_position"),
      reader: optionalText(formData, "reader") || null,
    },
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

export async function setPurchaseReader(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    path: `/api/v1/purchases/${id}/reader/`,
    body: { reader: optionalText(formData, "reader") || null },
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

export async function openCourtBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { message: "Not signed in." };
  const reader = optionalText(formData, "reader");
  const good = optionalInt(formData, "good");
  const date = text(formData, "date");
  const startTime = text(formData, "start_time");
  const endTime = text(formData, "end_time");
  if (!good || !date || !startTime || !endTime) return { message: "Choose a time first." };
  let purchaseId: number | null = null;
  try {
    const purchase = await djangoFetch<{ id: number }>("/api/v1/bookings/checkout/", {
      method: "POST",
      accessToken: session.token,
      body: JSON.stringify({
        good,
        date,
        start_time: startTime,
        end_time: endTime,
        ...(reader ? { reader } : {}),
      }),
    });
    purchaseId = purchase.id;
  } catch (error) {
    return { message: error instanceof DjangoError ? error.message : "Could not open this booking." };
  }
  redirect(`/purchases/${purchaseId}`);
}

export async function changeBooking(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const good = optionalInt(formData, "good");
  return commit({
    path: `/api/v1/bookings/${id}/change/`,
    body: {
      date: text(formData, "date"),
      start_time: text(formData, "start_time"),
      end_time: text(formData, "end_time"),
      ...(good ? { good } : {}),
    },
    redirectTo: `/bookings/${id}`,
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
      user: text(formData, "user") ? optionalInt(formData, "user") : null,
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
      building: optionalInt(formData, "building"),
      manager: optionalInt(formData, "manager"),
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
      building: text(formData, "building") ? optionalInt(formData, "building") : null,
      manager: text(formData, "manager") ? optionalInt(formData, "manager") : null,
      is_active: checked(formData, "is_active"),
    },
    redirectTo: `/positions/${id}`,
  });
}

export async function deletePosition(id: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ path: `/api/v1/service-positions/${id}/`, method: "DELETE", redirectTo: "/positions" });
}

export async function resetData(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.data_reset",
    path: "/api/v1/system/data-reset/",
    body: { confirm: String(formData.get("confirm") ?? "") },
    redirectTo: (data) => {
      const result = (data ?? {}) as { backup?: string | null; deleted?: Record<string, number> };
      const deleted = Object.values(result.deleted ?? {}).reduce((sum, n) => sum + n, 0);
      const params = new URLSearchParams({ done: "1", deleted: String(deleted), backup: result.backup ?? "" });
      return `/data-reset?${params}`;
    },
  });
}

export type ImportResult = {
  rows: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: { row: number; column: string | null; message: string }[];
  dry_run: boolean;
  saved: boolean;
};
export type ImportState = { result?: ImportResult; message?: string } | null;

/** Check (dry run) or import an Excel file; the pressed button decides (`mode`). */
export async function importSpreadsheet(kind: string, _prev: ImportState, formData: FormData): Promise<ImportState> {
  const session = await getSession();
  if (!session) redirect("/login");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose an Excel file (.xlsx)." };
  const body = new FormData();
  body.set("file", file);
  body.set("dry_run", formData.get("mode") === "import" ? "false" : "true");
  try {
    const result = await djangoFetch<ImportResult>(`/api/v1/imports/${kind}/`, {
      method: "POST",
      accessToken: session.token,
      body,
    });
    return { result };
  } catch (error) {
    if (error instanceof DjangoError) return { message: error.message };
    throw error;
  }
}

export async function runBackup(_prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.backup",
    path: "/api/v1/system/backups/run/",
    notice: "The backup has started. This page updates when it has finished.",
  });
}

export async function updateBackupSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.backup",
    path: "/api/v1/system/backups/",
    method: "PATCH",
    body: {
      backup_time: text(formData, "backup_time"),
      keep_daily_days: optionalInt(formData, "keep_daily_days"),
      keep_base_backups: optionalInt(formData, "keep_base_backups"),
      offsite_dir: text(formData, "offsite_dir"),
      offsite_rsync: text(formData, "offsite_rsync"),
    },
    redirectTo: "/backups?saved=1",
  });
}

export async function restoreBackup(file: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.backup",
    path: "/api/v1/system/backups/restore/",
    body: { file, confirm: text(formData, "confirm") },
    redirectTo: "/restoring",
  });
}

export async function deleteKeptDatabase(name: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.backup",
    path: `/api/v1/system/backups/kept/${encodeURIComponent(name)}/`,
    method: "DELETE",
    redirectTo: "/backups",
  });
}

export type DeletePreview = {
  label?: string;
  deletes?: Record<string, number>;
  keeps?: Record<string, number>;
  message?: string;
};

/** What deleting this record for good takes with it (counts), for the dialog. */
export async function previewDelete(kind: string, id: number): Promise<DeletePreview> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    return await djangoFetch<DeletePreview>(`/api/v1/system/records/${kind}/${id}/`, { accessToken: session.token });
  } catch (error) {
    if (error instanceof DjangoError) return { message: error.message };
    throw error;
  }
}

export async function deleteForGood(kind: string, id: number, redirectTo: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "system.delete_records",
    path: `/api/v1/system/records/${kind}/${id}/`,
    body: { confirm: text(formData, "confirm") },
    redirectTo,
  });
}

/** Assign a till reader to a seller, or unassign it (empty seller). */
export async function assignReader(id: number, redirectTo: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return commit({
    permission: "rfid.device.manage",
    path: `/api/v1/rfid/devices/${id}/assign-seller/`,
    body: { seller: optionalInt(formData, "seller") ?? null },
    redirectTo,
  });
}

/** From the seller's page: assign the chosen unassigned till reader to this seller. */
export async function assignReaderToSeller(sellerId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const reader = optionalInt(formData, "reader");
  if (!reader) return { message: "Choose a till reader.", fields: { reader: ["Choose a till reader."] } };
  return commit({
    permission: "rfid.device.manage",
    path: `/api/v1/rfid/devices/${reader}/assign-seller/`,
    body: { seller: sellerId },
    redirectTo: `/sellers/${sellerId}`,
  });
}

/** New store in one step: login, seller, first counter, till reader (POST /sellers/onboard/). */
export async function createStore(_prev: FormState, formData: FormData): Promise<FormState> {
  const login = text(formData, "login") || "new";
  return commit({
    permission: "seller.create",
    path: "/api/v1/sellers/onboard/",
    body: {
      name: text(formData, "name"),
      contact_name: text(formData, "contact_name"),
      phone: text(formData, "phone"),
      notes: text(formData, "notes"),
      login,
      ...(login === "new" ? { username: text(formData, "username"), password: String(formData.get("password") ?? "") } : {}),
      ...(login === "existing" ? { user: optionalInt(formData, "user") ?? null } : {}),
      counter_name: text(formData, "counter_name"),
      building: optionalInt(formData, "building") ?? null,
      location: text(formData, "location"),
      till_reader: optionalInt(formData, "till_reader") ?? null,
    },
    redirectTo: (data) => {
      const seller = data && typeof data === "object" && "seller" in data ? String(data.seller) : "";
      return `/sellers/${seller}`;
    },
  });
}

/** Developer's page: assign the card tapped on the card assign reader, with the PIN. */
export async function assignTappedCard(developerId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const card = optionalInt(formData, "card");
  if (!card) return { message: "Tap a card on the card assign reader first." };
  return commit({
    permission: "rfid.assign",
    path: `/api/v1/rfid/cards/${card}/assign/`,
    body: { developer: developerId, pin: String(formData.get("pin") ?? ""), pin_confirm: String(formData.get("pin_confirm") ?? "") },
    redirectTo: `/developers/${developerId}`,
  });
}

/** Developer's page: take the card back (it stays registered, unassigned). */
export async function unassignDeveloperCard(developerId: number, cardId: number, _prev: FormState, _formData: FormData): Promise<FormState> {
  return commit({ permission: "rfid.assign", path: `/api/v1/rfid/cards/${cardId}/unassign/`, redirectTo: `/developers/${developerId}` });
}

/** Developer's page: replace a lost or broken card with one tapped on the reader (the PIN stays). */
export async function replaceDeveloperCard(developerId: number, cardId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const uid = text(formData, "new_card_uid");
  if (!uid) return { message: "Tap the new card on the card assign reader first." };
  return commit({
    permission: "rfid.assign",
    path: `/api/v1/rfid/cards/${cardId}/replace/`,
    body: { new_card_uid: uid, reason: optionalText(formData, "reason") },
    redirectTo: `/developers/${developerId}`,
  });
}
