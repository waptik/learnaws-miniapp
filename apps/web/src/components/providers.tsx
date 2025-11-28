"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { QuickAuthProvider } from "@/contexts/quick-auth-context";
import FrameWalletProvider from "@/contexts/frame-wallet-context";
import { ComposerKitProvider } from "@composer-kit/ui/core";
import { AutoAuth } from "@/components/auto-auth";
import { ChainSwitchPrompt } from "@/components/chain-switch-prompt";
import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  // ComposerKitProvider uses wagmi under the hood and will automatically
  // use the chain configured in FrameWalletProvider (WagmiProvider)
  // Chain selection: Celo Sepolia (testnet) for non-production, Celo (mainnet) for production
  return (
    <ThemeProvider defaultTheme="light" storageKey="celo-theme">
      <ErudaProvider>
        {/* WagmiProvider must wrap ComposerKitProvider for wallet connections to work */}
        {/* FrameWalletProvider configures wagmi with the appropriate chain based on NEXT_PUBLIC_VERCEL_ENV */}
        <FrameWalletProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>
            <QuickAuthProvider>
              <AutoAuth />
              {/* ComposerKitProvider automatically uses the chain from WagmiProvider context */}
              <ComposerKitProvider>
                <ChainSwitchPrompt />
                {children}
                <Toaster />
              </ComposerKitProvider>
            </QuickAuthProvider>
          </MiniAppProvider>
        </FrameWalletProvider>
      </ErudaProvider>
    </ThemeProvider>
  );
}
