import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Seller = components["schemas"]["Seller"];

export default async function MySellerPage() {
  const loaded = await loadOne<Seller>("/api/v1/sellers/me/");
  if (!loaded.value) return <LoadError title="My seller" message={loaded.error ?? "No seller profile is linked to this account."} />;
  const seller = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{seller.name}</h1>
        <p className="text-muted-foreground text-sm">Your own seller profile.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{show(seller.status)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Contact", value: show(seller.contact_name) },
              { label: "Email", value: show(seller.email) },
              { label: "Phone", value: show(seller.phone) },
              { label: "Notes", value: show(seller.notes) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
