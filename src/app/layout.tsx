import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "The House Ledger — Professional Home Management", template: "%s | The House Ledger" },
  description: "The complete home management platform for homeowners and their household managers. Tasks, SOPs, vendor management, purchase approvals, and real-time chat — all in one place.",
  metadataBase: new URL("https://www.thehouseledger.com"),
  openGraph: {
    type: "website",
    siteName: "The House Ledger",
    title: "The House Ledger — Professional Home Management",
    description: "The complete home management platform for homeowners and their household managers.",
    url: "https://www.thehouseledger.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "The House Ledger — Professional Home Management",
    description: "The complete home management platform for homeowners and their household managers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
