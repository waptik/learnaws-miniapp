/**
 * Smart Contract Interaction Utilities
 * Handles reading contract state and preparing claim data
 */

import { createPublicClient, http, keccak256, toBytes, toHex } from "viem";
import { celo, celoSepolia } from "viem/chains";
import { env } from "@/lib/env";
import { CONTRACT_ADDRESSES as CONTRACT_ADDRESSES_BY_CHAIN } from "@/lib/constants";

// Determine which chain to use
// Priority: 1) NEXT_PUBLIC_CHAIN (explicit override), 2) NEXT_PUBLIC_VERCEL_ENV (production = celo, others = sepolia)
const getSelectedChain = () => {
  // Check for explicit chain override first
  const chainEnv = env.NEXT_PUBLIC_CHAIN;
  if (chainEnv === "celo") {
    return celo;
  }
  if (chainEnv === "sepolia") {
    return celoSepolia;
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

// Get contract addresses for the selected chain
const getContractAddresses = () => {
  const chainKey = selectedChain.id === celo.id ? "celo" : "celoSepolia";
  return CONTRACT_ADDRESSES_BY_CHAIN[chainKey];
};

export const CONTRACT_ADDRESSES = getContractAddresses();

// ABI for AssessmentRewards contract
export const ASSESSMENT_REWARDS_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canClaim",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getTodayClaimCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_DAILY_CLAIMS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PASSING_SCORE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "score", type: "uint256" },
      { name: "assessmentId", type: "bytes32" },
      { name: "courseCode", type: "string" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ABI for AWSRewardToken contract
export const AWS_REWARD_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Create public client for reading contract state
 * Uses Celo Sepolia for non-production, Celo mainnet for production
 */
function getPublicClient() {
  return createPublicClient({
    chain: selectedChain,
    transport: http(),
  });
}

/**
 * Check if user can claim a reward today
 */
export async function canUserClaim(userAddress: string): Promise<boolean> {
  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESSES.AssessmentRewards as `0x${string}`,
      abi: ASSESSMENT_REWARDS_ABI,
      functionName: "canClaim",
      args: [userAddress as `0x${string}`],
    });
    return result as boolean;
  } catch (error) {
    console.error("Error checking claim eligibility:", error);
    return false;
  }
}

/**
 * Get today's claim count for a user
 */
export async function getTodayClaimCount(userAddress: string): Promise<number> {
  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESSES.AssessmentRewards as `0x${string}`,
      abi: ASSESSMENT_REWARDS_ABI,
      functionName: "getTodayClaimCount",
      args: [userAddress as `0x${string}`],
    });
    return Number(result);
  } catch (error) {
    console.error("Error getting claim count:", error);
    return 0;
  }
}

/**
 * Get maximum daily claims
 */
export async function getMaxDailyClaims(): Promise<number> {
  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESSES.AssessmentRewards as `0x${string}`,
      abi: ASSESSMENT_REWARDS_ABI,
      functionName: "MAX_DAILY_CLAIMS",
    });
    return Number(result);
  } catch (error) {
    console.error("Error getting max daily claims:", error);
    return 3; // Default fallback
  }
}

/**
 * Get passing score from contract
 */
export async function getPassingScore(): Promise<number> {
  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESSES.AssessmentRewards as `0x${string}`,
      abi: ASSESSMENT_REWARDS_ABI,
      functionName: "PASSING_SCORE",
    });
    return Number(result);
  } catch (error) {
    console.error("Error getting passing score:", error);
    return 700; // Default fallback
  }
}

/**
 * Generate assessment ID hash for on-chain validation
 * This creates a unique identifier that can be used to prevent duplicate claims
 */
export function generateAssessmentIdHash(
  assessmentId: string,
  candidateAddress: string,
  score: number
): string {
  // Simple hash function - in production, consider using keccak256
  const data = `${assessmentId}-${candidateAddress}-${score}`;
  return Buffer.from(data).toString("base64");
}

/**
 * Convert assessment ID hash to bytes32 format for contract calls
 * Uses keccak256 to create a proper 32-byte hash
 */
export function stringToBytes32(hash: string): `0x${string}` {
  // Use keccak256 to create a proper 32-byte hash
  const hashBytes = keccak256(toBytes(hash));
  return hashBytes;
}

/**
 * Get contract addresses as typed addresses
 */
export const ASSESSMENT_REWARDS_ADDRESS =
  CONTRACT_ADDRESSES.AssessmentRewards as `0x${string}`;
export const AWS_REWARD_TOKEN_ADDRESS =
  CONTRACT_ADDRESSES.AWSRewardToken as `0x${string}`;

/**
 * Get block explorer URL for a transaction hash
 */
export function getBlockExplorerUrl(txHash: string): string {
  const isTestnet = selectedChain.id === celoSepolia.id;
  if (isTestnet) {
    // Celo Sepolia testnet explorer
    return `https://sepolia.celoscan.io/tx/${txHash}`;
  }
  // Celo mainnet explorer
  return `https://celoscan.io/tx/${txHash}`;
}
