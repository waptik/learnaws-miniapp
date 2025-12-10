"use client";

import { useChainId } from "wagmi";
import { celo, celoSepolia } from "viem/chains";

export type ChainKey = "celo" | "celoSepolia";

/**
 * Hook to get the current connected chain information
 * Uses the actual connected chain ID, not environment-based selectedChain
 * @returns Object with chainId, chainKey, and chain object
 */
export function useChain() {
  const chainId = useChainId();

  // Default to Sepolia if chainId is 0 or invalid (wagmi might return 0 initially)
  // Only use Mainnet if we explicitly have the Mainnet chain ID
  const isValidChainId = chainId > 0;
  const chainKey: ChainKey =
    isValidChainId && chainId === celo.id ? "celo" : "celoSepolia";
  const chain = isValidChainId && chainId === celo.id ? celo : celoSepolia;
  const isTestnet = !isValidChainId || chainId === celoSepolia.id;

  return {
    chainId,
    chainKey,
    chain,
    isTestnet,
  };
}

/**
 * Utility function to get chain key from chain ID (for non-React contexts)
 * @param chainId - The chain ID to check
 * @returns "celo" or "celoSepolia"
 */
export function getChainKey(chainId: number): ChainKey {
  return chainId === celo.id ? "celo" : "celoSepolia";
}

/**
 * Utility function to get chain key from wallet (async, for non-React contexts)
 * @returns Promise with chain key
 */
export async function getChainKeyFromWallet(): Promise<ChainKey> {
  if (typeof window === "undefined" || !window.ethereum) {
    // Fallback to Sepolia if window.ethereum is not available
    return "celoSepolia";
  }

  try {
    const chainIdHex = await window.ethereum.request({
      method: "eth_chainId",
      params: [],
    });
    const chainId = parseInt(chainIdHex as string, 16);
    return getChainKey(chainId);
  } catch (error) {
    console.error(
      "[use-chain] Error getting chain ID, defaulting to Sepolia:",
      error
    );
    return "celoSepolia";
  }
}
