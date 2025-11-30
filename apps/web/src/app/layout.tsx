import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { Navbar } from "@/components/navbar";
import Providers from "@/components/providers";
import { APP_FULL_NAME, APP_NAME } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "400", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
const frame = {
  version: "1",
  imageUrl: `${appUrl}/opengraph-image.png`,
  button: {
    title: APP_FULL_NAME,
    action: {
      type: "launch_frame",
      name: APP_NAME,
      url: appUrl,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#ffffff",
    },
  },
};

export const metadata: Metadata = {
  title: APP_FULL_NAME,
  description: "A miniapp to prepare yourself for aws certifications",
  openGraph: {
    title: APP_FULL_NAME,
    description: "A miniapp to prepare yourself for aws certifications",
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className={`${inter.variable} font-body`}>
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
          </Providers>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
