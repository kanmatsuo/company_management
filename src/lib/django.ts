import "server-only";
import { getApiUrl } from "@/lib/env";

export class DjangoError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;
  readonly details: Record<string, string[]> | null;

  constructor(
    message: string,
    status: number,
    code: string | null,
    requestId: string | null,
    details: Record<string, string[]> | null,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

function asFieldDetails(details: unknown): Record<string, string[]> | null {
  if (!details || typeof details !== "object") return null;
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(details)) {
    if (Array.isArray(value)) {
      fields[key] = value.map(String);
    } else if (typeof value === "string") {
      fields[key] = [value];
    }
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

function explainRule(status: number, code: string | null, details: unknown, message: string | undefined) {
  if (code === "DAILY_LIMIT_REACHED" && details && typeof details === "object") {
    const row = details as { max_slots_per_day?: number; already_booked?: number; remaining?: number };
    return `Daily limit is ${row.max_slots_per_day ?? "the allowed"} slots. Already booked ${row.already_booked ?? 0}. ${row.remaining ?? 0} left today.`;
  }
  if (code === "ALREADY_BOOKED_THEN" && details && typeof details === "object") {
    const row = details as { good?: string; start?: string; end?: string };
    return `You already have ${row.good || "another court"} from ${row.start || "that time"} to ${row.end || "later"}. One person cannot hold two courts at the same time.`;
  }
  if (code === "SLOT_UNAVAILABLE") return "That time was just taken. Reload the schedule and choose again.";
  if (code === "INVALID_SLOT") return "That time is not on the court's grid, or it is closed, past, or too far ahead. Reload the schedule.";
  if (code === "RENTAL_NOT_AVAILABLE") return "This court is not available to book.";
  if (code === "BOOKING_STARTED") return "This booking has already started, so it cannot be moved.";
  if (code === "BOOKING_PRICE_DIFFERENT" && details && typeof details === "object") {
    const row = details as { paid?: string; new_price?: string };
    return `The new time must cost the same. Paid ${row.paid ?? "—"}, new price ${row.new_price ?? "—"}.`;
  }
  if (code === "GOOD_NOT_AVAILABLE") return "Courts are booked on the playground desk, not added to a till sale.";
  if (code === "CARD_NOT_PRESENTED") return "Please tap the card. There is no tap yet, or it expired.";
  if (code === "INVALID_PIN" && details && typeof details === "object") {
    const row = details as { attempts_remaining?: number };
    return `Wrong PIN. ${row.attempts_remaining ?? 0} attempts left.`;
  }
  if (code === "PIN_LOCKED" && details && typeof details === "object") {
    const row = details as { locked_until?: string };
    return `PIN locked until ${row.locked_until || "later"}.`;
  }
  if (code === "PIN_NOT_SET") return "This developer has not set a PIN yet.";
  if (code === "INSUFFICIENT_BALANCE" && details && typeof details === "object") {
    const row = details as { balance?: string; required?: string };
    return `Not enough balance. Balance ${row.balance ?? "—"}. This sale needs ${row.required ?? "—"}.`;
  }
  if (status === 429 || code === "THROTTLED") {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (code === "NO_ACTIVE_ACCOUNT") {
    return "Wrong username or password.";
  }
  if (status === 401 || code === "NOT_AUTHENTICATED" || code === "TOKEN_NOT_VALID") {
    return "Your session expired. Sign in again.";
  }
  return message || "The server could not complete this request.";
}

export async function djangoFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string; skipAuthRefresh?: boolean; authorization?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", await requestLocale());
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // The browser's address, for the backend (e.g. the till reader on the seller's PC is found
  // by it). nginx sets X-Forwarded-For on requests to this server, so it can't be faked.
  if (!headers.has("X-Forwarded-For")) {
    const clientIp = await requestClientIp();
    if (clientIp) headers.set("X-Forwarded-For", clientIp);
  }
  if (init.authorization) {
    headers.set("Authorization", init.authorization);
  } else if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const {
    accessToken: _accessToken,
    skipAuthRefresh: _skipAuthRefresh,
    authorization: _authorization,
    ...request
  } = init;
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...request,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new DjangoError("Could not reach the API server.", 502, null, null, null);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const requestId = response.headers.get("x-request-id");
  let body: ErrorBody | null = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as ErrorBody;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const code = body?.error?.code ?? null;
    const canRefresh =
      response.status === 401 &&
      Boolean(init.accessToken) &&
      !init.skipAuthRefresh &&
      code !== "NO_ACTIVE_ACCOUNT";
    if (canRefresh && (await cookiesMutable())) {
      const refreshed = await tryRefreshAccess();
      if (refreshed) {
        return djangoFetch<T>(path, { ...init, accessToken: refreshed, skipAuthRefresh: true });
      }
    }
    const details = asFieldDetails(body?.error?.details);
    let message = explainRule(response.status, code, body?.error?.details, body?.error?.message);
    if (response.status >= 500 && requestId) {
      message = `${message} Request ID: ${requestId}.`;
    }
    throw new DjangoError(message, response.status, code, requestId, details);
  }

  return (body ?? undefined) as T;
}

async function requestClientIp() {
  try {
    const { headers } = await import("next/headers");
    const forwarded = (await headers()).get("x-forwarded-for");
    return forwarded ? forwarded.split(",")[0].trim() || null : null;
  } catch {
    return null;
  }
}

async function requestLocale() {
  try {
    const { cookies } = await import("next/headers");
    return (await cookies()).get("locale")?.value === "ko" ? "ko" : "en";
  } catch {
    return "en";
  }
}

async function cookiesMutable() {
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    jar.set("session_probe", "", { httpOnly: true, path: "/", maxAge: 0 });
    return true;
  } catch {
    return false;
  }
}

async function tryRefreshAccess() {
  try {
    const { refreshStoredSession } = await import("@/lib/refresh-session");
    return await refreshStoredSession();
  } catch {
    return null;
  }
}
