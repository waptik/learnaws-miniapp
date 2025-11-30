# Next Steps: Attaching Course Codes to Rewards

**Date**: 2025-11-28  
**Status**: Planning → Implementation

---

## 🎯 Goal

Attach course IDs/codes (e.g., "ccp" for Cloud Practitioner) to reward tokens so that:
1. Each reward token is linked to a specific course
2. Users can see which course they earned tokens for
3. The system can track rewards per course
4. Future courses can have their own course-specific tokens
5. Works for both certification courses (CLF-C02) and non-certification courses (AWS Basics)

---

## 📋 Current State

### ✅ What's Done
- Course-based architecture is in place
- `AssessmentResult` type includes `courseId`, `certificationCode`, `rewardTokenSymbol`
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
    string memory courseId  // NEW: "ccp", "aws-basics", etc.
) external nonReentrant {
    // ... existing validation ...
    
    // Store course ID with claim
    // Option 1: Emit in event (recommended for now)
    emit RewardClaimed(
        user, 
        score, 
        assessmentId, 
        TOKENS_PER_PASS, 
        currentDay,
        courseId  // NEW
    );
    
    // Option 2: Store in mapping (if we need to query later)
    // userCourses[user].push(courseId);
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
    string courseId  // NEW: "ccp", "aws-basics", etc.
);
```

**Considerations:**
- String storage is expensive on-chain
- Consider using `bytes32` instead if we can encode course IDs (they're short: "ccp" = 3 chars)
- Or emit in event (cheaper, but not queryable on-chain)
- Course IDs are simpler than certification codes (always present, shorter)

---

### Step 2: Update Frontend Claim Flow

**File: `ClaimTokenButton.tsx`**

**Current:**
```typescript
const assessmentIdHash = generateAssessmentIdHash(
  assessmentId,
  candidateAddress,
  score
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
// Get course ID from result (always present, unlike certificationCode)
const courseId = result.courseId || "";

// Convert to bytes32 if contract expects it, or pass as string
// Course IDs are short (e.g., "ccp", "aws-basics") so bytes32 works well
const courseIdBytes = stringToBytes32(courseId);

writeContract({
  address: ASSESSMENT_REWARDS_ADDRESS,
  abi: ASSESSMENT_REWARDS_ABI,
  functionName: "claimReward",
  args: [score, assessmentIdHash, courseId], // NEW parameter
});
```

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
  courseId: z.string(), // NEW: "ccp", "aws-basics", etc. (required)
});
```

**Updated Response:**
```typescript
return NextResponse.json({
  canClaim: true,
  dailyCount: todayCount,
  maxDailyClaims,
  claimData: {
    assessmentId,
    assessmentIdHash,
    score,
    candidateAddress,
    courseId, // NEW: Pass to frontend (always present)
  },
});
```

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
      { name: "courseId", type: "string" }, // NEW: "ccp", "aws-basics", etc.
    ],
    // ...
  },
  // ... updated event ...
  {
    name: "RewardClaimed",
    type: "event",
    inputs: [
      // ... existing inputs ...
      { name: "courseId", type: "string", indexed: false }, // NEW
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

**Recommendation:** Start with Option C (metadata in events), upgrade to Option B later if needed.

---

## 📊 Implementation Checklist

### Smart Contracts
- [ ] Update `AssessmentRewards.sol` to accept `courseId` parameter
- [ ] Update `RewardClaimed` event to include `courseId`
- [ ] Update contract ABI in `lib/contracts.ts`
- [ ] Deploy updated contract (or create new version)
- [ ] Update contract addresses in `constants.ts`

### Frontend
- [ ] Update `ClaimTokenButton.tsx` to pass `courseId`
- [ ] Update claim API call to include `courseId`
- [ ] Update `ClaimTokenButton` to get `courseId` from `result`
- [ ] Test claim flow with course ID

### API
- [ ] Update claim validation schema to include `courseId` (required)
- [ ] Pass `courseId` in API response
- [ ] Validate course ID exists and is active

### Testing
- [ ] Test claim with certification code
- [ ] Verify event includes certification code
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
- Deploy with certification code support from the start
- No migration needed

---

## 🎯 Expected Outcome

After implementation:

1. **User Claims Reward:**
   ```
   User passes CLF-C02 practice exam (course: "ccp")
   → Clicks "Claim Reward"
   → Frontend calls contract with: score, assessmentId, "ccp"
   → Contract mints token and emits event with "ccp"
   → User receives token linked to "ccp" course
   ```

2. **Event Log:**
   ```solidity
   RewardClaimed(
     user: 0x123...,
     score: 750,
     assessmentId: 0xabc...,
     tokensMinted: 1e18,
     day: 19723,
     courseId: "ccp"  // NEW
   )
   ```

3. **Future Courses:**
   ```
   When AWS Basics course is added:
   → Users can claim tokens for that course
   → Course ID would be "aws-basics"
   → System tracks rewards per course
   → Works for both certification courses and non-certification courses
   ```

---

## 📝 Notes

- **Gas Costs:** Adding string parameter will increase gas costs slightly
- **Course IDs are Short:** Course IDs like "ccp" are only 3 characters, so gas cost is minimal
- **Backwards Compatibility:** Old claims won't have course IDs (that's okay)
- **Future Expansion:** This sets foundation for course-specific tokens later
- **Querying:** Use event logs to query which courses users have tokens for
- **Universal:** Works for all courses (certification and non-certification) since courseId is always present

---

**Priority**: High - Core feature for course-based architecture  
**Estimated Effort**: 2-3 hours  
**Dependencies**: None - can be done independently

