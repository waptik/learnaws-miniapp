"use client";

import { useEffect, useRef } from "react";
import { useQuickAuth } from "@/hooks/use-quick-auth";
import { useMiniApp } from "@/contexts/miniapp-context";
import { usePlatform } from "@/hooks/use-platform";
import { useAccount, useConnect } from "wagmi";

/**
 * AutoAuth component that automatically:
 * 1. Signs in with Quick Auth when in a miniapp
 * 2. Connects wallet when in platform (MiniApp or MiniPay)
 * This component should be placed in the app layout or a page component
 */
export function AutoAuth() {
  const { isInMiniApp } = useMiniApp();
  const { isInPlatform } = usePlatform();
  const { isAuthenticated, isLoading, signIn, error } = useQuickAuth();
  const { isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const hasAttemptedWalletConnect = useRef(false);

  // Auto-sign-in with Quick Auth for MiniApp
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

  // Auto-connect wallet when in platform (MiniApp or MiniPay)
  useEffect(() => {
    // Only attempt auto-connect when:
    // 1. We're in a platform (MiniApp or MiniPay)
    // 2. Not already connected
    // 3. Haven't attempted connection yet
    // 4. Connectors are available
    if (
      isInPlatform &&
      !isConnected &&
      !hasAttemptedWalletConnect.current &&
      connectors.length > 0
    ) {
      hasAttemptedWalletConnect.current = true;

      // For MiniApp, use Farcaster connector
      if (isInMiniApp) {
        const farcasterConnector = connectors.find(
          (connector) =>
            connector.id === "farcaster" || connector.id === "frameWallet"
        );
        if (farcasterConnector) {
          console.log("Auto-connecting to Farcaster wallet...");
          connect({ connector: farcasterConnector });
        }
      } else {
        // For MiniPay, use injected connector (MiniPay injects window.ethereum)
        const injectedConnector = connectors.find(
          (connector) => connector.id === "injected"
        );
        if (injectedConnector) {
          console.log("Auto-connecting to MiniPay wallet...");
          connect({ connector: injectedConnector });
        }
      }
    }
  }, [isInPlatform, isInMiniApp, isConnected, connectors, connect]);

  // Handle connection errors
  useEffect(() => {
    if (connectError && hasAttemptedWalletConnect.current) {
      console.error("Auto-connect wallet failed:", connectError);
      // Reset flag to allow retry on next mount/effect
      hasAttemptedWalletConnect.current = false;
    }
  }, [connectError]);

  // This component doesn't render anything
  return null;
}
