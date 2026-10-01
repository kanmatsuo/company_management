import type { components } from "@/api/schema";
import { Badge } from "@/components/ui/badge";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Role = components["schemas"]["Role"];

export default async function RoleDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const loaded = await loadOne<Role>(`/api/v1/roles/${encodeURIComponent(code)}/`);
  if (!loaded.value) return <LoadError title="Role" message={loaded.error ?? "Not found."} />;
  const role = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{role.name}</h1>
        <p className="text-muted-foreground text-sm">{role.code}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>{show(role.description)}{role.is_system ? " · System role" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {role.permissions.map((permission) => (
            <Badge key={permission} variant="secondary" className="font-mono">{permission}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
