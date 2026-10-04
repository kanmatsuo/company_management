import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { LoginForm } from "@/components/login-form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getAccessToken } from "@/lib/session";

export default async function LoginPage() {
  if (await getAccessToken()) redirect("/");
  const locale = await getLocale();

  // Login stays night mode even when the rest of the app is set to light.
  return (
    <div className="dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-foreground">
      <Image
        src="/images/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-105 blur-sm"
      />
      <div className="absolute inset-0 bg-slate-950/55" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(2_6_23_/0.45)_100%)]"
        aria-hidden
      />

      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <LanguageSwitcher locale={locale} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-white/15 bg-background/85 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 space-y-3 text-center">
            <BrandMark className="mx-auto size-14 text-foreground" />
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              {t(locale, "Hello again")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(locale, "Use your username and password.")}
            </p>
          </div>
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
