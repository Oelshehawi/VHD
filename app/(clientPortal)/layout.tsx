import "../global.css";
import { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import ClientPortalFooter from "../../_components/client-portal/layout/ClientPortalFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client Portal - VHD Power System Inspection",
  description: "Access your VHD services and reports",
};

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={inter.className}>
          <div className="flex min-h-screen flex-col bg-sky-1">
            {/* Main content */}
            <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
              {children}
            </main>

            {/* Footer */}
            <ClientPortalFooter />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
