"use client";

import { cn } from "cn";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/current-user";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { LayoutControls } from "@/components/dashboard/layout-controls";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { LocaleContext } from "@/components/locale-context";
import { t, type Locale } from "@/lib/i18n";

export function DashboardShell({
  user,
  defaultOpen,
  locale,
  isSeller = false,
  isOwner = false,
  children,
}: {
  user: CurrentUser;
  defaultOpen: boolean;
  locale: Locale;
  isSeller?: boolean;
  isOwner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
    <LocaleContext.Provider value={locale}>
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={{ "--sidebar-width": "calc(var(--spacing) * 68)" } as React.CSSProperties}
    >
      <Suspense fallback={null}>
        <AppSidebar user={user} locale={locale} isSeller={isSeller} isOwner={isOwner} variant="sidebar" collapsible="icon" />
      </Suspense>
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "min-w-0 overflow-x-clip",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <p className="font-medium text-sm">{t(locale, "Company management")}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher locale={locale} />
              <LayoutControls />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    </LocaleContext.Provider>
    </PreferencesStoreProvider>
  );
}
