"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletConnectButton } from "@/components/connect-button";
import { APP_NAME } from "@/lib/constants";

export function Navbar() {
  // Show theme toggle in navbar for all platforms (including miniapp and minipay)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Clickable app name */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <span className="font-bold text-xl underline">{APP_NAME}</span>
        </Link>

        {/* Navigation items - visible on all screen sizes */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
