import { Title, Hint } from "@/components/auto-text";
import { DepositDesk } from "@/app/(console)/finance/deposit-desk";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { getApiUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import { requireSession } from "@/lib/page-data";

export default async function DepositPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["finance"])) return <NoAccess description="Your account cannot post deposits." />;
  const locale = await getLocale();
  const socketBase = getApiUrl().replace(/^http/, "ws");
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Deposit</Title>
        <Hint>Enter the amount, then the developer taps their card and PIN.</Hint>
      </div>
      <DepositDesk locale={locale} socketBase={socketBase} simulator={process.env.TAP_SIMULATOR === "true"} />
    </div>
  );
}
