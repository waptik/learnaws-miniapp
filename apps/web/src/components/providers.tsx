"use client";

import { AutoAuth } from "@/components/auto-auth";
import { ChainSwitchPrompt } from "@/components/chain-switch-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import FrameWalletProvider from "@/contexts/frame-wallet-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { QuickAuthProvider } from "@/contexts/quick-auth-context";
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
        <FrameWalletProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>
            <QuickAuthProvider>
              <AutoAuth />
              {/* ComposerKitProvider automatically uses the chain from WagmiProvider context */}
              <ChainSwitchPrompt />
              {children}
              <Toaster />
            </QuickAuthProvider>
          </MiniAppProvider>
        </FrameWalletProvider>
      </ErudaProvider>
    </ThemeProvider>
  );
}
