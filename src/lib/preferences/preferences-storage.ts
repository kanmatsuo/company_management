"use client";

import { setClientCookie } from "@/lib/preferences/cookie-client";
import {
  getPreferencePersistence,
  type PreferenceKey,
  type PreferenceValueMap,
} from "@/lib/preferences/preferences-config";

export function persistPreference<K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]) {
  if (getPreferencePersistence(key) === "client-cookie") {
    setClientCookie(key, value);
  }
}
