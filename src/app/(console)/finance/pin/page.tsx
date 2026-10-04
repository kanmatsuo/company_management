import { Title, Hint } from "@/components/auto-text";
import { PinDesk } from "@/app/(console)/finance/pin/pin-desk";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getLocale } from "@/lib/locale";
import { requireSession } from "@/lib/page-data";

export default async function PinDeskPage() {
  const session = await requireSession();
  const canChange = can(session.user, "finance.deposit");
  const canReset = can(session.user, "finance.adjust");
  if (!canChange && !canReset) return <NoAccess description="Your account cannot change or reset PINs." />;
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
        <Title>PIN desk</Title>
        <Hint>Change a PIN, or set a new one when it was forgotten. The developer is identified by their card.</Hint>
      </div>
      <PinDesk locale={locale} readers={readers} canChange={canChange} canReset={canReset} />
    </div>
  );
}
