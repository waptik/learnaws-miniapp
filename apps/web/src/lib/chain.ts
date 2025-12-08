import { celo, celoSepolia } from "viem/chains";
import { env } from "./env";

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
