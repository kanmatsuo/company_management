"use client";

import { useMemo, useState } from "react";
import Link from "@/components/app-link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { TablePager, type PageSize } from "@/components/table-pager";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function compareCells(left: string, right: string) {
  const leftNumber = Number(left.replace(/,/g, ""));
  const rightNumber = Number(right.replace(/,/g, ""));
  if (left !== "—" && right !== "—" && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

/** Status values that get a coloured dot in their badge. */
const DOT: Record<string, string> = {
  Online: "bg-emerald-500 shadow-[0_0_6px] shadow-emerald-500/70",
  Offline: "bg-muted-foreground/50",
  Paid: "bg-emerald-500",
  Draft: "bg-amber-500",
  Cancelled: "bg-muted-foreground/50",
};

export function DataTable({
  headers,
  rows,
  hrefs,
  struck,
  locale = "en",
}: {
  headers: string[];
  rows: string[][];
  hrefs?: Array<string | null>;
  struck?: boolean[];
  locale?: Locale;
}) {
  const [search, setSearch] = useState("");
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matched = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !query || row.some((cell) => cell.toLowerCase().includes(query)));
    if (sortIndex === null) return matched;
    return matched.sort((left, right) => compareCells(left.row[sortIndex] ?? "", right.row[sortIndex] ?? "") * sortDirection);
  }, [rows, query, sortIndex, sortDirection]);

  const pages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = pageSize === "all" ? filtered : filtered.slice((current - 1) * pageSize, current * pageSize);

  function sortBy(index: number) {
    if (sortIndex === index) setSortDirection((direction) => (direction === 1 ? -1 : 1));
    else {
      setSortIndex(index);
      setSortDirection(1);
    }
    setPage(1);
  }

  return (
    <div className="grid gap-4">
      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder={t(locale, "Search this table")}
        className="max-w-xs"
        aria-label={t(locale, "Search this table")}
      />
      {visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t(locale, "Nothing matches this search.")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => {
                const active = sortIndex === index;
                const Icon = sortDirection === -1 ? ArrowDown : ArrowUp;
                return (
                  <TableHead key={`${header}-${index}`}>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => sortBy(index)}>
                      {t(locale, header)}
                      {active ? <Icon className="size-3.5" /> : null}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(({ row, index }) => (
              <TableRow key={index} className={struck?.[index] ? "text-muted-foreground line-through" : undefined}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`${headers[cellIndex]}-${cellIndex}`} className={cellIndex === 0 ? "font-medium" : undefined}>
                    {headers[cellIndex] === "Status" || headers[cellIndex] === "Result" ? (
                      <Badge variant="secondary" className="gap-1.5">
                        {DOT[cell] ? <span aria-hidden className={`size-2 rounded-full ${DOT[cell]}`} /> : null}
                        {t(locale, cell)}
                      </Badge>
                    ) : headers[cellIndex] === "Change" && /^[+-]\d/.test(cell) ? (
                      <span className={`font-medium tabular-nums ${cell.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{cell}</span>
                    ) : cellIndex === 0 && hrefs?.[index] ? (
                      <Link href={hrefs[index]} className="underline-offset-4 hover:underline">
                        {t(locale, cell)}
                      </Link>
                    ) : (
                      t(locale, cell)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TablePager
        page={current}
        pages={pages}
        pageSize={pageSize}
        onPage={setPage}
        onSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        locale={locale}
      />
    </div>
  );
}
