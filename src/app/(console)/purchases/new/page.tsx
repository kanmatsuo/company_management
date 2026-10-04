import { Title, Hint } from "@/components/auto-text";
import { OpenTill } from "@/app/(console)/purchases/open-till";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoAccess } from "@/components/no-access";
import { canManage, runsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

export default async function NewPurchasePage() {
  const session = await requireSession();
  if (!canManage(session.user, ["purchase", "seller"]) && !(await runsStore())) return <NoAccess description="Your account cannot open a till draft." />;
  const positions = await positionChoices(session.token, { sellingOnly: true });
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New purchase</Title>
        <Hint>Each seller has its own till readers. The page never sends a card number.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Till</CardTitle>
          <CardDescription>The service position owns the goods that can be added. The till reader is one of its seller&apos;s readers.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpenTill positions={positions} />
        </CardContent>
      </Card>
    </div>
  );
}
