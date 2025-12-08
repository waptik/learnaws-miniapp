// Determine which chain to use

import farcasterMiniApp from "@farcaster/miniapp-wagmi-connector";
import { http } from "viem";
import { celo, celoSepolia } from "viem/chains";
import { injected, createConfig } from "wagmi";

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

export const wagmiConfig = createConfig({
  chains: [celo, celoSepolia],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

// MiniPay detection helper
export const isMiniPay = (): boolean => {
  if (typeof window !== "undefined" && window.ethereum) {
    return Boolean(window.ethereum.isMiniPay);
  }
  return false;
};
