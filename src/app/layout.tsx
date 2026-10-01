import { cookies } from "next/headers";
import type { Metadata } from "next";
import { fontVariables } from "@/app/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeBootScript } from "@/components/theme-boot";
import { parsePreference } from "@/lib/preferences/preferences-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company management",
  description: "Company management console",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const preferences = {
    theme_mode: parsePreference("theme_mode", jar.get("theme_mode")?.value),
    content_layout: parsePreference("content_layout", jar.get("content_layout")?.value),
    navbar_style: parsePreference("navbar_style", jar.get("navbar_style")?.value),
    sidebar_variant: parsePreference("sidebar_variant", jar.get("sidebar_variant")?.value),
    sidebar_collapsible: parsePreference("sidebar_collapsible", jar.get("sidebar_collapsible")?.value),
  };
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased${preferences.theme_mode === "dark" ? " dark" : ""}`}
      data-theme-mode={preferences.theme_mode}
      data-content-layout={preferences.content_layout}
      data-navbar-style={preferences.navbar_style}
      data-sidebar-variant={preferences.sidebar_variant}
      data-sidebar-collapsible={preferences.sidebar_collapsible}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
