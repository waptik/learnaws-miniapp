# MiniPay Full Implementation Plan

**Status**: 📋 Implementation Plan\
**Last Updated**: 2025-12-01\
**Based On**:
[Celo MiniPay Documentation](https://docs.celo.org/build-on-celo/build-on-minipay/code-library)

---

## 📋 Overview

This document provides a complete implementation plan for integrating MiniPay
into the Learn AWS miniapp, including:

- Package installation
- Hook creation (MiniPay detection, payment, etc.)
- Server actions migration (from API routes)
- Server/public client setup using MiniPay libraries

---

## 📦 Phase 1: Package Installation

### 1.1 Install Required Packages

**Location**: `apps/web/package.json`

**Packages to Install**:

```bash
cd apps/web
pnpm add @celo/abis @celo/identity
```

**Package Details**:

- `@celo/abis` - Celo contract ABIs (for cUSD balance checks, etc.)
- `@celo/identity` - Celo identity utilities (if needed for phone number
  mapping)

**Note**: `viem@2` and `wagmi@2` are already installed ✅

**Tasks**:

- [ ] Install `@celo/abis`
- [ ] Install `@celo/identity` (if needed)
- [ ] Verify package versions are compatible

**Estimated Time**: 5 minutes

---

## 🎣 Phase 2: Create MiniPay Hooks

### 2.1 Create `use-minipay.ts` Hook

**File**: `apps/web/src/hooks/use-minipay.ts`

**Purpose**: Detect MiniPay environment and provide MiniPay-specific utilities

**Implementation**:

```typescript
"use client";

import { useEffect, useState } from "react";
import { isMiniPay as checkMiniPay } from "@/lib/wagmi";

/**
 * Hook to detect if running in MiniPay environment
 * @returns boolean indicating if app is running in MiniPay
 */
export function useMiniPay(): boolean {
    const [isMiniPay, setIsMiniPay] = useState(false);

    useEffect(() => {
        setIsMiniPay(checkMiniPay());
    }, []);

    return isMiniPay;
}

/**
 * Hook to get user address in MiniPay (without additional libraries)
 * @returns user address or null
 */
export function useMiniPayAddress(): string | null {
    const [address, setAddress] = useState<string | null>(null);
    const isInMiniPay = useMiniPay();

    useEffect(() => {
        if (isInMiniPay && typeof window !== "undefined" && window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts", params: [] })
                .then((accounts: string[]) => {
                    if (accounts && accounts[0]) {
                        setAddress(accounts[0]);
                    }
                })
                .catch((error: Error) => {
                    console.error("Error getting MiniPay address:", error);
                });
        }
    }, [isInMiniPay]);

    return address;
}
```

**Tasks**:

- [ ] Create `apps/web/src/hooks/use-minipay.ts`
- [ ] Implement `useMiniPay()` hook
- [ ] Implement `useMiniPayAddress()` hook
- [ ] Test hooks in different environments

**Estimated Time**: 30 minutes

---

### 2.2 Create `use-payment.ts` Hook

**File**: `apps/web/src/hooks/use-payment.ts`

**Purpose**: Handle payments and transactions with MiniPay support

**Implementation**:

```typescript
"use client";

import { useEstimateGas, useSendTransaction } from "wagmi";
import { type Address, formatUnits, parseEther } from "viem";
import { celo } from "viem/chains";
import { useMiniPay } from "./use-minipay";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { selectedChain } from "@/lib/wagmi";

/**
 * Hook for sending payments/transactions
 * Handles MiniPay-specific requirements (cUSD fee currency, legacy transactions)
 */
export function usePayment() {
    const isInMiniPay = useMiniPay();
    const { sendTransaction, isPending, error, data } = useSendTransaction();
    const { data: gasEstimate } = useEstimateGas();

    const sendPayment = async (
        to: Address,
        value: string, // Amount in ether/wei
        feeCurrency?: Address, // Optional fee currency (cUSD for MiniPay)
    ) => {
        const txParams: any = {
            to,
            value: parseEther(value),
        };

        // Add fee currency for MiniPay (use cUSD from constants if not provided)
        if (isInMiniPay) {
            if (!feeCurrency) {
                // Get cUSD address from constants
                const chainKey = selectedChain.id === celo.id
                    ? "celo"
                    : "celoSepolia";
                feeCurrency = CONTRACT_ADDRESSES[chainKey].cUSD as Address;
            }
            txParams.feeCurrency = feeCurrency;
        }

        // For MiniPay, ensure legacy transaction format
        if (isInMiniPay) {
            // Wagmi should handle this, but we can force legacy format if needed
            // May need to use ethereum.request directly for MiniPay
        }

        return sendTransaction(txParams);
    };

    const gasEstimateFormatted = gasEstimate
        ? formatUnits(gasEstimate, 18)
        : "0";

    return {
        sendPayment,
        isPending,
        error,
        transactionHash: data,
        gasEstimate: gasEstimateFormatted,
        isMiniPay: isInMiniPay,
    };
}
```

**Tasks**:

- [ ] Create `apps/web/src/hooks/use-payment.ts`
- [ ] Implement `usePayment()` hook
- [ ] Add MiniPay-specific transaction handling
- [ ] Test payment flow

**Estimated Time**: 1 hour

---

### 2.3 Create `use-cusd-balance.ts` Hook

**File**: `apps/web/src/hooks/use-cusd-balance.ts`

**Purpose**: Check cUSD balance (required for MiniPay gas fees)

**Implementation**:

```typescript
"use client";

import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { stableTokenABI } from "@celo/abis";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { selectedChain } from "@/lib/wagmi";
import { celo } from "viem/chains";

/**
 * Hook to check cUSD balance
 * Essential for MiniPay users who need cUSD for gas fees
 * Uses existing cUSD addresses from constants
 */
export function useCUSDBalance() {
    const { address } = useAccount();

    // Get cUSD address for current chain
    const chainKey = selectedChain.id === celo.id ? "celo" : "celoSepolia";
    const cusdAddress = CONTRACT_ADDRESSES[chainKey].cUSD as `0x${string}`;

    const { data, isLoading, error } = useReadContract({
        address: cusdAddress,
        abi: stableTokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    const balance = data ? formatEther(data as bigint) : "0";

    return {
        balance,
        balanceWei: data as bigint | undefined,
        isLoading,
        error,
        hasBalance: balance !== "0" && parseFloat(balance) > 0,
        cusdAddress, // Return address for use in feeCurrency
    };
}
```

**Tasks**:

- [ ] Create `apps/web/src/hooks/use-cusd-balance.ts`
- [ ] Import `stableTokenABI` from `@celo/abis`
- [ ] Use existing `CONTRACT_ADDRESSES` from `@/lib/constants`
- [ ] Test balance checking

**Estimated Time**: 30 minutes

---

## 🔄 Phase 3: Server Actions Migration

### 3.1 Create Server Actions Directory Structure

**Structure**:

```
apps/web/src/
  actions/
    assessment/
      claim.ts          # Migrate from /api/assessment/claim
      submit.ts         # Migrate from /api/assessment/submit
      start.ts          # Migrate from /api/assessment/start
    auth/
      sign-in.ts        # Migrate from /api/auth/sign-in
    notify.ts           # Migrate from /api/notify
    webhook.ts          # Migrate from /api/webhook
```

**Tasks**:

- [ ] Create `apps/web/src/actions/` directory
- [ ] Create subdirectories for organization
- [ ] Set up TypeScript configuration

**Estimated Time**: 10 minutes

---

### 3.2 Create Server Public Client

**File**: `apps/web/src/lib/clients.ts`

**Purpose**: Create server-side and public clients for blockchain interactions

**Implementation**:

```typescript
import { createPublicClient, http, type PublicClient } from "viem";
import { celo, celoSepolia } from "viem/chains";
import { selectedChain } from "./wagmi";

/**
 * Server-side public client for blockchain reads
 * Used in server actions for contract interactions
 */
export function getServerPublicClient(): PublicClient {
    return createPublicClient({
        chain: selectedChain,
        transport: http(),
    });
}

/**
 * Client-side public client
 * Can be used in client components if needed
 */
export function getPublicClient(): PublicClient {
    return createPublicClient({
        chain: selectedChain,
        transport: http(),
    });
}
```

**Tasks**:

- [ ] Create `apps/web/src/lib/clients.ts`
- [ ] Implement server and public client functions
- [ ] Export for use in server actions

**Estimated Time**: 15 minutes

---

### 3.3 Migrate Assessment Claim API to Server Action

**File**: `apps/web/src/actions/assessment/claim.ts`

**Migration**: `apps/web/src/app/api/assessment/claim/route.ts` → Server Action

**Implementation**:

```typescript
"use server";

import { z } from "zod";
import {
    canUserClaim,
    generateAssessmentIdHash,
    getMaxDailyClaims,
    getTodayClaimCount,
} from "@/lib/contracts";
import { SCORING_CONFIG } from "@/types/assessment";
import { getCourseCode, isCourseActive } from "@/lib/courses";
import { getServerPublicClient } from "@/lib/clients";

const claimSchema = z.object({
    assessmentId: z.string(),
    candidateAddress: z.string(),
    score: z.number().min(0).max(1000),
    courseId: z.string(),
});

export type ClaimResult =
    | {
        success: true;
        canClaim: true;
        dailyCount: number;
        maxDailyClaims: number;
        claimData: {
            assessmentId: string;
            assessmentIdHash: string;
            score: number;
            candidateAddress: string;
            courseId: string;
            courseCode: string;
        };
    }
    | {
        success: false;
        canClaim: false;
        reason: string;
        courseId?: string;
        passingScore?: number;
        score?: number;
        dailyCount?: number;
        maxDailyClaims?: number;
    };

export async function validateClaim(
    data: z.infer<typeof claimSchema>,
): Promise<ClaimResult> {
    try {
        // Log server action call
        console.log("[Server Action] validateClaim", {
            timestamp: new Date().toISOString(),
            data,
        });

        // Validate input
        const validationResult = claimSchema.safeParse(data);
        if (!validationResult.success) {
            return {
                success: false,
                canClaim: false,
                reason: "Invalid request data",
            };
        }

        const { assessmentId, candidateAddress, score, courseId } =
            validationResult.data;

        // Validate course exists and is active
        if (!isCourseActive(courseId)) {
            console.log(
                "[Server Action] validateClaim - Course validation failed",
                { courseId },
            );
            return {
                success: false,
                canClaim: false,
                reason: "Course not found or not active",
                courseId,
            };
        }

        // Validate score meets passing threshold
        if (score < SCORING_CONFIG.PASSING_SCORE) {
            return {
                success: false,
                canClaim: false,
                reason: "Score is below passing threshold",
                passingScore: SCORING_CONFIG.PASSING_SCORE,
                score,
            };
        }

        // Check on-chain daily limit using server client
        const publicClient = getServerPublicClient();
        const canClaim = await canUserClaim(candidateAddress);
        const todayCount = await getTodayClaimCount(candidateAddress);
        const maxDailyClaims = await getMaxDailyClaims();

        if (!canClaim) {
            return {
                success: false,
                canClaim: false,
                reason: "Daily claim limit exceeded",
                dailyCount: todayCount,
                maxDailyClaims,
            };
        }

        // Determine course code for contract
        const courseCode = getCourseCode(courseId);

        // Generate claim data for frontend
        const assessmentIdHash = generateAssessmentIdHash(
            assessmentId,
            candidateAddress,
            score,
        );

        console.log("[Server Action] validateClaim - Success", {
            canClaim: true,
            dailyCount: todayCount,
            maxDailyClaims,
            courseId,
            courseCode,
        });

        return {
            success: true,
            canClaim: true,
            dailyCount: todayCount,
            maxDailyClaims,
            claimData: {
                assessmentId,
                assessmentIdHash,
                score,
                candidateAddress,
                courseId,
                courseCode,
            },
        };
    } catch (error) {
        console.error("[Server Action] validateClaim - Error:", error);
        return {
            success: false,
            canClaim: false,
            reason: "Failed to validate claim",
        };
    }
}
```

**Tasks**:

- [ ] Create `apps/web/src/actions/assessment/claim.ts`
- [ ] Migrate logic from API route
- [ ] Update to use server public client
- [ ] Update frontend to use server action
- [ ] Test server action

**Estimated Time**: 1 hour

---

### 3.4 Migrate Assessment Submit API to Server Action

**File**: `apps/web/src/actions/assessment/submit.ts`

**Migration**: `apps/web/src/app/api/assessment/submit/route.ts` → Server Action

**Implementation**:

```typescript
"use server";

import { calculateAssessmentResult } from "@/lib/scoring";
import { Answer, AssessmentResult, Question } from "@/types/assessment";
import { z } from "zod";

const submitSchema = z.object({
    assessmentId: z.string(),
    candidateAddress: z.string(),
    questions: z.array(z.any()),
    answers: z.array(z.any()),
});

export type SubmitResult =
    | {
        success: true;
        result: AssessmentResult;
    }
    | {
        success: false;
        error: string;
    };

export async function submitAssessment(
    data: z.infer<typeof submitSchema>,
): Promise<SubmitResult> {
    try {
        console.log("[Server Action] submitAssessment", {
            timestamp: new Date().toISOString(),
            assessmentId: data.assessmentId,
            questionsCount: data.questions?.length || 0,
            answersCount: data.answers?.length || 0,
        });

        // Validate input
        const validationResult = submitSchema.safeParse(data);
        if (!validationResult.success) {
            return {
                success: false,
                error: "Invalid request data",
            };
        }

        const { assessmentId, candidateAddress, questions, answers } =
            validationResult.data;

        // Validate questions and answers arrays match
        if (questions.length !== answers.length) {
            return {
                success: false,
                error: "Questions and answers arrays must have the same length",
            };
        }

        // Calculate assessment result
        const result = calculateAssessmentResult(
            questions as Question[],
            answers as Answer[],
            candidateAddress,
            assessmentId,
        );

        console.log("[Server Action] submitAssessment - Success", {
            assessmentId: result.assessmentId,
            scaledScore: result.scaledScore,
            passFail: result.passFail,
        });

        return {
            success: true,
            result,
        };
    } catch (error) {
        console.error("[Server Action] submitAssessment - Error:", error);
        return {
            success: false,
            error: "Failed to submit assessment",
        };
    }
}
```

**Tasks**:

- [ ] Create `apps/web/src/actions/assessment/submit.ts`
- [ ] Migrate logic from API route
- [ ] Update frontend to use server action
- [ ] Test server action

**Estimated Time**: 30 minutes

---

### 3.5 Migrate Assessment Start API to Server Action

**File**: `apps/web/src/actions/assessment/start.ts`

**Migration**: `apps/web/src/app/api/assessment/start/route.ts` → Server Action

**Implementation**:

```typescript
"use server";

import { generateAssessmentId, getRandomQuestionSet } from "@/lib/questions";
import { Question } from "@/types/assessment";

export type StartAssessmentResult =
    | {
        success: true;
        assessmentId: string;
        questions: Question[];
    }
    | {
        success: false;
        error: string;
    };

export async function startAssessment(): Promise<StartAssessmentResult> {
    try {
        console.log("[Server Action] startAssessment", {
            timestamp: new Date().toISOString(),
        });

        // Generate unique assessment ID
        const assessmentId = generateAssessmentId();

        // Get domain-balanced question set (50 questions)
        const questions = await getRandomQuestionSet(50);

        console.log("[Server Action] startAssessment - Success", {
            assessmentId,
            questionsCount: questions.length,
        });

        return {
            success: true,
            assessmentId,
            questions,
        };
    } catch (error) {
        console.error("[Server Action] startAssessment - Error:", error);
        return {
            success: false,
            error: "Failed to start assessment",
        };
    }
}
```

**Tasks**:

- [ ] Create `apps/web/src/actions/assessment/start.ts`
- [ ] Migrate logic from API route
- [ ] Update frontend to use server action
- [ ] Test server action

**Estimated Time**: 30 minutes

---

### 3.6 Update Frontend to Use Server Actions

**Files to Update**:

- `apps/web/src/components/assessment/ClaimTokenButton.tsx`
- `apps/web/src/app/assessment/page.tsx` (or wherever assessment is started)
- `apps/web/src/app/results/page.tsx` (or wherever assessment is submitted)

**Example Update** (ClaimTokenButton):

```typescript
// Before (API route)
const validationResponse = await fetch("/api/assessment/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});
const validationData = await validationResponse.json();

// After (Server action)
import { validateClaim } from "@/actions/assessment/claim";

const validationData = await validateClaim({
  assessmentId: result.assessmentId,
  candidateAddress: address,
  score: result.scaledScore,
  courseId: result.courseId || "",
});
```

**Tasks**:

- [ ] Update ClaimTokenButton to use `validateClaim` server action
- [ ] Update assessment start to use `startAssessment` server action
- [ ] Update assessment submit to use `submitAssessment` server action
- [ ] Test all flows work correctly
- [ ] Remove old API route files (or keep as fallback initially)

**Estimated Time**: 1-2 hours

---

## 🔧 Phase 4: Update Contract Utilities for Server Actions

### 4.1 Update Contract Functions to Use Server Client

**File**: `apps/web/src/lib/contracts.ts`

**Current**: Uses client-side public client

**Update**: Support both server and client contexts

**Implementation**:

```typescript
import { getPublicClient, getServerPublicClient } from "./clients";
import type { PublicClient } from "viem";

/**
 * Get public client (server or client based on context)
 */
function getContractClient(): PublicClient {
    // In server action context, use server client
    if (typeof window === "undefined") {
        return getServerPublicClient();
    }
    // In client context, use client public client
    return getPublicClient();
}

// Update existing functions to use getContractClient()
export async function canUserClaim(
    userAddress: string,
): Promise<boolean> {
    try {
        const client = getContractClient();
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

// Similar updates for other contract functions...
```

**Tasks**:

- [ ] Update `getPublicClient()` to support server/client contexts
- [ ] Update all contract read functions to use appropriate client
- [ ] Test functions work in both server and client contexts

**Estimated Time**: 1 hour

---

## 📝 Phase 5: Integration Checklist

### 5.1 Package Installation

- [ ] Install `@celo/abis`
- [ ] Install `@celo/identity` (if needed)
- [ ] Verify all packages are compatible

### 5.2 Hooks Creation

- [ ] Create `use-minipay.ts` hook
- [ ] Create `use-payment.ts` hook
- [ ] Create `use-cusd-balance.ts` hook
- [ ] Test all hooks

### 5.3 Server Actions

- [ ] Create `lib/clients.ts` with server/public clients
- [ ] Create `actions/assessment/claim.ts`
- [ ] Create `actions/assessment/submit.ts`
- [ ] Create `actions/assessment/start.ts`
- [ ] Migrate other API routes if needed

### 5.4 Frontend Updates

- [ ] Update ClaimTokenButton to use server action
- [ ] Update assessment start flow
- [ ] Update assessment submit flow
- [ ] Test all flows

### 5.5 Contract Utilities

- [ ] Update contract functions for server/client contexts
- [ ] Test contract reads in server actions
- [ ] Verify all functionality works

### 5.6 Testing

- [ ] Test server actions independently
- [ ] Test frontend integration
- [ ] Test MiniPay-specific features
- [ ] Test error handling

---

## 🎯 Implementation Order

### Recommended Sequence:

1. **Install Packages** (5 min)
   - Quick win, no code changes

2. **Create Client Utilities** (15 min)
   - Foundation for server actions

3. **Create Hooks** (2 hours)
   - `use-minipay.ts` (30 min)
   - `use-payment.ts` (1 hour)
   - `use-cusd-balance.ts` (30 min)

4. **Migrate Server Actions** (2-3 hours)
   - Start with simplest (start.ts)
   - Then submit.ts
   - Finally claim.ts (most complex)

5. **Update Frontend** (1-2 hours)
   - Update components to use server actions
   - Test thoroughly

6. **Update Contract Utilities** (1 hour)
   - Support server/client contexts

**Total Estimated Time**: 6-8 hours

---

## 📚 References

- [Celo MiniPay Code Library](https://docs.celo.org/build-on-celo/build-on-minipay/code-library)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

---

**Last Updated**: 2025-12-01\
**Status**: Ready for Implementation
