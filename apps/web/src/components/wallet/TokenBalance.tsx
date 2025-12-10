"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { AWS_REWARD_TOKEN_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useChain } from "@/hooks/use-chain";

export function TokenBalance() {
  const { address, isConnected } = useAccount();
  const { chainKey } = useChain();

  // Get token address for the actual connected chain (not environment-based)
  const tokenAddress = CONTRACT_ADDRESSES[chainKey]
    .AWSRewardToken as `0x${string}`;

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: tokenAddress,
    abi: AWS_REWARD_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  if (!isConnected || !address) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <span>Error loading balance</span>
      </div>
    );
  }

  const balanceFormatted = balance
    ? parseFloat(formatUnits(balance, 18)).toFixed(2)
    : "0.00";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/70">Balance:</span>
      <span className="font-bold text-foreground">
        {isLoading ? "..." : `${balanceFormatted} AWSP`}
      </span>
    </div>
  );
}
