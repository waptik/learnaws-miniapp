"use client";

import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address, encodeFunctionData, erc20Abi, parseEther } from "viem";
import { useMiniPay } from "./use-minipay";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useChain } from "./use-chain";

/**
 * Hook for sending payments/transactions
 * Works on all platforms (MiniPay and regular wallets)
 * Handles MiniPay-specific requirements (cUSD fee currency) automatically
 * Based on Celo docs: https://docs.celo.org/build-on-celo/build-on-minipay/code-library
 */
export function usePayment() {
  const isInMiniPay = useMiniPay();
  const { address } = useAccount();
  const { chainKey } = useChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const {
    sendTransaction,
    isPending,
    error,
    data: hash,
  } = useSendTransaction();

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const sendPayment = async (
    to: Address,
    value: string // Amount in ether/wei
  ) => {
    // Reset state

    try {
      // Validate input
      if (!value || parseFloat(value) <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (!address) {
        throw new Error("No wallet connected");
      }

      // Validate recipient address
      if (!to || to === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid recipient address");
      }

      if (!publicClient) {
        throw new Error("Public client not available");
      }

      // Convert value to wei
      const valueWei = parseEther(value);
      if (valueWei === 0n) {
        throw new Error("Amount must be greater than 0");
      }

      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      // For MiniPay, use walletClient.sendTransaction with feeCurrency
      // For other wallets, use regular sendTransaction (no feeCurrency)
      if (isInMiniPay) {
        // Get cUSD address for fee currency (required for MiniPay)
        const cUSDAddress = CONTRACT_ADDRESSES[chainKey].cUSD as Address;

        // Estimate gas with feeCurrency (cUSD) using viem
        let gasEstimate: bigint | undefined;
        let gasPrice: bigint | undefined;

        try {
          // Estimate gas with feeCurrency (cUSD)
          gasEstimate = await publicClient.estimateGas({
            account: address,
            to: to,
            value: valueWei,
            data: "0x",
            feeCurrency: cUSDAddress, // Estimate gas in cUSD
          });

          // Get gas price in cUSD using publicClient
          // For Celo, we need to request with feeCurrency parameter
          const gasPriceHex = (await publicClient.request({
            method: "eth_gasPrice",
            params: [cUSDAddress] as any, // Type assertion needed for feeCurrency param
          })) as `0x${string}`;
          gasPrice = BigInt(gasPriceHex);
        } catch (gasError) {
          // Gas estimation might fail, but we can still try the transaction
          // MiniPay might handle gas automatically
          console.warn(
            "[use-payment] Gas estimation failed, proceeding without gas parameters:",
            gasError
          );
        }
        // data

        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [address, valueWei],
        });

        // Send transaction via walletClient with feeCurrency
        // For Celo with feeCurrency, don't pass gasPrice to avoid viem's internal fee calculations
        // that can cause division by zero errors. Let the chain/wallet handle gas pricing.
        const txParams: any = {
          to,
          value: valueWei,
          data: data, // Required by MiniPay - empty data for simple transfer
          feeCurrency: cUSDAddress, // Required for MiniPay - pay gas in cUSD
        };

        // Only add gas if it's valid (not 0 or undefined)
        if (gasEstimate && gasEstimate > 0n) {
          txParams.gas = gasEstimate;
        }

        // Don't pass gasPrice for Celo feeCurrency transactions
        // The chain/wallet will handle gas pricing automatically
        // Passing gasPrice can cause viem to do internal calculations that result in division by zero

        sendTransaction(txParams);
      } else {
        // For non-MiniPay wallets, use Wagmi's sendTransaction
        // No feeCurrency needed - uses native CELO for gas
        sendTransaction({
          to,
          value: valueWei,
        });
        // Wagmi's useWaitForTransactionReceipt will handle waiting for receipt
        // The receipt status is available via wagmiIsConfirming, wagmiIsSuccess, wagmiReceiptError
        return hash;
      }
    } catch (err) {
      // Extract error message from various error formats
      let errorMessage = "Failed to send payment";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        // Handle RPC errors and other object errors
        const errorObj = err as any;

        // Try multiple paths for error message
        if (errorObj.message) {
          errorMessage = String(errorObj.message);
        } else if (errorObj.error) {
          if (typeof errorObj.error === "string") {
            errorMessage = errorObj.error;
          } else if (errorObj.error?.message) {
            errorMessage = String(errorObj.error.message);
          } else if (errorObj.error?.data?.message) {
            errorMessage = String(errorObj.error.data.message);
          }
        } else if (errorObj.data) {
          if (typeof errorObj.data === "string") {
            errorMessage = errorObj.data;
          } else if (errorObj.data?.message) {
            errorMessage = String(errorObj.data.message);
          }
        } else if (errorObj.code) {
          // RPC error code
          errorMessage = `Error ${errorObj.code}: ${
            errorObj.message || "Transaction failed"
          }`;
        } else {
          // Last resort: try to extract any string value
          const stringValues = Object.values(errorObj)
            .filter((v) => typeof v === "string" && v.length > 0)
            .map((v) => String(v));
          if (stringValues.length > 0) {
            errorMessage = stringValues[0];
          } else {
            // Try to stringify for debugging
            try {
              errorMessage = JSON.stringify(errorObj, null, 2);
            } catch {
              errorMessage = "Unknown error occurred";
            }
          }
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      throw error;
    }
  };

  // Use Wagmi state for non-MiniPay, local state for MiniPay

  return {
    sendPayment,
    isPending,
    isConfirming,
    isSuccess,
    error,
    receiptError,
    transactionHash: hash,
    isMiniPay: isInMiniPay,
  };
}
