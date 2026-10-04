import Link from "@/components/app-link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { components } from "@/api/schema";
import { UserRowActions } from "@/app/(console)/users/user-row-actions";
import { UserSearch } from "@/app/(console)/users/user-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parsePageSize, TablePager, type PageSize } from "@/components/table-pager";
import { can, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { listPath, loadAll, one, show, showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { redirect } from "next/navigation";

type User = components["schemas"]["User"];
type UserPage = components["schemas"]["PaginatedUserList"];

const SORTS = ["full_name", "username", "last_login"] as const;

function usersHref(query: { is_active?: string; search?: string; ordering?: string; page?: number; pageSize?: PageSize }) {
  const params = new URLSearchParams();
  if (query.is_active) params.set("is_active", query.is_active);
  if (query.search) params.set("search", query.search);
  if (query.ordering) params.set("ordering", query.ordering);
  if (query.pageSize && query.pageSize !== 20) params.set("page_size", String(query.pageSize));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/users?${text}` : "/users";
}

function nextSort(field: (typeof SORTS)[number], current: string) {
  if (current === field) return `-${field}`;
  if (current === `-${field}`) return field;
  return field;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ is_active?: string; search?: string; ordering?: string; page?: string; page_size?: string }>;
}) {
  const raw = await searchParams;
  const isActive = one(raw.is_active);
  const search = one(raw.search) ?? "";
  const requested = one(raw.ordering);
  const ordering = requested && SORTS.some((field) => requested === field || requested === `-${field}`) ? requested : "full_name";
  const pageSize = parsePageSize(one(raw.page_size));
  const page = pageSize === "all" ? 1 : Math.max(1, Number(one(raw.page)) || 1);
  const session = await getSession();
  const locale = await getLocale();
  if (!session) redirect("/login");
  const canManage = can(session.user, "user.manage");
  if (!can(session.user, "user.view")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "No access")}</CardTitle>
          <CardDescription>{t(locale, "Your account cannot open users.")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let users: User[] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const path = listPath("/api/v1/users/", {
      ordering,
      is_active: isActive,
      search: search || undefined,
      ...(pageSize === "all" ? {} : { page: String(page), page_size: String(pageSize) }),
    });
    const loaded = pageSize === "all"
      ? await loadAll<User>(session.token, path)
      : await djangoFetch<UserPage>(path, { accessToken: session.token });
    users = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : t(locale, "Could not load users.");
  }

  const pages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(count / pageSize));
  const here = usersHref({ is_active: isActive, search, ordering, page, pageSize });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Users")}</h1>
          <p className="text-muted-foreground text-sm">{count.toLocaleString()} {t(locale, "users")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UserSearch key={search} value={search} isActive={isActive} ordering={ordering === "full_name" ? undefined : ordering} pageSize={pageSize === 20 ? undefined : pageSize} locale={locale} />
          {canManage ? (
            <Button asChild>
              <Link href="/users/new">{t(locale, "New user")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Accounts")}</CardTitle>
          <CardDescription>
            {t(locale, "Edit a name or roles. Deactivate stops sign-in. Delete asks you to confirm before it tries to remove the account.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No users match this list.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label={t(locale, "Name")} field="full_name" ordering={ordering} isActive={isActive} search={search} pageSize={pageSize} />
                  <SortHead label={t(locale, "Username")} field="username" ordering={ordering} isActive={isActive} search={search} pageSize={pageSize} />
                  <TableHead>{t(locale, "Roles")}</TableHead>
                  <TableHead>{t(locale, "Active")}</TableHead>
                  <SortHead label={t(locale, "Last sign-in")} field="last_login" ordering={ordering} isActive={isActive} search={search} pageSize={pageSize} />
                  {canManage ? <TableHead className="text-right">{t(locale, "Actions")}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{show(user.full_name)}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.roles.length > 0 ? user.roles.join(", ") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "outline"}>
                        {user.is_active ? t(locale, "Yes") : t(locale, "No")}
                      </Badge>
                    </TableCell>
                    <TableCell>{showTime(user.last_login)}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <UserRowActions id={user.id} active={user.is_active} nextPath={here} locale={locale} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePager
            page={page}
            pages={pages}
            pageSize={pageSize}
            hrefForPage={(nextPage) => usersHref({ is_active: isActive, search, ordering, page: nextPage, pageSize })}
            hrefForSize={(size) => usersHref({ is_active: isActive, search, ordering, pageSize: size, page: 1 })}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SortHead({
  label,
  field,
  ordering,
  isActive,
  search,
  pageSize,
}: {
  label: string;
  field: (typeof SORTS)[number];
  ordering: string;
  isActive?: string;
  search: string;
  pageSize: PageSize;
}) {
  const active = ordering === field || ordering === `-${field}`;
  const Icon = ordering === `-${field}` ? ArrowDown : ArrowUp;
  return (
    <TableHead>
      <Link
        href={usersHref({ is_active: isActive, search, ordering: nextSort(field, ordering), pageSize })}
        className="inline-flex items-center gap-1"
      >
        {label}
        {active ? <Icon className="size-3.5" /> : null}
      </Link>
    </TableHead>
  );
}
