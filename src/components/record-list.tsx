import type { ReactNode } from "react";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RecordList({
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
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{error ? "The list could not be loaded." : summary}</p>
        </div>
        {extra}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{empty}</p>
          ) : (
            <DataTable headers={headers} rows={rows} hrefs={hrefs} struck={struck} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
