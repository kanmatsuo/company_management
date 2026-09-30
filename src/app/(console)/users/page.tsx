import Link from "next/link";
import type { components } from "@/api/schema";
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
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type User = components["schemas"]["User"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ is_active?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  const canManage = session ? can(session.user, "user.manage") : false;
  const data = await loadRecords<User>(
    "user.view",
    listPath("/api/v1/users/?ordering=full_name", { is_active: one(query.is_active) }),
  );
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">{data.count.toLocaleString()} users</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/users/new">New user</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Create an account, change the name, or deactivate it. Deactivated users cannot sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.error ? (
            <p className="text-destructive text-sm">{data.error}</p>
          ) : data.results.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  {canManage ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((user) => (
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
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/users/${user.id}`}>Edit</Link>
                        </Button>
                      </TableCell>
                    ) : null}
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
