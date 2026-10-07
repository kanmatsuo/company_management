import Link from "@/components/app-link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { components } from "@/api/schema";
import { UserRowActions } from "@/app/(console)/users/user-row-actions";
import { UserSearch } from "@/app/(console)/users/user-search";
import { Badge } from "@/components/ui/badge";
import { FilterChips } from "@/components/filter-chips";
import { FilterSelect } from "@/components/filter-select";
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

type UsersQuery = { is_active?: string; role?: string; search?: string; ordering?: string; page?: number; pageSize?: PageSize };

function usersHref(query: UsersQuery) {
  const params = new URLSearchParams();
  if (query.is_active) params.set("is_active", query.is_active);
  if (query.role) params.set("role", query.role);
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
  searchParams: Promise<{ is_active?: string; role?: string; search?: string; ordering?: string; page?: string; page_size?: string }>;
}) {
  const raw = await searchParams;
  const isActive = one(raw.is_active) === "true" || one(raw.is_active) === "false" ? one(raw.is_active) : undefined;
  const role = one(raw.role) && /^[A-Z][A-Z0-9_]*$/.test(one(raw.role) ?? "") ? one(raw.role) : undefined;
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
      role,
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

  const roles = can(session.user, "role.view")
    ? await djangoFetch<{ code: string; name: string }[]>("/api/v1/roles/", { accessToken: session.token }).catch(() => [])
    : [];
  const roleName = new Map(roles.map((item) => [item.code, item.name]));
  const pages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(count / pageSize));
  const base = { is_active: isActive, role, search, ordering, pageSize };
  const here = usersHref({ ...base, page });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Users")}</h1>
          <p className="text-muted-foreground text-sm">{count.toLocaleString()} {t(locale, "users")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            {t(locale, "Open a user to change their name, password or roles. Deactivate stops sign-in.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips
              items={[
                { label: t(locale, "All"), href: usersHref({ ...base, is_active: undefined }), active: !isActive },
                { label: t(locale, "Active"), href: usersHref({ ...base, is_active: "true" }), active: isActive === "true" },
                { label: t(locale, "Inactive"), href: usersHref({ ...base, is_active: "false" }), active: isActive === "false" },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <UserSearch key={search} value={search} isActive={isActive} role={role} ordering={ordering === "full_name" ? undefined : ordering} pageSize={pageSize === 20 ? undefined : pageSize} locale={locale} />
              {roles.length ? (
                <FilterSelect
                  name="role"
                  query={{ is_active: isActive, role, search: search || undefined, ordering: ordering === "full_name" ? undefined : ordering, page_size: pageSize === 20 ? undefined : String(pageSize) }}
                  locale={locale}
                  options={[{ value: "", label: t(locale, "Any role") }, ...roles.map((item) => ({ value: item.code, label: t(locale, item.name) }))]}
                />
              ) : null}
            </div>
          </div>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, isActive || role || search ? "No users match these filters." : "No users yet.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label={t(locale, "Name")} field="full_name" ordering={ordering} query={base} />
                  <SortHead label={t(locale, "Username")} field="username" ordering={ordering} query={base} />
                  <TableHead>{t(locale, "Roles")}</TableHead>
                  <TableHead>{t(locale, "Status")}</TableHead>
                  <SortHead label={t(locale, "Last sign-in")} field="last_login" ordering={ordering} query={base} />
                  {canManage ? <TableHead className="text-right">{t(locale, "Actions")}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link href={`/users/${user.id}`} className="underline-offset-4 hover:underline">
                        {show(user.full_name)}
                      </Link>
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.roles.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {user.roles.map((code) => (
                            <Badge key={code} variant="outline">{t(locale, roleName.get(code) ?? code)}</Badge>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "outline"}>
                        {user.is_active ? t(locale, "Active") : t(locale, "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{showTime(user.last_login)}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <UserRowActions id={user.id} active={user.is_active} nextPath={here} locale={locale} canDelete={can(session.user, "system.delete_records") && user.id !== session.user.id} />
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
            hrefForPage={(nextPage) => usersHref({ ...base, page: nextPage })}
            hrefForSize={(size) => usersHref({ ...base, pageSize: size, page: 1 })}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SortHead({ label, field, ordering, query }: { label: string; field: (typeof SORTS)[number]; ordering: string; query: UsersQuery }) {
  const active = ordering === field || ordering === `-${field}`;
  const Icon = ordering === `-${field}` ? ArrowDown : ArrowUp;
  return (
    <TableHead>
      <Link href={usersHref({ ...query, ordering: nextSort(field, ordering), page: 1 })} className="inline-flex items-center gap-1">
        {label}
        {active ? <Icon className="size-3.5" /> : null}
      </Link>
    </TableHead>
  );
}
