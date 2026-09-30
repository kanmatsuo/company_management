"use client";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function setClientCookie(key: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax${secure}`;
}
