"use client";

import { Address, erc20Abi, formatEther, formatUnits } from "viem";
import { stableTokenABI } from "@celo/abis";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useChain } from "./use-chain";

/**
 * Hook to check cUSD balance
 * Essential for MiniPay users who need cUSD for gas fees
 * Uses existing cUSD addresses from constants
 * Uses the actual connected chain ID, not the environment-based selectedChain
 */
export function useCUSDBalance() {
  const { address, isConnected } = useAccount();
  const { chainKey, chainId } = useChain();

  // Get cUSD address for the actual connected chain (not environment-based)
  // Only proceed if we have a valid chain ID (not 0 or undefined)
  const token = CONTRACT_ADDRESSES[chainKey]?.cUSD as Address | undefined;

  // Debug logging to help diagnose chain detection issues
  if (typeof window !== "undefined" && isConnected && address) {
    console.log("[useCUSDBalance] Chain detection:", {
      chainId,
      chainKey,
      token,
      address,
    });
  }

  const {
    data: balanceResult,
    isLoading,
    error,
  } = useReadContracts({
    allowFailure: false,
    contracts: token
      ? [
          {
            address: token,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as Address],
          },
          {
            address: token,
            abi: erc20Abi,
            functionName: "decimals",
          },
          {
            address: token,
            abi: erc20Abi,
            functionName: "symbol",
          },
        ]
      : [],
    query: {
      enabled: !!address && isConnected && !!token && chainId > 0,
    },
  });

  const [balanceWei, decimals, symbol] = balanceResult || [];
  const balance = balanceWei ? formatEther(balanceWei) : "0";

  const userLocale =
    typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

  // Decimal formatter based on user's locale
  const decimalFormatter = new Intl.NumberFormat(userLocale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Convert string balance to number for formatting
  // Use parseFloat to safely convert string to number
  const balanceNumber = balance ? parseFloat(balance) : 0;
  const formattedBalance = decimalFormatter.format(balanceNumber); // 0.05 or 0,05

  const strBalance = `${formattedBalance} ${symbol ?? ""}`;

  return {
    balance,
    balanceWei,
    isLoading,
    error,
    hasBalance: balance !== "0" && parseFloat(balance) > 0,
    cusdAddress: token || (CONTRACT_ADDRESSES.celoSepolia.cUSD as Address), // Return address for use in feeCurrency, fallback to Sepolia
    formattedBalance,
    symbol,
    decimals,
    strBalance,
  };
}
