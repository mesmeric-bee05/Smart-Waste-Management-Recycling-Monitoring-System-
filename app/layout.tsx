import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WasteOps | Collection & Diversion Operations", template: "%s · WasteOps" },
  description:
    "A clear operational workspace for collection activity, recycling records, and trustworthy sustainability reporting.",
  applicationName: "WasteOps",
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased" data-csp-nonce={nonce}>
        {children}
      </body>
    </html>
  );
}
