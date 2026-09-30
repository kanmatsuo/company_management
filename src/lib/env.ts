import "server-only";

/** Django origin used by the Next.js server. Never sent to the browser. */
export function getApiUrl(): string {
  const url = process.env.API_URL?.trim();
  if (!url) {
    throw new Error(
      "API_URL is not set. For local development copy .env.example to .env.local, or rely on .env.development.",
    );
  }
  return url.replace(/\/$/, "");
}
