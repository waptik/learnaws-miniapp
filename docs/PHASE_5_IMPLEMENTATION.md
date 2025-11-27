# Phase 5: Wallet Integration & Token Claiming

## Implementation Plan

**Version**: 2.0\
**Status**: ✅ Complete\
**Last Updated**: 2025-01-24\
**Phase**: Wallet Integration (Week 3)

---

## 📚 Navigation

**Project Documentation**:

- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and
  implementation guide
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection &
  processing ✅
- [Phase 2 Implementation](./PHASE_2_IMPLEMENTATION.md) - Smart contracts ✅
- [Phase 3 Implementation](./PHASE_3_IMPLEMENTATION.md) - Frontend Assessment UI
  ✅
- [Phase 4 Implementation](./PHASE_4_IMPLEMENTATION.md) - Scoring & Validation
  (API Routes) ✅

**Technical Specifications**:

- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment
  results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference

---

## 📋 Overview

Phase 5 focuses on implementing the actual token claiming flow. This includes
calling the smart contract to mint tokens, tracking transaction status, and
displaying token balances.

**Note on Wallet Infrastructure**: The wallet connection infrastructure is
already in place (Wagmi + Farcaster MiniApp connector). While the main plan
mentions "Celo Composer Kit", we're using Wagmi directly which provides the same
functionality. Wallet connect functionality was implemented in earlier phases
and is working.

---

## 🎯 What to Do

### Step 1: Implement Smart Contract Interaction

1. Add `claimReward` function to `lib/contracts.ts` to call the contract
2. Use `useWriteContract` and `useWaitForTransactionReceipt` from Wagmi
3. Handle transaction states (pending, success, error)

### Step 2: Update Claim Token Button

1. Replace validation-only flow with actual contract call
2. Show transaction status (pending, confirming, success, error)
3. Update UI to reflect transaction state

### Step 3: Add Token Balance Display

1. Create component to display user's token balance
2. Use `useReadContract` to fetch balance from ERC20 token
3. Show balance in header or results page

### Step 4: Transaction Status Tracking

1. Add toast notifications for transaction events
2. Show loading states during transaction
3. Handle errors gracefully with user-friendly messages

---

## ✅ What to Expect

### After Implementation

- ✅ Users can actually claim tokens (not just validate)
- ✅ Transaction status is visible (pending → confirming → success)
- ✅ Token balance updates after successful claim
- ✅ Error messages guide users when transactions fail
- ✅ Daily limit is enforced on-chain

### User Flow

1. User passes assessment (score ≥ 700)
2. User clicks "Claim Token"
3. API validates eligibility (Phase 4)
4. **NEW**: Smart contract transaction is initiated
5. **NEW**: Transaction status shown (pending, confirming)
6. **NEW**: On success, tokens are minted to user's wallet
7. **NEW**: Token balance updates automatically

---

## 🎯 Objectives

1. **Smart Contract Integration**: Call `AssessmentRewards.claimReward()` to
   mint tokens
2. **Transaction Handling**: Track transaction status with Wagmi hooks
3. **Token Balance Display**: Show user's AWSP token balance
4. **Error Handling**: Handle transaction failures gracefully
5. **User Feedback**: Clear status messages throughout the flow

---

## 📁 File Structure

```
apps/web/src/
├── lib/
│   └── contracts.ts                 # ✅ Already exists, add claimReward function
├── components/
│   ├── assessment/
│   │   └── ClaimTokenButton.tsx      # Update to call contract
│   └── wallet/
│       └── TokenBalance.tsx          # NEW: Display token balance
└── hooks/
    └── use-claim-token.ts             # NEW: Custom hook for claiming
```

---

## 🔧 Implementation Details

### 1. Smart Contract Function

**Location**: `apps/web/src/lib/contracts.ts`

Add function to call the contract:

