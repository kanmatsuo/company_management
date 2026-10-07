import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { Waiting } from "@/app/restoring/waiting";

/** Shown while a restore runs: the backend is stopped, so this page needs nothing from it. */
export default async function RestoringPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="grid max-w-md gap-3 rounded-xl border p-6 text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-4 border-muted border-t-primary" aria-hidden />
        <h1 className="font-semibold text-xl">{t(locale, "Restoring the backup…")}</h1>
        <p className="text-sm">
          {t(
            locale,
            "The current data is backed up first, then the backup is checked and put back. The system is offline meanwhile (usually one to a few minutes): doors and tills don't answer.",
          )}
        </p>
        <Waiting label={t(locale, "Waiting")} />
      </div>
    </div>
  );
}
