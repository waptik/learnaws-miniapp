# Next Steps: Attaching Course Codes to Rewards

**Date**: 2025-11-28\
**Status**: Planning → Implementation

---

## 🎯 Goal

Attach course codes/IDs to reward tokens. The frontend/backend will determine
the appropriate course code to use (e.g., "CLF-C02" for certification courses,
"aws-basics" for non-certification courses) and pass it to the smart contract.
This ensures:

1. Each reward token is linked to a specific course
2. Users see meaningful course identifiers
3. The system can track rewards per course
4. Future courses can have their own course-specific tokens
5. Works for all course types

**Strategy:**

- **Frontend/Backend**: Determines which course code to use based on course type
- **Smart Contract**: Simply receives `courseCode` parameter (no conversion
  logic)
- **Maintain courseId**: Keep courseId in the system for internal use

---

## 📋 Current State

### ✅ What's Done

- Course-based architecture is in place
- `AssessmentResult` type includes `courseId`, `rewardTokenSymbol`
- Frontend passes course context through the flow
- Results page displays course information

### ❌ What's Missing

- Smart contract doesn't accept/store course IDs
- Frontend doesn't pass course ID when claiming
- API doesn't validate/pass course IDs
- Token contract doesn't differentiate by course

---

## 🔧 Implementation Steps

### Step 1: Update Smart Contract (`AssessmentRewards.sol`)

**Current Function:**

```solidity
function claimReward(uint256 score, bytes32 assessmentId) 
    external 
    nonReentrant
```

**Updated Function:**

```solidity
function claimReward(
    uint256 score, 
    bytes32 assessmentId,
    string memory courseCode  // NEW: Receives course code (e.g., "CLF-C02" or "aws-basics")
) external nonReentrant {
    // ... existing validation ...
    
    // Store course code with claim
    // Option 1: Emit in event (recommended for now)
    emit RewardClaimed(
        user, 
        score, 
        assessmentId, 
        TOKENS_PER_PASS, 
        currentDay,
        courseCode  // NEW: Frontend/backend handles conversion, contract just receives it
    );
    
    // Option 2: Store in mapping (if we need to query later)
    // userCourses[user].push(courseCode);
}
```

**Updated Event:**

```solidity
event RewardClaimed(
    address indexed user,
    uint256 score,
    bytes32 indexed assessmentId,
    uint256 tokensMinted,
    uint256 day,
    string courseCode  // NEW: Course code (e.g., "CLF-C02" or "aws-basics")
);
```

**Contract Responsibility:**

- ✅ Accept `courseCode` parameter (string)
- ✅ Emit it in the event
- ❌ Does NOT handle conversion logic (that's frontend/backend's job)

**Frontend/Backend Responsibility:**

- ✅ Determine which course code to use based on course type
- ✅ Convert and pass the appropriate course code to the contract
- ✅ Handle the business logic for determining course code

**Considerations:**

- String storage is expensive on-chain
- Consider using `bytes32` instead if we can encode identifiers
- Or emit in event (cheaper, but not queryable on-chain)
- **Separation of Concerns**: Contract is simple - just receives and stores.
  Frontend/backend handles business logic.

---

### Step 2: Update Frontend Claim Flow

**File: `ClaimTokenButton.tsx`**

**Current:**

```typescript
const assessmentIdHash = generateAssessmentIdHash(
    assessmentId,
    candidateAddress,
    score,
);

writeContract({
    address: ASSESSMENT_REWARDS_ADDRESS,
    abi: ASSESSMENT_REWARDS_ABI,
    functionName: "claimReward",
    args: [score, assessmentIdHash],
});
```

**Updated:**

```typescript
// Frontend determines course code based on course type
// Contract just receives the final course code - no conversion logic in contract
const courseCode = result.courseId || ""; // Frontend determines appropriate course code

// Convert to bytes32 if contract expects it, or pass as string
const courseCodeBytes = stringToBytes32(courseCode);

writeContract({
    address: ASSESSMENT_REWARDS_ADDRESS,
    abi: ASSESSMENT_REWARDS_ABI,
    functionName: "claimReward",
    args: [score, assessmentIdHash, courseCode], // NEW parameter
});
```

