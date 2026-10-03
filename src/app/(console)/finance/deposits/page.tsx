import { Title, Hint } from "@/components/auto-text";
import { DepositDesk } from "@/app/(console)/finance/deposit-desk";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { getLocale } from "@/lib/locale";
import { requireSession } from "@/lib/page-data";

export default async function DepositPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["finance"])) return <NoAccess description="Your account cannot post deposits." />;
  const locale = await getLocale();
  let readers: Reader[] = [];
  try {
    readers = (await djangoFetch<{ devices: Reader[] }>("/api/v1/rfid/card-reads/", { accessToken: session.token })).devices;
  } catch (error) {
    if (!(error instanceof DjangoError)) throw error;
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Deposit</Title>
        <Hint>Enter the amount, then the developer taps their card on the card assign reader and types their PIN.</Hint>
      </div>
      <DepositDesk locale={locale} readers={readers} />
    </div>
  );
}
