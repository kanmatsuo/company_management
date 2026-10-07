"use client";

import { usePathname, useRouter } from "next/navigation";
import { SearchSelect } from "@/components/search-select";
import type { Locale } from "@/lib/i18n";

/** A list filter dropdown: picking a value changes `?name=` at once (page 1 again).
 * `query`: the page's current filters, kept as they are. */
export function FilterSelect({
  name,
  query,
  options,
  locale,
  className = "w-48",
}: {
  name: string;
  query: Record<string, string | undefined>;
  options: { value: string; label: string }[];
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className={className}>
      <SearchSelect
        value={query[name] ?? ""}
        locale={locale}
        options={options}
        onValueChange={(next) => {
          const params = new URLSearchParams(
            Object.entries({ ...query, [name]: next, page: undefined }).filter((entry): entry is [string, string] => Boolean(entry[1])),
          );
          const text = params.toString();
          router.push(text ? `${pathname}?${text}` : pathname);
        }}
      />
    </div>
  );
}
