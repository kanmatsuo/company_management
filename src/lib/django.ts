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

function messageFor(status: number, code: string | null, message: string | undefined) {
  if (status === 429 || code === "THROTTLED") {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (code === "NO_ACTIVE_ACCOUNT") {
    return "Wrong email or password.";
  }
  if (status === 401 || code === "NOT_AUTHENTICATED" || code === "TOKEN_NOT_VALID") {
    return "Your session expired. Sign in again.";
  }
  return message || "The server could not complete this request.";
}

export async function djangoFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const { accessToken: _accessToken, ...request } = init;
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
    const details = asFieldDetails(body?.error?.details);
    let message = messageFor(response.status, code, body?.error?.message);
    if (response.status >= 500 && requestId) {
      message = `${message} Request ID: ${requestId}.`;
    }
    throw new DjangoError(message, response.status, code, requestId, details);
  }

  return (body ?? undefined) as T;
}
