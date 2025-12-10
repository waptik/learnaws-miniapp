"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { type Address } from "viem";
import { useMiniPay } from "./use-minipay";
import { sendContractTransaction } from "@/lib/minipay";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useChain } from "./use-chain";
import { useState } from "react";

/**
 * Hook for contract calls that works for all platforms
 * Handles MiniPay-specific requirements (cUSD gas fees) automatically
 * For other wallets, uses wagmi's writeContract
 */
export function useContractCall() {
  const isInMiniPay = useMiniPay();
  const { address } = useAccount();
  const { chainKey } = useChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { writeContract, isPending, error, data: hash } = useWriteContract();

  // Local state for MiniPay transaction hash (needed for useWaitForTransactionReceipt)
  const [minipayHash, setMinipayHash] = useState<`0x${string}` | undefined>();

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: isInMiniPay ? minipayHash : hash || undefined,
  });

  const callContract = async (
    contractAddress: Address,
    abi: readonly any[],
    functionName: string,
    args: readonly unknown[]
  ) => {
    try {
      if (!address) {
        throw new Error("No wallet connected");
      }

      // For MiniPay, use sendContractTransaction (handles cUSD gas fees)
      if (isInMiniPay) {
        if (!walletClient || !publicClient) {
          throw new Error("Wallet client or public client not available");
        }

        // Get cUSD address for fee currency
        const cUSDAddress = CONTRACT_ADDRESSES[chainKey].cUSD as Address;

        const txHash = await sendContractTransaction(
          walletClient,
          publicClient,
          address,
          contractAddress,
          abi,
          functionName,
          args,
          cUSDAddress
        );

        // Set hash for useWaitForTransactionReceipt to track
        setMinipayHash(txHash);
        return txHash;
      } else {
        // For non-MiniPay wallets, use wagmi's writeContract
        writeContract({
          address: contractAddress,
          abi,
          functionName,
          args,
        });
        // Wagmi's useWaitForTransactionReceipt will handle waiting for receipt
        return hash;
      }
    } catch (err) {
      // Extract error message
      let errorMessage = "Failed to call contract";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        const errorObj = err as any;
        if (errorObj.message) {
          errorMessage = String(errorObj.message);
        } else if (errorObj.error?.message) {
          errorMessage = String(errorObj.error.message);
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      throw new Error(errorMessage);
    }
  };

  return {
    callContract,
    isPending,
    isConfirming,
    isSuccess,
    error,
    receiptError,
    transactionHash: isInMiniPay ? minipayHash || null : hash || null,
    isMiniPay: isInMiniPay,
  };
}
