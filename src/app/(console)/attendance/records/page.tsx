import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { components } from "@/api/schema";
import { parsePageSize, TablePager } from "@/components/table-pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClockTime } from "@/app/(console)/attendance/records/clock-time";
import { can, canManage, canOpen, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { listPath, loadAll, one, show } from "@/lib/load-all";
import { redirect } from "next/navigation";

type Record = components["schemas"]["AttendanceRecord"];
type RecordPage = components["schemas"]["PaginatedAttendanceRecordList"];

const SORTS = ["event_time", "work_date"] as const;

type ScanQuery = {
  search?: string;
  event_type?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  pageSize?: ReturnType<typeof parsePageSize>;
};

function scansHref(query: ScanQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.event_type) params.set("event_type", query.event_type);
  if (query.source) params.set("source", query.source);
  if (query.date_from) params.set("date_from", query.date_from);
  if (query.date_to) params.set("date_to", query.date_to);
  if (query.ordering && query.ordering !== "-event_time") params.set("ordering", query.ordering);
  if (query.pageSize && query.pageSize !== 20) params.set("page_size", String(query.pageSize));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/attendance/records?${text}` : "/attendance/records";
}

function nextSort(field: (typeof SORTS)[number], current: string) {
  if (current === field) return `-${field}`;
  if (current === `-${field}`) return field;
  return `-${field}`;
}

export default async function AttendanceRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    event_type?: string;
    source?: string;
    date_from?: string;
    date_to?: string;
    ordering?: string;
    page?: string;
    page_size?: string;
  }>;
}) {
  const raw = await searchParams;
  const requested = one(raw.ordering);
  const ordering = requested && SORTS.some((field) => requested === field || requested === `-${field}`) ? requested : "-event_time";
  const pageSize = parsePageSize(one(raw.page_size));
  const page = pageSize === "all" ? 1 : Math.max(1, Number(one(raw.page)) || 1);
  const query: ScanQuery = {
    search: one(raw.search),
    event_type: one(raw.event_type),
    source: one(raw.source),
    date_from: one(raw.date_from),
    date_to: one(raw.date_to),
    ordering,
    page,
    pageSize,
  };
  const session = await getSession();
  if (!session) redirect("/login");
  const manage = canManage(session.user, ["attendance"]);
  if (!can(session.user, "attendance.view") && !canOpen(session.user, "attendance.view") && !manage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open the scan log.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let records: Record[] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const path = listPath("/api/v1/attendance/records/", {
      ordering,
      search: query.search,
      event_type: query.event_type,
      source: query.source,
      date_from: query.date_from,
      date_to: query.date_to,
      ...(pageSize === "all" ? {} : { page: String(page), page_size: String(pageSize) }),
    });
    const loaded = pageSize === "all"
      ? await loadAll<Record>(session.token, path)
      : await djangoFetch<RecordPage>(path, { accessToken: session.token });
    records = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load the scan log.";
  }

  const pages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Scan log</h1>
          <p className="text-muted-foreground text-sm">{error ? "The list could not be loaded." : `${count.toLocaleString()} scans`}</p>
        </div>
        {manage ? (
          <Button asChild>
            <Link href="/attendance/records/new">Manual record</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Scans</CardTitle>
          <CardDescription>Search matches a person's name or employee number. Voided rows stay in the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2" method="get">
            <Input name="search" defaultValue={query.search ?? ""} placeholder="Name or employee number" className="max-w-xs" />
            <select name="event_type" defaultValue={query.event_type ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              <option value="">Any type</option>
              <option value="IN">In</option>
              <option value="OUT">Out</option>
              <option value="SCAN">Scan</option>
            </select>
            <select name="source" defaultValue={query.source ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              <option value="">Any source</option>
              <option value="RFID">Door scan</option>
              <option value="MANUAL">Manual</option>
            </select>
            <label className="grid gap-1 text-xs text-muted-foreground">
              From
              <Input name="date_from" type="date" defaultValue={query.date_from ?? ""} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              To
              <Input name="date_to" type="date" defaultValue={query.date_to ?? ""} />
            </label>
            {ordering !== "-event_time" ? <input type="hidden" name="ordering" value={ordering} /> : null}
            {pageSize !== 20 ? <input type="hidden" name="page_size" value={String(pageSize)} /> : null}
            <Button type="submit" variant="outline">Apply</Button>
          </form>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scans match this list.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Time" field="event_time" query={query} />
                  <SortHead label="Date" field="work_date" query={query} />
                  <TableHead>Person</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Void</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className={record.is_void ? "text-muted-foreground line-through" : undefined}>
                    <TableCell className="font-medium">
                      <Link href={`/attendance/records/${record.id}`} className="underline-offset-4 hover:underline">
                        <ClockTime value={record.event_time} />
                      </Link>
                    </TableCell>
                    <TableCell>{record.work_date}</TableCell>
                    <TableCell>{show(record.developer?.full_name)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.event_type}</Badge>
                    </TableCell>
                    <TableCell>{record.source}</TableCell>
                    <TableCell>{show(record.device_code)}</TableCell>
                    <TableCell>{record.is_void ? `Yes${record.void_reason ? `: ${record.void_reason}` : ""}` : "No"}</TableCell>
                    <TableCell>{show(record.note)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePager
            page={page}
            pages={pages}
            pageSize={pageSize}
            hrefForPage={(nextPage) => scansHref({ ...query, page: nextPage })}
            hrefForSize={(size) => scansHref({ ...query, pageSize: size, page: 1 })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SortHead({ label, field, query }: { label: string; field: (typeof SORTS)[number]; query: ScanQuery }) {
  const current = query.ordering ?? "-event_time";
  const active = current === field || current === `-${field}`;
  const Icon = current === `-${field}` ? ArrowDown : ArrowUp;
  return (
    <TableHead>
      <Link href={scansHref({ ...query, ordering: nextSort(field, current), page: 1 })} className="inline-flex items-center gap-1">
        {label}
        {active ? <Icon className="size-3.5" /> : null}
      </Link>
    </TableHead>
  );
}
