import "../global.css";
import { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ClientPortalFooter from "../../_components/client-portal/layout/ClientPortalFooter";
import { ThemeProvider } from "../../_components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client Portal - VHD Power System Inspection",
  description: "Access your VHD services and reports",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <div className="bg-background flex min-h-screen flex-col">
              {/* Main content */}
              <main className="flex-1 overflow-hidden">
                {children}
              </main>

              {/* Footer */}
              <ClientPortalFooter />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
