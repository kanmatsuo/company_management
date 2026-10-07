"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";
import { importSpreadsheet, type ImportState } from "@/app/(console)/mutations";

/** Choose a file, then Check (nothing is saved) or Import (all rows or none). */
export function ImportForm({ kind }: { kind: string }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(importSpreadsheet.bind(null, kind), null as ImportState);
  const result = state?.result;
  return (
    <div className="grid gap-3">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <Input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="max-w-xs" />
        <Button type="submit" name="mode" value="check" variant="outline" disabled={pending}>
          {t(locale, "Check")}
        </Button>
        <Button type="submit" name="mode" value="import" disabled={pending}>
          {pending ? t(locale, "Working…") : t(locale, "Import")}
        </Button>
      </form>
      {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
      {result ? (
        <div className="grid gap-2 text-sm">
          <p className={result.errors.length ? "text-destructive" : result.saved ? "text-green-700 dark:text-green-400" : ""}>
            {result.errors.length
              ? `${t(locale, "Nothing was saved. Fix these rows and try again:")} ${result.errors.length}`
              : result.saved
                ? t(locale, "Imported.")
                : t(locale, "Check passed. Nothing is saved yet: press Import.")}
          </p>
          <p className="text-muted-foreground">
            {t(locale, "Rows")}: {result.rows} · {t(locale, "Added")}: {result.created} · {t(locale, "Changed")}: {result.updated} ·{" "}
            {t(locale, "Unchanged")}: {result.unchanged}
          </p>
          {result.errors.length ? (
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t(locale, "Row")}</TableHead>
                    <TableHead className="w-40">{t(locale, "Column")}</TableHead>
                    <TableHead>{t(locale, "Problem")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.map((error, index) => (
                    <TableRow key={`${error.row}-${index}`}>
                      <TableCell className="tabular-nums">{error.row}</TableCell>
                      <TableCell>{error.column ?? "—"}</TableCell>
                      <TableCell>{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
