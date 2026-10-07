import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { last30Days, todayIso } from "@/lib/period";
import { ImportForm } from "@/app/(console)/excel/import-form";

const EXPORTS = [
  {
    file: "developers",
    permission: "developer.view",
    title: "Developers and cards",
    description: "Every developer with their current card. Same columns as the import: edit the file and import it back.",
    period: false,
  },
  {
    file: "money",
    permission: "finance.view",
    title: "Money",
    description: "Developer balances now, and the transactions and purchases of the period.",
    period: true,
  },
  {
    file: "goods",
    permission: "good.view",
    title: "Goods and stock",
    description: "Goods with price and stock now, and the stock movements of the period.",
    period: true,
  },
];

const IMPORTS = [
  {
    kind: "developers",
    permissions: ["developer.create", "developer.update"],
    title: "Developers",
    description: "New employee numbers are added; existing ones are updated. On an update, an empty cell leaves that field as it is. Building: its code or name.",
  },
  {
    kind: "cards",
    permissions: ["rfid.assign"],
    title: "Cards",
    description: "New card UIDs are registered and labels updated. With an employee number, the card is assigned to that developer.",
  },
  {
    kind: "balances",
    permissions: ["finance.deposit"],
    title: "Opening balances",
    description: "One deposit per row. The same employee, amount and description is deposited only once, so importing a file again adds nothing.",
  },
];

function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <Download />
        {label}
      </a>
    </Button>
  );
}

function PeriodDownload({ file, locale, from, to }: { file: string; locale: Locale; from: string; to: string }) {
  return (
    <form action={`/api/excel/${file}`} method="get" className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <Label htmlFor={`${file}-from`}>{t(locale, "From")}</Label>
        <Input id={`${file}-from`} name="date_from" type="date" defaultValue={from} className="w-40" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${file}-to`}>{t(locale, "To")}</Label>
        <Input id={`${file}-to`} name="date_to" type="date" defaultValue={to} className="w-40" />
      </div>
      <Button type="submit" variant="outline" size="sm">
        <Download />
        {t(locale, "Download .xlsx")}
      </Button>
    </form>
  );
}

export default async function ExcelPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const exports = EXPORTS.filter((item) => can(session.user, item.permission));
  const imports = IMPORTS.filter((item) => item.permissions.some((permission) => can(session.user, permission)));
  if (exports.length === 0 && imports.length === 0) {
    return <NoAccess description="Your account cannot import or export data." />;
  }
  const today = todayIso();
  const period = last30Days(today);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-semibold text-2xl">{t(locale, "Excel import and export")}</h1>
        <p className="text-muted-foreground text-sm">
          {t(locale, "Download data as Excel files, or add many developers, cards or balances at once from a file.")}
        </p>
      </div>

      {exports.length ? (
        <section className="grid gap-3">
          <h2 className="font-semibold text-lg">{t(locale, "Export")}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {exports.map((item) => (
              <Card key={item.file}>
                <CardHeader>
                  <CardTitle>{t(locale, item.title)}</CardTitle>
                  <CardDescription>{t(locale, item.description)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.period ? (
                    <PeriodDownload file={item.file} locale={locale} from={period.start} to={period.end} />
                  ) : (
                    <DownloadButton href={`/api/excel/${item.file}`} label={t(locale, "Download .xlsx")} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {imports.length ? (
        <section className="grid gap-3">
          <h2 className="font-semibold text-lg">{t(locale, "Import")}</h2>
          <p className="text-muted-foreground text-sm">
            {t(locale, "Start from the template. Check first: nothing is saved, and every problem is listed with its row. Import saves all rows, or none if any row has a problem.")}
          </p>
          {imports.map((item) => (
            <Card key={item.kind}>
              <CardHeader>
                <CardTitle>{t(locale, item.title)}</CardTitle>
                <CardDescription>{t(locale, item.description)}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div>
                  <DownloadButton href={`/api/excel/template-${item.kind}`} label={t(locale, "Download template")} />
                </div>
                <ImportForm kind={item.kind} />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
