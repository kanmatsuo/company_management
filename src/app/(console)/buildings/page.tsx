import Link from "next/link";
import type { components } from "@/api/schema";
import { NoAccess } from "@/components/no-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, canManage, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { redirect } from "next/navigation";

type Building = components["schemas"]["Building"];

export default async function BuildingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, "rfid.view") && !canManage(session.user, ["rfid"])) {
    return <NoAccess description="Your account cannot open buildings." />;
  }
  const manage = can(session.user, "rfid.device.manage") || canManage(session.user, ["rfid"]);
  let buildings: Building[] = [];
  let error: string | null = null;
  try {
    buildings = await djangoFetch<Building[]>("/api/v1/rfid/buildings/", { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load buildings.";
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Buildings</h1>
          <p className="text-muted-foreground text-sm">{buildings.length} buildings</p>
        </div>
        {manage ? <Button asChild><Link href="/buildings/new">New building</Link></Button> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>A building that still has doors cannot be deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-destructive text-sm">{error}</p> : buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No buildings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  {manage ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">{building.code}</TableCell>
                    <TableCell>{building.name}</TableCell>
                    {manage ? (
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/buildings/${building.id}`}>Edit</Link>
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