**Why this approach:**

- **Frontend/Backend handles conversion**: Determines which course code to use
- **Contract is simple**: Just receives `courseCode` parameter, no logic needed
- **Separation of concerns**: Business logic in frontend/backend, contract just
  stores
- **Maintain courseId**: Keep courseId in system for internal use

---

### Step 3: Update API Validation

**File: `app/api/assessment/claim/route.ts`**

**Current Schema:**

```typescript
const claimSchema = z.object({
    assessmentId: z.string(),
    candidateAddress: z.string(),
    score: z.number().min(0).max(1000),
});
```

**Updated Schema:**

```typescript
const claimSchema = z.object({
    assessmentId: z.string(),
    candidateAddress: z.string(),
    score: z.number().min(0).max(1000),
    courseId: z.string(), // Required: "ccp", "aws-basics", etc.
});
```

**Updated Response:**

```typescript
// Backend determines course code based on course type
// Frontend will use this to send to contract
const courseCode = courseId; // Backend determines appropriate course code

return NextResponse.json({
    canClaim: true,
    dailyCount: todayCount,
    maxDailyClaims,
    claimData: {
        assessmentId,
        assessmentIdHash,
        score,
        candidateAddress,
        courseCode, // NEW: Frontend will send this to contract
        courseId, // Include for reference
    },
});
```

**Backend Logic:**

- Receives `courseId` from frontend
- Determines appropriate `courseCode` based on course type
- Returns `courseCode` for frontend to use in contract call
- Contract doesn't need to know about the conversion logic

---

### Step 4: Update Contract ABI and Utilities

**File: `lib/contracts.ts`**

**Update ABI:**

```typescript
export const ASSESSMENT_REWARDS_ABI = [
    // ... existing functions ...
    {
        name: "claimReward",
        type: "function",
        inputs: [
            { name: "score", type: "uint256" },
            { name: "assessmentId", type: "bytes32" },
            { name: "courseCode", type: "string" }, // NEW: Receives course code (frontend handles conversion)
        ],
        // ...
    },
    // ... updated event ...
    {
        name: "RewardClaimed",
        type: "event",
        inputs: [
            // ... existing inputs ...
            { name: "courseCode", type: "string", indexed: false }, // NEW
        ],
    },
] as const;
```

---

### Step 5: Token System Decision

**Option A: Single Token Contract (Current)**

- ✅ Simpler
- ✅ One contract to manage
- ❌ Can't differentiate tokens by certification
- ❌ All tokens look the same

**Option B: Separate Token Contracts per Certification**

- ✅ Clear separation
- ✅ Each certification has its own token
- ❌ More contracts to deploy/manage
- ❌ More complex

**Option C: Metadata/Events Only (Recommended for Now)**

- ✅ Keep current token contract
- ✅ Store course ID in events
- ✅ Query events to see which course tokens are for
- ✅ Can upgrade to separate contracts later if needed
- ✅ Works for all courses (certification and non-certification)

**Recommendation:** Start with Option C (metadata in events), upgrade to Option
B later if needed.

---

## 📊 Implementation Checklist

### Smart Contracts

- [ ] Update `AssessmentRewards.sol` to accept `courseIdentifier` parameter
- [ ] Update `RewardClaimed` event to include `courseIdentifier`
- [ ] Update contract ABI in `lib/contracts.ts`
- [ ] Deploy updated contract (or create new version)
- [ ] Update contract addresses in `constants.ts`

### Frontend

- [ ] Update `ClaimTokenButton.tsx` to determine `courseCode` based on course
      type
- [ ] Update claim API call to include `courseId`
- [ ] Update `ClaimTokenButton` to pass `courseCode` to contract (frontend
      handles conversion)
- [ ] Test claim flow with different course types

### API

