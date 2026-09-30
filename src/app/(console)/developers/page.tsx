import type { components } from "@/api/schema";
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
import { djangoFetch, DjangoError } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { redirect } from "next/navigation";

type Developer = components["schemas"]["Developer"];
type DeveloperPage = components["schemas"]["PaginatedDeveloperList"];

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

async function loadDevelopers(token: string, status?: string) {
  const pageSize = 200;
    const first = await djangoFetch<DeveloperPage>(
      `/api/v1/developers/?page_size=${pageSize}&ordering=full_name${status ? `&status=${status}` : ""}`,
      { accessToken: token },
    );
  const results = [...first.results];
  let page = 2;
  while (results.length < first.count && page <= 20) {
    const next = await djangoFetch<DeveloperPage>(
      `/api/v1/developers/?page_size=${pageSize}&ordering=full_name&page=${page}${status ? `&status=${status}` : ""}`,
      { accessToken: token },
    );
    if (next.results.length === 0) break;
    results.push(...next.results);
    page += 1;
  }
  return { count: first.count, results };
}

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, "developer.view")) {
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
    const loaded = await loadDevelopers(session.token, query.status);
    developers = loaded.results;
    count = loaded.count;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load developers.";
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Developers</h1>
        <p className="text-muted-foreground text-sm">
          {error ? "The list could not be loaded." : `${count.toLocaleString()} people`}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All developers</CardTitle>
          <CardDescription>Name, department, and status from the company API.</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((developer) => (
                  <TableRow key={developer.id}>
                    <TableCell className="font-medium">{developer.full_name}</TableCell>
                    <TableCell>{developer.employee_number}</TableCell>
                    <TableCell>{developer.email}</TableCell>
                    <TableCell>{developer.department || "—"}</TableCell>
                    <TableCell>{developer.position_title || "—"}</TableCell>
                    <TableCell>{developer.manager_detail?.full_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={developer.status === "ACTIVE" ? "secondary" : "outline"}>
                        {STATUS_LABEL[developer.status ?? ""] ?? developer.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{developer.start_date || "—"}</TableCell>
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
