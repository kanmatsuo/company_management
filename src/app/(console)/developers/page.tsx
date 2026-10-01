import Link from "next/link";
import type { components } from "@/api/schema";
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
import { DjangoError } from "@/lib/django";
import { can, canManage, getSession } from "@/lib/current-user";
import { listPath, loadFlexible, one } from "@/lib/load-all";
import { redirect } from "next/navigation";

type Developer = components["schemas"]["Developer"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ORDERING = [
  { value: "full_name", label: "Name" },
  { value: "birthday", label: "Birthday" },
  { value: "out_date", label: "Last day" },
  { value: "start_date", label: "Start date" },
];

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

async function loadDevelopers(token: string, query: Record<string, string | undefined>) {
  const path = listPath("/api/v1/developers/", {
    ordering: query.ordering || "full_name",
    status: query.status,
    search: query.search,
    birthday_month: query.birthday_month,
    out_after: query.out_after,
    out_before: query.out_before,
  });
  return loadFlexible<Developer>(token, path);
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
  }>;
}) {
  const raw = await searchParams;
  const query = {
    status: one(raw.status),
    search: one(raw.search),
    birthday_month: one(raw.birthday_month),
    out_after: one(raw.out_after),
    out_before: one(raw.out_before),
    ordering: one(raw.ordering),
  };
  const session = await getSession();
  if (!session) redirect("/login");
  const manage = canManage(session.user, ["developer"]);
  if (!can(session.user, "developer.view") && !manage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open developers.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let developers: Developer[] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const loaded = await loadDevelopers(session.token, query);
    developers = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load developers.";
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Developers</h1>
          <p className="text-muted-foreground text-sm">
            {error ? "The list could not be loaded." : `${count.toLocaleString()} people`}
          </p>
        </div>
        {manage ? (
          <Button asChild>
            <Link href="/developers/new">New developer</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All developers</CardTitle>
          <CardDescription>
            Search matches name, employee number, and phone. Address and birthday stay on each person's page. A last working day does not change status or release a card.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2" method="get">
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            <Input name="search" defaultValue={query.search ?? ""} placeholder="Name, number, or phone" className="max-w-xs" />
            <select name="birthday_month" defaultValue={query.birthday_month ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              <option value="">Any birthday month</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={String(index + 1)}>{month}</option>
              ))}
            </select>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Left after
              <Input name="out_after" type="date" defaultValue={query.out_after ?? ""} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Left before
              <Input name="out_before" type="date" defaultValue={query.out_before ?? ""} />
            </label>
            <select name="ordering" defaultValue={query.ordering ?? "full_name"} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              {ORDERING.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button type="submit" variant="outline">Apply</Button>
          </form>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : developers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No developers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last day</TableHead>
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
                        {STATUS_LABEL[developer.status ?? ""] ?? developer.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{developer.start_date || "—"}</TableCell>
                    <TableCell>{developer.out_date || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
