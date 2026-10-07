import { redirect } from "next/navigation";
import { AssignByReader } from "@/app/(console)/cards/assign/assign-by-reader";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { NoAccess } from "@/components/no-access";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { buildingChoices, developerChoices } from "@/lib/choices";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function AssignCardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = await getLocale();
  if (!can(session.user, "card.assign")) return <NoAccess description="Your account cannot assign cards." />;
  let readers: Reader[] = [];
  let error: string | null = null;
  try {
    readers = (await djangoFetch<{ devices: Reader[] }>("/api/v1/rfid/card-reads/", { accessToken: session.token })).devices;
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load card assign readers.";
  }
  const [developers, buildings] = await Promise.all([developerChoices(session.token), buildingChoices(session.token)]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Assign card")}</h1>
        <p className="text-muted-foreground text-sm">
          {t(locale, "Tap the card on a card assign reader, then choose the developer and their building.")}
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <AssignByReader readers={readers} developers={developers} buildings={buildings} />
    </div>
  );
}
