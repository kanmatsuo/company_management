import Link from "@/components/app-link";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export const PAGE_SIZES = [5, 10, 20, 50, "all"] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export function parsePageSize(value: string | undefined): PageSize {
  if (value === "all") return "all";
  const number = Number(value);
  if (number === 5 || number === 10 || number === 20 || number === 50) return number;
  return 20;
}

function pageWindow(page: number, pages: number) {
  const wanted = [1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((item) => item >= 1 && item <= pages);
  const numbers = [...new Set(wanted)].sort((left, right) => left - right);
  const items: Array<number | "gap"> = [];
  let previous = 0;
  for (const number of numbers) {
    if (previous && number - previous > 1) items.push("gap");
    items.push(number);
    previous = number;
  }
  return items;
}

export function TablePager({
  page,
  pages,
  pageSize,
  hrefForPage,
  hrefForSize,
  onPage,
  onSize,
  locale = "en",
}: {
  page: number;
  pages: number;
  pageSize: PageSize;
  hrefForPage?: (page: number) => string;
  hrefForSize?: (size: PageSize) => string;
  onPage?: (page: number) => void;
  onSize?: (size: PageSize) => void;
  locale?: Locale;
}) {
  const current = Math.min(page, pages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">{t(locale, "Per page")}</span>
        {PAGE_SIZES.map((size) =>
          onSize ? (
            <Button key={size} type="button" size="sm" variant={size === pageSize ? "default" : "outline"} onClick={() => onSize(size)}>
              {size === "all" ? t(locale, "All") : size}
            </Button>
          ) : (
            <Button key={size} asChild size="sm" variant={size === pageSize ? "default" : "outline"}>
              <Link href={hrefForSize ? hrefForSize(size) : "#"}>{size === "all" ? t(locale, "All") : size}</Link>
            </Button>
          ),
        )}
      </div>
      {pageSize === "all" ? (
        <p className="text-muted-foreground text-sm">{t(locale, "All rows")}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          {current <= 1 ? (
            <Button size="sm" variant="outline" disabled>{t(locale, "Previous")}</Button>
          ) : (
            <Button asChild={!onPage} size="sm" variant="outline" type="button" onClick={onPage ? () => onPage(current - 1) : undefined}>
              {onPage ? t(locale, "Previous") : <Link href={hrefForPage ? hrefForPage(current - 1) : "#"}>{t(locale, "Previous")}</Link>}
            </Button>
          )}
          {pageWindow(current, pages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-muted-foreground text-sm">
                …
              </span>
            ) : (
              <Button
                key={item}
                asChild={!onPage}
                type="button"
                size="sm"
                variant={item === current ? "default" : "outline"}
                aria-current={item === current ? "page" : undefined}
                onClick={onPage ? () => onPage(item) : undefined}
              >
                {onPage ? item : <Link href={hrefForPage ? hrefForPage(item) : "#"}>{item}</Link>}
              </Button>
            ),
          )}
          {current >= pages ? (
            <Button size="sm" variant="outline" disabled>{t(locale, "Next")}</Button>
          ) : (
            <Button asChild={!onPage} size="sm" variant="outline" type="button" onClick={onPage ? () => onPage(current + 1) : undefined}>
              {onPage ? t(locale, "Next") : <Link href={hrefForPage ? hrefForPage(current + 1) : "#"}>{t(locale, "Next")}</Link>}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
