"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletConnectButton } from "@/components/connect-button";
import { APP_NAME } from "@/lib/constants";
import { useMiniApp } from "@/contexts/miniapp-context";

export function Navbar() {
  const { isInMiniApp } = useMiniApp();

  // Show theme toggle in navbar for non-miniapp (regardless of screen size)
  // (for miniapp, it's in the dropdown menu)
  const showThemeToggle = !isInMiniApp;

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
          {showThemeToggle && <ThemeToggle />}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
