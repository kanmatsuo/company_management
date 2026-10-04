import Link from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { LiveRefresh } from "@/app/(console)/tcp-log/live-refresh";

type Entry = {
  id: number;
  received_at: string;
  peer_ip: string | null;
  request: string;
  response: string;
  device_code: string;
  device: number | null;
  device_name: string | null;
  device_purpose: string | null;
  event: number | null;
  outcome: "OK" | "REJECTED" | "INVALID" | "REFUSED" | "ERROR";
  note: string;
  duration_ms: number;
};
type Page = { count: number; results: Entry[] };
type Query = { outcome?: string; ip?: string; device?: string; text?: string; page?: string };

const PAGE_SIZE = 50;
const OUTCOMES: Record<Entry["outcome"], string> = {
  OK: "Handled",
  REJECTED: "Unknown device or address",
  INVALID: "Invalid packet",
  REFUSED: "Connection refused",
  ERROR: "Server error",
};

/** Make control characters visible: CARD_OK\r\n stays readable as sent. */
function visible(text: string) {
  return text.replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}

function href(query: Query, page?: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, page: page && page > 1 ? String(page) : undefined })) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `/tcp-log?${text}` : "/tcp-log";
}

function time(value: string) {
  const date = new Date(value);
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 23)}`;
}

export default async function TCPLogPage({ searchParams }: { searchParams: Promise<Query> }) {
  const session = await requireSession();
  const locale = await getLocale();
  if (!can(session.user, "system.tcp_log")) return <NoAccess description="Only admins can read the TCP log." />;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const api = new URLSearchParams({ ordering: "-received_at", page: String(page), page_size: String(PAGE_SIZE) });
  if (query.outcome) api.set("outcome", query.outcome);
  if (query.ip) api.set("peer_ip", query.ip);
  if (query.device) api.set("device_code", query.device);
  if (query.text) api.set("text", query.text);
  let data: Page = { count: 0, results: [] };
  let error: string | null = null;
  try {
    data = await djangoFetch<Page>(`/api/v1/rfid/tcp-log/?${api}`, { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load the TCP log.";
  }
  const pages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const filters = { outcome: query.outcome, ip: query.ip, device: query.device, text: query.text };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "TCP log")}</h1>
          <p className="text-muted-foreground text-sm">
            {t(locale, "Every packet the devices sent to port 9100 (request) and what the server answered (response). Kept 30 days.")}
          </p>
        </div>
        <LiveRefresh />
      </div>
      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="grid gap-1 text-sm">
          {t(locale, "Outcome")}
          <select name="outcome" defaultValue={query.outcome ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2">
            <option value="">{t(locale, "All")}</option>
            {Object.entries(OUTCOMES).map(([value, label]) => (
              <option key={value} value={value}>{t(locale, label)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t(locale, "From IP")}
          <Input name="ip" defaultValue={query.ip ?? ""} placeholder="192.168.100.151" className="w-40" />
        </label>
        <label className="grid gap-1 text-sm">
          {t(locale, "Device ID")}
          <Input name="device" defaultValue={query.device ?? ""} placeholder="Door1" className="w-28" />
        </label>
        <label className="grid gap-1 text-sm">
          {t(locale, "Text in request or response")}
          <Input name="text" defaultValue={query.text ?? ""} placeholder="DC62B3E3, CARD_DENIED" className="w-52" />
        </label>
        <Button type="submit" size="sm" variant="outline">{t(locale, "Apply")}</Button>
        <Button asChild size="sm" variant="ghost"><Link href="/tcp-log">{t(locale, "Clear")}</Link></Button>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>{data.count.toLocaleString("en-US")} {t(locale, "packets")}</CardTitle>
          <CardDescription>{t(locale, "Newest first. Times are UTC.")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {!error && data.results.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "No packets yet.")}</p> : null}
          {data.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "Time")}</TableHead>
                  <TableHead>{t(locale, "From IP")}</TableHead>
                  <TableHead>{t(locale, "Device")}</TableHead>
                  <TableHead>{t(locale, "Request")}</TableHead>
                  <TableHead>{t(locale, "Response")}</TableHead>
                  <TableHead>{t(locale, "Outcome")}</TableHead>
                  <TableHead className="text-right">ms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((entry) => (
                  <TableRow key={entry.id} className="align-top">
                    <TableCell className="whitespace-nowrap font-mono text-xs">{time(entry.received_at)}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.peer_ip ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {entry.device ? (
                        <Link href={`/readers/${entry.device}`} className="underline-offset-4 hover:underline">
                          {entry.device_code}{entry.device_name ? ` · ${entry.device_name}` : ""}
                        </Link>
                      ) : (
                        entry.device_code || "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-sm break-all font-mono text-xs">{entry.request ? `$${visible(entry.request)}$` : "—"}</TableCell>
                    <TableCell className="max-w-sm break-all font-mono text-xs">{visible(entry.response) || "—"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={entry.outcome === "OK" ? "secondary" : "destructive"}>{t(locale, OUTCOMES[entry.outcome] ?? entry.outcome)}</Badge>
                      {entry.note ? <p className="mt-1 max-w-xs break-words text-muted-foreground">{entry.note}</p> : null}
                      {entry.event ? (
                        <Link href={`/scans/${entry.event}`} className="mt-1 block underline-offset-4 hover:underline">{t(locale, "Scan")} #{entry.event}</Link>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{entry.duration_ms}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          {pages > 1 ? (
            <div className="mt-4 flex items-center gap-2 text-sm">
              {page > 1 ? <Button asChild size="sm" variant="outline"><Link href={href(filters, page - 1)}>{t(locale, "Newer")}</Link></Button> : null}
              <span className="text-muted-foreground">{page} / {pages}</span>
              {page < pages ? <Button asChild size="sm" variant="outline"><Link href={href(filters, page + 1)}>{t(locale, "Older")}</Link></Button> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
