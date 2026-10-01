"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function UserSearch({
  value,
  isActive,
  ordering,
}: {
  value: string;
  isActive?: string;
  ordering?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(value);

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (isActive) params.set("is_active", isActive);
      if (ordering) params.set("ordering", ordering);
      const search = text.trim();
      if (search) params.set("search", search);
      const query = params.toString();
      router.replace(query ? `/users?${query}` : "/users");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [text, value, isActive, ordering, router]);

  return (
    <Input
      value={text}
      onChange={(event) => setText(event.target.value)}
      placeholder="Search name or email"
      className="max-w-xs"
      aria-label="Search users"
    />
  );
}
