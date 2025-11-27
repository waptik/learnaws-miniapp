"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { injected } from "@wagmi/connectors";
import { APP_FULL_NAME } from "@/lib/constants";

// Create connectors array - include Farcaster for MiniApp users and standard wallets for regular users
const connectors = [
  // Farcaster MiniApp connector (for users inside Farcaster)
  farcasterMiniApp(),
  // MetaMask connector (for users outside Farcaster)
  // metaMask({
  //   dappMetadata: {
  //     name: APP_FULL_NAME,
  //     url:
  //       typeof window !== "undefined"
  //         ? window.location.origin
  //         : "http://localhost:3000",
  //   },
  // }),
  // Note: WalletConnect connector requires additional setup
  // For now, using MetaMask and injected connectors for external wallets
  // Users can connect via MetaMask or other browser extension wallets
  // Injected connector (for other browser extensions)
  injected(),
];

const config = createConfig({
  chains: [celo, celoSepolia],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