- [ ] Update claim validation schema to include `courseId` (required)
- [ ] Determine `courseCode` in API based on course type (backend handles
      conversion)
- [ ] Pass `courseCode` in API response for frontend to use
- [ ] Validate course ID exists and is active
- [ ] **Note**: API handles conversion logic, contract just receives the final
      `courseCode`

### Testing

- [ ] Test claim with course code
- [ ] Verify event includes course code
- [ ] Test with different courses (when available)
- [ ] Verify backwards compatibility

---

## 🔄 Migration Strategy

### For Existing Contracts

If contracts are already deployed:

1. **Option 1: Deploy New Contract**
   - Deploy updated `AssessmentRewards` contract
   - Update addresses in `constants.ts`
   - Users continue using old contract for old claims

2. **Option 2: Upgrade Pattern**
   - If using upgradeable contracts, upgrade existing contract
   - All users migrate to new version

3. **Option 3: Dual Support**
   - Support both old and new contract versions
   - Check contract version and call appropriate function

### For New Deployments

- Deploy with course code support from the start
- No migration needed

---

## 🎯 Expected Outcome

After implementation:

1. **User Claims Reward (Certification Course):**
   ```
   User passes CLF-C02 practice exam (course: "ccp")
   → Clicks "Claim Reward"
   → Frontend: Determines courseCode based on course type (e.g., "CLF-C02")
   → Frontend calls API with: courseId="ccp"
   → API: Determines courseCode based on course type (e.g., "CLF-C02")
   → API returns: courseCode = "CLF-C02"
   → Frontend calls contract with: score, assessmentId, "CLF-C02"
   → Contract: Receives "CLF-C02", mints token, emits event
   → User receives token linked to "CLF-C02"
   ```

2. **User Claims Reward (Non-Certification Course):**
   ```
   User passes AWS Basics (course: "aws-basics")
   → Clicks "Claim Reward"
   → Frontend: Determines courseCode = courseId = "aws-basics"
   → Frontend calls API with: courseId="aws-basics"
   → API: Determines courseCode = "aws-basics"
   → API returns: courseCode = "aws-basics"
   → Frontend calls contract with: score, assessmentId, "aws-basics"
   → Contract: Receives "aws-basics", mints token, emits event
   → User receives token linked to "aws-basics"
   ```

3. **Event Log (Certification Course):**
   ```solidity
   RewardClaimed(
     user: 0x123...,
     score: 750,
     assessmentId: 0xabc...,
     tokensMinted: 1e18,
     day: 19723,
     courseCode: "CLF-C02"  // NEW: Contract receives course code
   )
   ```

4. **Event Log (Non-Certification Course):**
   ```solidity
   RewardClaimed(
     user: 0x123...,
     score: 750,
     assessmentId: 0xabc...,
     tokensMinted: 1e18,
     day: 19723,
     courseCode: "aws-basics"  // NEW: Contract receives course code
   )
   ```

5. **Separation of Concerns:**
   - **Frontend/Backend**: Handles conversion logic to determine course code
   - **Contract**: Just receives `courseCode` parameter, no conversion logic
   - **Clean Architecture**: Business logic stays in frontend/backend, contract
     is simple

---

## 📝 Notes

- **Gas Costs:** Adding string parameter will increase gas costs slightly
- **Course Code Length:** Varies by course type - still reasonable
- **User Experience:** Course codes are meaningful identifiers for users
- **Conversion Logic:** Frontend/backend handles conversion to determine course
  code, contract just receives the result
- **Separation of Concerns:** Contract is simple - no business logic, just
  receives and stores
- **Backwards Compatibility:** Old claims won't have course codes (that's okay)
- **Future Expansion:** This sets foundation for course-specific tokens later
- **Querying:** Use event logs to query which courses users have tokens for
- **Universal:** Works for all courses
- **Maintain courseId:** Keep courseId in system for internal use

---

**Priority**: High - Core feature for course-based architecture\
**Estimated Effort**: 2-3 hours\
**Dependencies**: None - can be done independently
