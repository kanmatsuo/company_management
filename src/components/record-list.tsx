import type { ReactNode } from "react";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export async function RecordList({
  title,
  summary,
  description,
  error,
  empty,
  headers,
  rows,
  hrefs,
  extra,
  intro,
  filters,
  struck,
}: {
  title: string;
  summary: string;
  description: string;
  error: string | null;
  empty: string;
  headers: string[];
  rows: string[][];
  hrefs?: Array<string | null>;
  extra?: ReactNode;
  /** Shown between the page header and the list (e.g. a form that adds rows). */
  intro?: ReactNode;
  /** Filter chips and dropdowns, shown above the table inside its card. */
  filters?: ReactNode;
  struck?: boolean[];
}) {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, title)}</h1>
          <p className="text-muted-foreground text-sm">{error ? t(locale, "The list could not be loaded.") : summary}</p>
        </div>
        {extra}
      </div>
      {intro}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {filters}
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, empty)}</p>
          ) : (
            <DataTable headers={headers} rows={rows} hrefs={hrefs} struck={struck} locale={locale} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
