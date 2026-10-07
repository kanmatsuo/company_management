import Link from "@/components/app-link";

/** A row of quick filters as pill links; the active one is filled. */
export function FilterChips({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${item.active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50 hover:bg-muted"}`}
        >
          {item.label}
          {item.count !== undefined ? <span className="ml-1 tabular-nums opacity-70">{item.count}</span> : null}
        </Link>
      ))}
    </div>
  );
}
