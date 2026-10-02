import "server-only";
import { headers } from "next/headers";
import { getApiUrl } from "@/lib/env";

/**
 * WebSocket base address for the BROWSER, e.g. "wss://192.168.1.10".
 *
 * `API_URL` is where this server reaches Django; on the offline server it is a local-only
 * address (http://127.0.0.1:8001) that browsers can't use. In production the browser
 * connects to the address it loaded the page from: nginx sends /ws/ there to Django.
 * In development the backend runs separately, so `API_URL` is right (staging, or the
 * offline development backend on port 8000). `WS_URL` overrides both.
 */
export async function getSocketBase(): Promise<string> {
  const configured = process.env.WS_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    const incoming = await headers();
    const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
    if (host) {
      const proto = (incoming.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
      return `${proto === "https" ? "wss" : "ws"}://${host}`;
    }
  }
  return getApiUrl().replace(/^http/, "ws");
}
