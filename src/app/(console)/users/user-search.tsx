"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function UserSearch({
  value,
  isActive,
  role,
  ordering,
  pageSize,
  locale = "en",
}: {
  value: string;
  isActive?: string;
  role?: string;
  ordering?: string;
  pageSize?: number | "all";
  locale?: Locale;
}) {
  const router = useRouter();
  const [text, setText] = useState(value);

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (isActive) params.set("is_active", isActive);
      if (role) params.set("role", role);
      if (ordering) params.set("ordering", ordering);
      if (pageSize && pageSize !== 20) params.set("page_size", String(pageSize));
      const search = text.trim();
      if (search) params.set("search", search);
      const query = params.toString();
      router.replace(query ? `/users?${query}` : "/users");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [text, value, isActive, role, ordering, pageSize, router]);

  return (
    <Input
      value={text}
      onChange={(event) => setText(event.target.value)}
      placeholder={t(locale, "Search name or username")}
      className="w-56"
      aria-label={t(locale, "Search users")}
    />
  );
}
