/**
 * MiniPay Contract Call Utilities
 * Handles contract calls with cUSD gas fees for MiniPay
 * Uses wagmi/viem only - no direct window.ethereum calls
 */

import { type Address, encodeFunctionData, toHex } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getChainKeyFromWallet } from "@/hooks/use-chain";

/**
 * Get cUSD address for the current chain
 * Gets the chain ID from the connected wallet, not from environment variables
 */
async function getCUSDAddress(): Promise<Address> {
  const chainKey = await getChainKeyFromWallet();
  return CONTRACT_ADDRESSES[chainKey].cUSD as Address;
}

/**
 * Encode contract function call data
 */
function encodeContractCall(
  abi: readonly any[],
  functionName: string,
  args: readonly unknown[]
): `0x${string}` {
  // Create a mutable copy of args to satisfy TypeScript
  const mutableArgs = [...args];
  return encodeFunctionData({
    abi,
    functionName,
    args: mutableArgs,
  });
}

/**
 * Send a contract transaction with MiniPay support (cUSD gas fees)
 * Uses wagmi/viem walletClient - no direct window.ethereum calls
 * This function should be called from use-contract-call hook which provides walletClient
 */
export async function sendContractTransaction(
  walletClient: any, // WalletClient from wagmi
  publicClient: any, // PublicClient from wagmi
  address: Address,
  contractAddress: Address,
  abi: readonly any[],
  functionName: string,
  args: readonly unknown[],
  cUSDAddress: Address // cUSD address for fee currency
): Promise<`0x${string}`> {
  // Encode the function call
  const data = encodeContractCall(abi, functionName, args);

  // Estimate gas and get gas price using viem
  let gasEstimate: bigint | undefined;
  let gasPrice: bigint | undefined;

  try {
    // Estimate gas with feeCurrency (cUSD)
    gasEstimate = await publicClient.estimateGas({
      account: address,
      to: contractAddress,
      data: data,
      value: 0n,
      feeCurrency: cUSDAddress,
    });

    // Get gas price in cUSD
    const gasPriceHex = (await publicClient.request({
      method: "eth_gasPrice",
      params: [cUSDAddress] as any, // Type assertion needed for feeCurrency param
    })) as `0x${string}`;
    gasPrice = BigInt(gasPriceHex);
  } catch (gasError) {
    // Gas estimation might fail, but we can still try the transaction
    // MiniPay might handle gas automatically
    console.warn(
      "[minipay] Gas estimation failed, proceeding without gas parameters:",
      gasError
    );
  }

  // Send transaction via walletClient with feeCurrency
  // For Celo with feeCurrency, don't pass gasPrice to avoid viem's internal fee calculations
  // that can cause division by zero errors. Let the chain/wallet handle gas pricing.
  const txParams: any = {
    to: contractAddress,
    data: data,
    value: 0n,
    feeCurrency: cUSDAddress, // Required for MiniPay - pay gas in cUSD
  };

  // Only add gas if it's valid (not 0 or undefined)
  if (gasEstimate && gasEstimate > 0n) {
    txParams.gas = gasEstimate;
  }

  // Don't pass gasPrice for Celo feeCurrency transactions
  // The chain/wallet will handle gas pricing automatically
  // Passing gasPrice can cause viem to do internal calculations that result in division by zero

  const txHash = await walletClient.sendTransaction(txParams);

  return txHash;
}

/**
 * Get cUSD address for contract calls
 * Exported for use in hooks
 */
export async function getCUSDAddressForChain(): Promise<Address> {
  return await getCUSDAddress();
}
