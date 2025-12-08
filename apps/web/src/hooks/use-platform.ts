"use client";

import { useMiniPay } from "./use-minipay";
import { useMiniApp } from "@/contexts/miniapp-context";

/**
 * Combined hook to detect if running in MiniApp or MiniPay platform
 * @returns Object with platform detection flags
 */
export function usePlatform() {
  const isMiniPay = useMiniPay();
  const { isInMiniApp } = useMiniApp();

  const isInPlatform = isMiniPay || isInMiniApp;

  return {
    isMiniPay,
    isInMiniApp,
    isInPlatform, // true if either MiniPay or MiniApp
  };
}

/**
 * Helper function to check if running in MiniPay or MiniApp (for use outside React components)
 * @returns boolean indicating if app is running in MiniPay or MiniApp
 */
export function isInPlatform(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check MiniPay
  const isMiniPay = Boolean(window.ethereum?.isMiniPay);

  // Check MiniApp (Farcaster) - this is async, so we can only check synchronously
  // For synchronous checks, we rely on the hook which uses context
  // This helper is mainly for MiniPay detection
  return isMiniPay;
}
