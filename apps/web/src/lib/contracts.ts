/**
 * Smart Contract Interaction Utilities
 * Handles reading contract state and preparing claim data
 */

import { createPublicClient, http } from "viem";
import { celoSepolia } from "viem/chains";

// Contract addresses (Celo Sepolia)
export const CONTRACT_ADDRESSES = {
  AWSRewardToken: "0x9F88a4Cf7daDbd54b1A8c06B60a579d64C01E2E9",
  AssessmentRewards: "0xa246e627EAA83EE57434166669767613597D0691",
} as const;

// ABI for AssessmentRewards contract (minimal for read operations)
const ASSESSMENT_REWARDS_ABI = [
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
] as const;

/**
 * Create public client for reading contract state
 */
function getPublicClient() {
  return createPublicClient({
    chain: celoSepolia,
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

