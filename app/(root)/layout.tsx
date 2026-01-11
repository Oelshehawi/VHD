import "../global.css";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "../../_components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getPendingTimeOffCount } from "../lib/data";
import { QueryProvider } from "../lib/QueryProvider";
import { ThemeProvider } from "../../_components/theme-provider";
import { AppSidebar } from "../../_components/app-sidebar";
import { SidebarInset, SidebarProvider } from "../../_components/ui/sidebar";
import { TopBar } from "../../_components/layout/TopBar";
import { BreadcrumbNameProvider } from "../../_components/layout/BreadcrumbNameProvider";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  // Fetch pending time-off count for badge
  const pendingTimeOffCount = canManage ? await getPendingTimeOffCount() : 0;

  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-center" />
              <SidebarProvider className="h-svh overflow-hidden">
                <AppSidebar
                  canManage={canManage}
                  pendingTimeOffCount={pendingTimeOffCount}
                />
                <SidebarInset className="min-w-0">
                  <BreadcrumbNameProvider>
                    <TopBar />
                    <div className="min-w-0 flex-1 overflow-auto p-4">
                      <div className="flex h-full min-w-0 flex-col gap-4">
                        {children}
                      </div>
                    </div>
                  </BreadcrumbNameProvider>
                </SidebarInset>
              </SidebarProvider>
              <SpeedInsights />
              <Analytics />
            </ThemeProvider>
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
