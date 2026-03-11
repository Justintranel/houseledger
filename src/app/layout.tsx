import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
        {/* Rewardful affiliate tracking — sets referral cookie on link clicks */}
        <Script id="rewardful-init" strategy="beforeInteractive">{`
          (function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');
        `}</Script>
        <Script
          src="https://r.wdfl.co/rw.js"
          data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_ID}
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