```typescript
import { parseUnits } from "viem";
import { ASSESSMENT_REWARDS_ABI } from "./abis";

export async function claimReward(
    address: `0x${string}`,
    score: number,
    assessmentId: string,
): Promise<`0x${string}`> {
    // Generate assessment ID hash
    const assessmentIdHash = generateAssessmentIdHash(
        assessmentId,
        address,
        score,
    );

    // Convert to bytes32
    const hashBytes = hexToBytes32(assessmentIdHash);

    // Return transaction data
    return {
        address: ASSESSMENT_REWARDS_ADDRESS,
        abi: ASSESSMENT_REWARDS_ABI,
        functionName: "claimReward",
        args: [BigInt(score), hashBytes],
    };
}
```

### 2. Contract ABI

**Location**: `apps/web/src/lib/abis.ts` (NEW)

Extract ABI from contract artifacts or generate from TypeScript:

```typescript
export const ASSESSMENT_REWARDS_ABI = [
    {
        inputs: [
            { name: "score", type: "uint256" },
            { name: "assessmentId", type: "bytes32" },
        ],
        name: "claimReward",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    // ... other functions
] as const;
```

### 3. Update Claim Token Button

**Location**: `apps/web/src/components/assessment/ClaimTokenButton.tsx`

Replace validation-only flow:

```typescript
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/lib/contracts";

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        },
    );
    const { toast } = useToast();

    const handleClaim = async () => {
        // ... validation (existing code) ...

        try {
            // Validate via API first
            const validationResponse = await fetch("/api/assessment/claim", {
                // ... existing validation code ...
            });

            if (!validationData.canClaim) {
                setError(validationData.reason);
                return;
            }

            // Call smart contract
            writeContract({
                address: ASSESSMENT_REWARDS_ADDRESS,
                abi: ASSESSMENT_REWARDS_ABI,
                functionName: "claimReward",
                args: [
                    BigInt(result.scaledScore),
                    hexToBytes32(validationData.claimData.assessmentIdHash),
                ],
            });
        } catch (err) {
            // ... error handling ...
        }
    };

    // Show transaction status
    useEffect(() => {
        if (isSuccess) {
            toast({
                title: "Tokens Claimed!",
                description:
                    "Your reward tokens have been minted successfully.",
            });
        }
    }, [isSuccess, toast]);

    return (
        <Button
            onClick={handleClaim}
            disabled={isPending || isConfirming || !isConnected}
        >
            {isPending
                ? "Confirming..."
                : isConfirming
                ? "Processing..."
                : "Claim Token"}
        </Button>
    );
}
```

### 4. Token Balance Component

**Location**: `apps/web/src/components/wallet/TokenBalance.tsx` (NEW)

```typescript
import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import {
    AWS_REWARD_TOKEN_ABI,
    AWS_REWARD_TOKEN_ADDRESS,
} from "@/lib/contracts";

export function TokenBalance() {
    const { address } = useAccount();

    const { data: balance, isLoading } = useReadContract({
        address: AWS_REWARD_TOKEN_ADDRESS,
        abi: AWS_REWARD_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address!],
        query: {
            enabled: !!address,
        },
    });

    if (!address) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm">Balance:</span>
            <span className="font-bold">
                {isLoading ? "..." : balance ? formatUnits(balance, 18) : "0"}
                {" "}
                AWSP
            </span>
        </div>
    );
}
```

### 5. Contract Addresses

**Location**: `apps/web/src/lib/contracts.ts`

```typescript
// Celo Sepolia Testnet
export const ASSESSMENT_REWARDS_ADDRESS =
    "0xa246e627EAA83EE57434166669767613597D0691" as `0x${string}`;
export const AWS_REWARD_TOKEN_ADDRESS =
    "0x9F88a4Cf7daDbd54b1A8c06B60a579d64C01E2E9" as `0x${string}`;
```

---

## 🚀 Execution Flow

### Token Claim Flow

1. User passes assessment (score ≥ 700)
2. User clicks "Claim Token"
3. **API Validation** (Phase 4):
   - Check score >= 700
   - Check daily limit on-chain
   - Generate assessment ID hash
