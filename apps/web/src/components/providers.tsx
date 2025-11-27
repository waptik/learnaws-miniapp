"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import FrameWalletProvider from "@/contexts/frame-wallet-context";
import { ComposerKitProvider } from "@composer-kit/ui/core";
import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="celo-theme">
      <ErudaProvider>
        {/* WagmiProvider must wrap ComposerKitProvider for wallet connections to work */}
        <FrameWalletProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>
            <ComposerKitProvider>
              {children}
              <Toaster />
            </ComposerKitProvider>
          </MiniAppProvider>
        </FrameWalletProvider>
      </ErudaProvider>
    </ThemeProvider>
  );
}
