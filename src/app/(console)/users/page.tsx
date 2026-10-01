import Link from "next/link";
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
import { can, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { redirect } from "next/navigation";

type User = components["schemas"]["User"];
type UserPage = components["schemas"]["PaginatedUserList"];

const PAGE_SIZE = 20;
const SORTS = ["full_name", "email", "last_login"] as const;

function usersHref(query: { is_active?: string; search?: string; ordering?: string; page?: number }) {
  const params = new URLSearchParams();
  if (query.is_active) params.set("is_active", query.is_active);
  if (query.search) params.set("search", query.search);
  if (query.ordering) params.set("ordering", query.ordering);
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
  searchParams: Promise<{ is_active?: string; search?: string; ordering?: string; page?: string }>;
}) {
  const raw = await searchParams;
  const isActive = one(raw.is_active);
  const search = one(raw.search) ?? "";
  const requested = one(raw.ordering);
  const ordering = requested && SORTS.some((field) => requested === field || requested === `-${field}`) ? requested : "full_name";
  const page = Math.max(1, Number(one(raw.page)) || 1);
  const session = await getSession();
  if (!session) redirect("/login");
  const canManage = can(session.user, "user.manage");
  if (!can(session.user, "user.view")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let users: User[] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const loaded = await djangoFetch<UserPage>(
      listPath("/api/v1/users/", {
        ordering,
        is_active: isActive,
        search: search || undefined,
        page: String(page),
        page_size: String(PAGE_SIZE),
      }),
      { accessToken: session.token },
    );
    users = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load users.";
  }

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const here = usersHref({ is_active: isActive, search, ordering, page });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">{count.toLocaleString()} users</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UserSearch key={search} value={search} isActive={isActive} ordering={ordering === "full_name" ? undefined : ordering} />
          {canManage ? (
            <Button asChild>
              <Link href="/users/new">New user</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Edit a name or roles. Deactivate stops sign-in. Delete asks you to confirm before it tries to remove the account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users match this list.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Name" field="full_name" ordering={ordering} isActive={isActive} search={search} />
                  <SortHead label="Email" field="email" ordering={ordering} isActive={isActive} search={search} />
                  <TableHead>Roles</TableHead>
                  <TableHead>Active</TableHead>
                  <SortHead label="Last sign-in" field="last_login" ordering={ordering} isActive={isActive} search={search} />
                  {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{show(user.full_name)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.roles.length > 0 ? user.roles.join(", ") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "outline"}>
                        {user.is_active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>{showTime(user.last_login)}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <UserRowActions id={user.id} active={user.is_active} nextPath={here} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">Page {Math.min(page, pages)} of {pages}</p>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button size="sm" variant="outline" disabled>Previous</Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href={usersHref({ is_active: isActive, search, ordering, page: page - 1 })}>Previous</Link>
                </Button>
              )}
              {page >= pages ? (
                <Button size="sm" variant="outline" disabled>Next</Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href={usersHref({ is_active: isActive, search, ordering, page: page + 1 })}>Next</Link>
                </Button>
              )}
            </div>
          </div>
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
}: {
  label: string;
  field: (typeof SORTS)[number];
  ordering: string;
  isActive?: string;
  search: string;
}) {
  const active = ordering === field || ordering === `-${field}`;
  const Icon = ordering === `-${field}` ? ArrowDown : ArrowUp;
  return (
    <TableHead>
      <Link
        href={usersHref({ is_active: isActive, search, ordering: nextSort(field, ordering) })}
        className="inline-flex items-center gap-1"
      >
        {label}
        {active ? <Icon className="size-3.5" /> : null}
      </Link>
    </TableHead>
  );
}
