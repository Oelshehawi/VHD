import "./global.css";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, auth } from "@clerk/nextjs";
import { SyncActiveOrganization } from "../components/SyncActiveOrganization";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VHD",
  description: "",
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
          {children}
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
