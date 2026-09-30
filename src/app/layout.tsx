import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeBootScript } from "@/components/theme-boot";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company management",
  description: "Company management console",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { theme_mode, content_layout, navbar_style, sidebar_variant, sidebar_collapsible } = PREFERENCE_DEFAULTS;
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme-mode={theme_mode}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
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
