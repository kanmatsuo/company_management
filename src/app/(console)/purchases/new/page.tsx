import { detectedReaders } from "@/app/(console)/mutations";
import { OpenTill } from "@/app/(console)/purchases/open-till";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

export default async function NewPurchasePage() {
  const session = await requireSession();
  if (!canManage(session.user, ["purchase", "seller"])) return <NoAccess description="Your account cannot open a till draft." />;
  const [positions, detected] = await Promise.all([positionChoices(session.token), detectedReaders()]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">New purchase</h1>
        <p className="text-muted-foreground text-sm">The till reader is the one plugged into this PC. The page never sends a card number.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Till</CardTitle>
          <CardDescription>The service position owns the goods that can be added. The reader is found from this computer's address.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpenTill positions={positions} initial={detected} />
        </CardContent>
      </Card>
    </div>
  );
}
