import "../global.css";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SyncActiveOrganization } from "../../_components/SyncActiveOrganization";
import type { Metadata, Viewport } from "next";
import SideNavBar from "../../_components/SideNavBar";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "VHD";
const APP_DEFAULT_TITLE = "VHD";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "VHD CRM";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = auth();
  return (
    <ClerkProvider>
      <SyncActiveOrganization membership={sessionClaims?.membership} />
      <html lang="en">
        <body className={inter.className}>
          <Toaster position="top-center" />
          <div className="flex max-h-[100vh] flex-col lg:!flex-row">
            <SideNavBar />
            <main>{children}</main>
          </div>
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
