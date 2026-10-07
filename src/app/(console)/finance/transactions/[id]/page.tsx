import { redirect } from "next/navigation";
import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { AutoText } from "@/components/auto-text";
import { LoadError } from "@/components/no-access";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { codeLabel } from "@/lib/codes";
import { t, tMessage, type Locale } from "@/lib/i18n";

type Row = components["schemas"]["AccountTransaction"] & { actor_username?: string | null };

const KIND: Record<string, string> = {
  DEPOSIT: "Deposit",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Manual adjustment",
};

function money(value: string | number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "purchase:1637" opens that purchase; other references are shown as they are. */
function referenceLink(locale: Locale, reference: string | null | undefined) {
  const match = reference?.match(/^purchase:(\d+)$/);
  if (match) return { href: `/purchases/${match[1]}`, label: `${t(locale, "Purchase")} #${match[1]}` };
  return null;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-muted-foreground text-xs">
        <AutoText>{label}</AutoText>
      </span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  );
}

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/finance/transactions");
  const loaded = await loadOne<Row>(`/api/v1/finance/transactions/${id}/`);
  if (!loaded.value) return <LoadError title="Transaction" message={loaded.error ?? "Not found."} />;
  const row = loaded.value;
  const amount = Number(row.amount);
  const reference = referenceLink(locale, row.reference);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            <AutoText>{KIND[String(row.kind)] ?? String(row.kind)}</AutoText> #{row.id}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <Badge variant="secondary">{codeLabel(locale, String(row.kind))}</Badge>
            <span>{showTime(row.created_at)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">
            <AutoText>Amount</AutoText>
          </span>
          <p className={`font-semibold text-3xl tabular-nums tracking-tight ${amount < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {amount > 0 ? "+" : ""}
            {money(row.amount)}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <AutoText>Details</AutoText>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Developer">
            {row.developer ? (
              <Link href={`/finance/accounts/${row.account}`} className="underline-offset-4 hover:underline">
                {row.developer.employee_number} · {row.developer.full_name}
              </Link>
            ) : (
              "—"
            )}
          </Fact>
          <Fact label="Balance after">
            <span className="tabular-nums">{money(row.balance_after)}</span>
          </Fact>
          <Fact label="Done by">{row.actor_username ?? (row.actor ? `#${row.actor}` : "—")}</Fact>
          <Fact label="Description">{row.description ? tMessage(locale, row.description) : "—"}</Fact>
          <Fact label="Reference">
            {reference ? (
              <Link href={reference.href} className="underline-offset-4 hover:underline">
                {reference.label}
              </Link>
            ) : (
              show(row.reference)
            )}
          </Fact>
        </CardContent>
      </Card>
    </div>
  );
}
