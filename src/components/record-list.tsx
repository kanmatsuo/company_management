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
  struck?: boolean[];
}) {
  const locale = await getLocale();
  const titleText = t(locale, title);
  const descriptionText = t(locale, description);
  const emptyText = t(locale, empty);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{titleText}</h1>
          <p className="text-muted-foreground text-sm">{error ? t(locale, "The list could not be loaded.") : summary}</p>
        </div>
        {extra}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{titleText}</CardTitle>
          <CardDescription>{descriptionText}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{emptyText}</p>
          ) : (
            <DataTable headers={headers.map((header) => t(locale, header))} rows={rows} hrefs={hrefs} struck={struck} locale={locale} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
