"use client";

import { useEffect } from "react";
import { useQuickAuth } from "@/hooks/use-quick-auth";
import { useMiniApp } from "@/contexts/miniapp-context";

/**
 * AutoAuth component that automatically signs in with Quick Auth when in a miniapp
 * This component should be placed in the app layout or a page component
 */
export function AutoAuth() {
  const { isInMiniApp } = useMiniApp();
  const { isAuthenticated, isLoading, signIn, error } = useQuickAuth();

  useEffect(() => {
    // Only attempt auto-sign-in when:
    // 1. We're in a miniapp
    // 2. Not already authenticated
    // 3. Not currently loading
    // 4. No error occurred
    if (isInMiniApp && !isAuthenticated && !isLoading && !error) {
      console.log("Auto-signing in with Quick Auth...");
      signIn().catch((err) => {
        console.error("Auto-sign-in failed:", err);
      });
    }
  }, [isInMiniApp, isAuthenticated, isLoading, error, signIn]);

  // This component doesn't render anything
  return null;
}


