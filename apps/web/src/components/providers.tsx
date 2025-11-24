"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import FrameWalletProvider from "@/contexts/frame-wallet-context";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="celo-theme">
      <ErudaProvider>
        <FrameWalletProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>{children}</MiniAppProvider>
        </FrameWalletProvider>
      </ErudaProvider>
    </ThemeProvider>
  );
}
