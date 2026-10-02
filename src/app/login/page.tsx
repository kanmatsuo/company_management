import { Command } from "lucide-react";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { LoginForm } from "@/components/login-form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getAccessToken } from "@/lib/session";

export default async function LoginPage() {
  if (await getAccessToken()) redirect("/");
  const locale = await getLocale();

  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">{t(locale, "Hello again")}</h1>
              <p className="text-primary-foreground/80 text-xl">{t(locale, "Login to continue")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">{t(locale, "Login")}</div>
            <p className="mx-auto max-w-xl text-muted-foreground">
              {t(locale, "Use your company email and password.")}
            </p>
          </div>
          <LanguageSwitcher locale={locale} />
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
