import "../global.css";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata, Viewport } from "next";
import SideNavBar from "../../_components/SideNavBar";
import { getPendingTimeOffCount } from "../lib/data";
import { QueryProvider } from "../lib/QueryProvider";
import NotificationBell from "../../_components/Notifications/NotificationBell";

const inter = Inter({ subsets: ["latin"] });



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  const user: any = await currentUser();

  const serializedUser = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // Fetch pending time-off count for badge
  const pendingTimeOffCount = canManage ? await getPendingTimeOffCount() : 0;

  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="en">
          <body className={inter.className}>
            <Toaster position="top-center" />
            <div className="flex min-h-screen flex-col lg:flex-row">
              <SideNavBar
                canManage={canManage as boolean}
                user={serializedUser}
                pendingTimeOffCount={pendingTimeOffCount}
              />
              <main className="relative flex-1 lg:ml-20">
                {/* Notification Bell - Fixed position in top right */}
                <div className="fixed right-4 top-4 z-50 lg:right-6 lg:top-6">
                  <NotificationBell />
                </div>
                {children}
              </main>
            </div>
            <SpeedInsights />
            <Analytics />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
