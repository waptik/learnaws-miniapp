"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { injected } from "@wagmi/connectors";
import { env } from "@/lib/env";

// Determine which chain to use
// Priority: 1) NEXT_PUBLIC_CHAIN (explicit override), 2) NEXT_PUBLIC_VERCEL_ENV (production = celo, others = sepolia)
const getSelectedChain = () => {
  // Check for explicit chain override first
  const chainEnv = env.NEXT_PUBLIC_CHAIN;
  if (chainEnv) {
    return chainEnv === "celo" ? celo : celoSepolia;
  }

  // Fallback to VERCEL_ENV if NEXT_PUBLIC_CHAIN is not set
  const vercelEnv = env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === "production") {
    return celo; // Production uses mainnet
  }

  // Default to sepolia for development, preview, etc.
  return celoSepolia;
};

export const selectedChain = getSelectedChain();

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
