import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { ResetForm } from "@/app/(console)/data-reset/reset-form";

type Summary = { phrase: string; delete: Record<string, number>; keep: Record<string, number> };

const LABELS: Record<string, string> = {
  developers: "Developers",
  cards: "RFID cards",
  card_assignments: "Card assignments",
  scans: "Scans",
  tcp_log: "TCP log",
  attendance_records: "Attendance records",
  daily_attendance: "Daily attendance",
  presence: "Who is inside",
  accounts: "Developer accounts",
  transactions: "Account transactions",
  purchases: "Purchases",
  purchase_items: "Purchase items",
  bookings: "Bookings",
  stock_movements: "Stock movements",
  seller_transactions: "Seller transactions",
  seller_payouts: "Seller payouts",
  audit_log: "Audit log",
  users: "Users",
  roles: "Roles",
  readers: "Readers",
  buildings: "Buildings",
  sellers: "Sellers",
  counters: "Counters",
  goods: "Goods",
};

function Counts({ rows, locale }: { rows: Record<string, number>; locale: Locale }) {
  return (
    <Table>
      <TableBody>
        {Object.entries(rows).map(([key, count]) => (
          <TableRow key={key}>
            <TableCell>{t(locale, LABELS[key] ?? key)}</TableCell>
            <TableCell className="text-right tabular-nums">{count.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function DataResetPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; backup?: string; deleted?: string }>;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  if (!can(session.user, "system.data_reset")) return <NoAccess description="Only admins can reset the data." />;
  const query = await searchParams;
  let summary: Summary | null = null;
  let error: string | null = null;
  try {
    summary = await djangoFetch<Summary>("/api/v1/system/data-reset/", { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load the data counts.";
  }
  const total = summary ? Object.values(summary.delete).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-semibold text-2xl">{t(locale, "Data reset")}</h1>
        <p className="text-muted-foreground text-sm">
          {t(locale, "Delete all developers, cards and activity, to start again with the same users, readers and stores.")}
        </p>
      </div>
      {query.done ? (
        <Card className="border-green-600/40">
          <CardHeader>
            <CardTitle>{t(locale, "The data was deleted.")}</CardTitle>
            <CardDescription>
              {t(locale, "Rows deleted")}: {Number(query.deleted ?? 0).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p>{t(locale, "Backup made before the reset (restore it to undo):")}</p>
            <p className="break-all font-mono">{query.backup}</p>
          </CardContent>
        </Card>
      ) : null}
      {error ? <p className="text-destructive text-sm">{t(locale, error)}</p> : null}
      {summary ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Deleted")}</CardTitle>
                <CardDescription>{t(locale, "Developers, cards and everything recorded about them.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Counts rows={summary.delete} locale={locale} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Kept")}</CardTitle>
                <CardDescription>
                  {t(locale, "Users and roles, readers, buildings, sellers and goods. Each good keeps its current stock.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Counts rows={summary.keep} locale={locale} />
              </CardContent>
            </Card>
          </div>
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle>{t(locale, "Delete all data")}</CardTitle>
              <CardDescription>
                {t(locale, "A database backup is made first; if it fails, nothing is deleted. The audit log starts again with one entry for this reset.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {total === 0 ? (
                <p className="text-muted-foreground text-sm">{t(locale, "There is no data to delete.")}</p>
              ) : (
                <ResetForm phrase={summary.phrase} />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