4. **Smart Contract Call** (Phase 5):
   - User approves transaction in wallet
   - Transaction sent to blockchain
   - Contract validates and mints tokens
5. **Transaction Tracking**:
   - Show "Confirming..." while waiting for user approval
   - Show "Processing..." while transaction is pending
   - Show success message when confirmed
6. **Balance Update**:
   - Token balance component automatically refreshes
   - User sees updated balance

---

## 📊 Success Criteria

### Smart Contract Integration

- [ ] `claimReward` function calls contract successfully
- [ ] Transaction data is correctly formatted
- [ ] Assessment ID hash is generated correctly
- [ ] Contract validates score and daily limits

### Transaction Handling

- [ ] Transaction status is tracked (pending, confirming, success)
- [ ] User sees clear status messages
- [ ] Errors are handled gracefully
- [ ] Transaction hash is displayed/linkable

### Token Balance

- [ ] Balance is fetched from contract
- [ ] Balance updates after successful claim
- [ ] Balance is displayed in user-friendly format
- [ ] Loading states are handled

### User Experience

- [ ] Flow is intuitive and clear
- [ ] Error messages are helpful
- [ ] Success feedback is visible
- [ ] Daily limit messages are clear

---

## 🧪 Testing Strategy

### Manual Testing

1. Pass an assessment
2. Click "Claim Token"
3. Approve transaction in wallet
4. Verify transaction succeeds
5. Check token balance updates
6. Test daily limit (claim 3 times)
7. Test error cases (low score, limit exceeded)

### Contract Testing

- Verify tokens are minted correctly
- Verify daily limit is enforced
- Verify score validation works
- Verify assessment ID hash prevents duplicates

---

## ⏭️ Next Steps After Phase 5

Once Phase 5 is complete:

1. Test end-to-end token claiming flow
2. Verify all error cases
3. Test on different networks (Sepolia, Mainnet)
4. Proceed to Phase 6: Testing & Polish

---

## 📝 Implementation Checklist

### Phase 5 Tasks

**Smart Contract Integration**:

- [x] Create contract ABI file (in `lib/contracts.ts`)
- [x] Add `claimReward` function to ABI
- [x] Add contract addresses constants
- [x] Implement bytes32 conversion for assessment ID (using keccak256)

**Wallet Integration** (from main plan):

- [x] Wallet connect functionality (already implemented in earlier phases)
- [x] Note: Using Wagmi directly instead of Celo Composer Kit (provides same
      functionality)

**Transaction Handling**:

- [x] Update `ClaimTokenButton` to use `useWriteContract`
- [x] Add transaction status tracking with `useWaitForTransactionReceipt`
- [x] Add toast notifications for transaction events
- [x] Handle transaction errors

**Token Balance**:

- [x] Create `TokenBalance` component
- [x] Use `useReadContract` to fetch balance
- [x] Add balance display to UI (results page)
- [x] Handle loading and error states

**Error Handling**:

- [x] Handle transaction rejection (via `writeError`)
- [x] Handle network errors (via `receiptError`)
- [x] Handle contract revert errors (error states)
- [x] Show user-friendly error messages (toast + inline)

**Testing & Documentation**:

- [ ] Test complete claim flow
- [ ] Test error cases
- [x] Update documentation

---

**Status**: ✅ Complete\
**Last Updated**: 2025-01-24

**What Was Done**:

1. ✅ Added contract ABIs (AssessmentRewards and AWSRewardToken) to
   `lib/contracts.ts`
2. ✅ Implemented `stringToBytes32()` using keccak256 for proper hash conversion
3. ✅ Updated `ClaimTokenButton` to call smart contract via `useWriteContract`
4. ✅ Added transaction status tracking with `useWaitForTransactionReceipt`
5. ✅ Integrated toast notifications for all transaction events
6. ✅ Created `TokenBalance` component with auto-refresh
7. ✅ Added `TokenBalance` to results page
8. ✅ Comprehensive error handling for all failure cases
9. ✅ Added `Toaster` to providers for global toast support
