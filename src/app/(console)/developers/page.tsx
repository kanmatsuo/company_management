import Link from "@/components/app-link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { components } from "@/api/schema";
import { parsePageSize, TablePager, type PageSize } from "@/components/table-pager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, canManage, getSession } from "@/lib/current-user";
import { listPath, loadAll, one } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { redirect } from "next/navigation";

type Developer = components["schemas"]["Developer"];
type DeveloperPage = components["schemas"]["PaginatedDeveloperList"];

const SORTS = ["full_name", "employee_number", "department", "start_date", "out_date", "birthday"] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

type DeveloperQuery = {
  status?: string;
  search?: string;
  birthday_month?: string;
  out_after?: string;
  out_before?: string;
  ordering?: string;
  page?: number;
  pageSize?: PageSize;
};

function developersHref(query: DeveloperQuery) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.birthday_month) params.set("birthday_month", query.birthday_month);
  if (query.out_after) params.set("out_after", query.out_after);
  if (query.out_before) params.set("out_before", query.out_before);
  if (query.ordering && query.ordering !== "full_name") params.set("ordering", query.ordering);
  if (query.pageSize && query.pageSize !== 20) params.set("page_size", String(query.pageSize));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/developers?${text}` : "/developers";
}

function nextSort(field: (typeof SORTS)[number], current: string) {
  if (current === field) return `-${field}`;
  if (current === `-${field}`) return field;
  return field;
}

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    birthday_month?: string;
    out_after?: string;
    out_before?: string;
    ordering?: string;
    page?: string;
    page_size?: string;
  }>;
}) {
  const raw = await searchParams;
  const requested = one(raw.ordering);
  const ordering = requested && SORTS.some((field) => requested === field || requested === `-${field}`) ? requested : "full_name";
  const pageSize = parsePageSize(one(raw.page_size));
  const page = pageSize === "all" ? 1 : Math.max(1, Number(one(raw.page)) || 1);
  const query = {
    status: one(raw.status),
    search: one(raw.search),
    birthday_month: one(raw.birthday_month),
    out_after: one(raw.out_after),
    out_before: one(raw.out_before),
    ordering,
    page,
    pageSize,
  };
  const session = await getSession();
  const locale = await getLocale();
  if (!session) redirect("/login");
  const manage = canManage(session.user, ["developer"]);
  if (!can(session.user, "developer.view") && !manage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "No access")}</CardTitle>
          <CardDescription>{t(locale, "Your account cannot open developers.")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let developers: Developer[] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const path = listPath("/api/v1/developers/", {
      ordering,
      status: query.status,
      search: query.search,
      birthday_month: query.birthday_month,
      out_after: query.out_after,
      out_before: query.out_before,
      ...(pageSize === "all" ? {} : { page: String(page), page_size: String(pageSize) }),
    });
    const loaded = pageSize === "all"
      ? await loadAll<Developer>(session.token, path)
      : await djangoFetch<DeveloperPage>(path, { accessToken: session.token });
    developers = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : t(locale, "Could not load developers.");
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Developers")}</h1>
          <p className="text-muted-foreground text-sm">
            {error ? t(locale, "The list could not be loaded.") : `${count.toLocaleString()} ${t(locale, "people")}`}
          </p>
        </div>
        {manage ? (
          <Button asChild>
            <Link href="/developers/new">{t(locale, "New developer")}</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "All developers")}</CardTitle>
          <CardDescription>
            {t(locale, "Search matches name, employee number, and phone. Address and birthday stay on each person's page. A last working day does not change status or release a card.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2" method="get">
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            <Input name="search" defaultValue={query.search ?? ""} placeholder={t(locale, "Name, number, or phone")} className="max-w-xs" />
            <select name="birthday_month" defaultValue={query.birthday_month ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              <option value="">{t(locale, "Any birthday month")}</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={String(index + 1)}>{t(locale, month)}</option>
              ))}
            </select>
            <label className="grid gap-1 text-xs text-muted-foreground">
              {t(locale, "Left after")}
              <Input name="out_after" type="date" defaultValue={query.out_after ?? ""} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              {t(locale, "Left before")}
              <Input name="out_before" type="date" defaultValue={query.out_before ?? ""} />
            </label>
            {ordering !== "full_name" ? <input type="hidden" name="ordering" value={ordering} /> : null}
            {pageSize !== 20 ? <input type="hidden" name="page_size" value={String(pageSize)} /> : null}
            <Button type="submit" variant="outline">{t(locale, "Apply")}</Button>
          </form>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : developers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No developers yet.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label={t(locale, "Name")} field="full_name" query={query} />
                  <SortHead label={t(locale, "Number")} field="employee_number" query={query} />
                  <TableHead>{t(locale, "Phone")}</TableHead>
                  <SortHead label={t(locale, "Department")} field="department" query={query} />
                  <TableHead>{t(locale, "Title")}</TableHead>
                  <TableHead>{t(locale, "Manager")}</TableHead>
                  <TableHead>{t(locale, "Status")}</TableHead>
                  <SortHead label={t(locale, "Started")} field="start_date" query={query} />
                  <SortHead label={t(locale, "Last day")} field="out_date" query={query} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((developer) => (
                  <TableRow key={developer.id}>
                    <TableCell className="font-medium">
                      <Link href={`/developers/${developer.id}`} className="underline-offset-4 hover:underline">
                        {developer.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{developer.employee_number}</TableCell>
                    <TableCell>{developer.phone || "—"}</TableCell>
                    <TableCell>{developer.department || "—"}</TableCell>
                    <TableCell>{developer.position_title || "—"}</TableCell>
                    <TableCell>{developer.manager_detail?.full_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={developer.status === "ACTIVE" ? "secondary" : "outline"}>
                        {t(locale, STATUS_LABEL[developer.status ?? ""] ?? developer.status ?? "—")}
                      </Badge>
                    </TableCell>
                    <TableCell>{developer.start_date || "—"}</TableCell>
                    <TableCell>{developer.out_date || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePager
            page={page}
            pages={pageSize === "all" ? 1 : Math.max(1, Math.ceil(count / pageSize))}
            pageSize={pageSize}
            hrefForPage={(nextPage) => developersHref({ ...query, page: nextPage })}
            hrefForSize={(size) => developersHref({ ...query, pageSize: size, page: 1 })}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SortHead({ label, field, query }: { label: string; field: (typeof SORTS)[number]; query: DeveloperQuery }) {
  const current = query.ordering ?? "full_name";
  const active = current === field || current === `-${field}`;
  const Icon = current === `-${field}` ? ArrowDown : ArrowUp;
  return (
    <TableHead>
      <Link href={developersHref({ ...query, ordering: nextSort(field, current), page: 1 })} className="inline-flex items-center gap-1">
        {label}
        {active ? <Icon className="size-3.5" /> : null}
      </Link>
    </TableHead>
  );
}
