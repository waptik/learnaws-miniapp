# Phase 4: Scoring & Validation (API Routes)
## Implementation Plan

**Version**: 2.0  
**Status**: ✅ Complete  
**Last Updated**: 2025-01-24  
**Phase**: Scoring & Validation (Week 2-3)

---

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection & processing ✅
- [Phase 2 Implementation](./PHASE_2_IMPLEMENTATION.md) - Smart contracts ✅
- [Phase 3 Implementation](./PHASE_3_IMPLEMENTATION.md) - Frontend Assessment UI ✅

**Technical Specifications**:
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference

---

## 📋 Overview

Phase 4 focuses on implementing backend API routes for assessment scoring, validation, and token claim preparation. This includes integrating with smart contracts for claim validation and daily limit checking.

**⚠️ Important**: This phase requires **both** API route creation **and** frontend integration. The frontend must be updated to call the API routes instead of using direct function calls.

---

## 🎯 What to Do

### Step 1: Create API Routes
1. Create `/api/assessment/start` - Returns domain-balanced question set
2. Create `/api/assessment/submit` - Calculates and returns assessment score
3. Create `/api/assessment/claim` - Validates claim eligibility

### Step 2: Integrate Frontend (Critical!)
1. **Update Results Page**: Change from `calculateAssessmentResult()` to `POST /api/assessment/submit`
2. **Update Claim Button**: Change from TODO to `POST /api/assessment/claim`
3. **Add Fallbacks**: Ensure UI still works if API fails

### Step 3: Test Everything
1. Test API routes independently (use test scripts)
2. Test frontend integration end-to-end
3. Verify error handling works

---

## ✅ What to Expect

### After API Routes Are Created
- ✅ Three new API endpoints available at `/api/assessment/*`
- ✅ Endpoints validate input and return proper responses
- ✅ Error handling for invalid requests
- ✅ Contract integration for claim validation

### After Frontend Integration
- ✅ Results page uses API for scoring (check Network tab in DevTools)
- ✅ Claim button validates eligibility via API before showing errors
- ✅ Better error messages for users
- ✅ Fallback to client-side calculation if API fails

### Testing Results
- ✅ All API endpoints return correct data
- ✅ Frontend calls APIs correctly
- ✅ Error cases handled gracefully
- ✅ User experience remains smooth

**Note**: The frontend was previously using direct function calls from Phase 3. After Phase 4, it should use API routes for consistency and better validation.

---

## 🎯 Objectives

1. **Scoring Logic**: ✅ Already implemented in `lib/scoring.ts`
2. **Assessment API Routes**: Create API endpoints for assessment flow
3. **Frontend Integration**: Update UI components to use API routes instead of direct function calls
4. **Claim Validation**: Validate claims before allowing token minting
5. **Smart Contract Integration**: Connect API to deployed contracts
6. **Error Handling**: Comprehensive error handling and validation

---

## 📁 File Structure

```
apps/web/src/
├── app/
│   └── api/
│       ├── assessment/
│       │   ├── start/
│       │   │   └── route.ts        # Start new assessment
│       │   ├── submit/
│       │   │   └── route.ts        # Submit answers and calculate score
│       │   └── claim/
│       │       └── route.ts        # Validate and prepare token claim
│       └── claim/
│           └── validate/
│               └── route.ts        # Validate claim eligibility
└── lib/
    ├── scoring.ts                  # ✅ Already exists
    ├── contracts.ts                 # Contract interaction utilities
    └── validation.ts                # Claim validation logic
```

---

## 🔧 Implementation Details

### 1. Assessment Start API ✅

**Location**: `apps/web/src/app/api/assessment/start/route.ts`

**Endpoint**: `POST /api/assessment/start`

**Functionality**:
- Load questions from `data/questions.json`
- Apply domain-balanced selection (50 questions)
- Generate unique assessment ID
- Return question set

**Request**:
```typescript
// No body required, or optional user address
{
  candidateAddress?: string;
}
```

**Response**:
```typescript
{
  assessmentId: string;
  questions: Question[];
}
```

---

### 2. Assessment Submit API

**Location**: `apps/web/src/app/api/assessment/submit/route.ts`

**Endpoint**: `POST /api/assessment/submit`

**Functionality**:
- Receive questions and answers
- Calculate score using `calculateAssessmentResult()`
- Return assessment result

**Request**:
```typescript
{
  assessmentId: string;
  candidateAddress: string;
  questions: Question[];
  answers: Answer[];
}
```

**Response**:
```typescript
{
  result: AssessmentResult;
}
```

---

### 3. Claim Validation API

**Location**: `apps/web/src/app/api/assessment/claim/route.ts`

**Endpoint**: `POST /api/assessment/claim`

**Functionality**:
- Validate assessment result (must be PASS)
- Check daily claim limit on-chain
- Generate claim signature/hash for on-chain validation
- Return claim data for frontend

**Request**:
```typescript
{
  assessmentId: string;
  candidateAddress: string;
  score: number;
}
```

**Response**:
```typescript
{
  canClaim: boolean;
  reason?: string;
  dailyCount?: number;
  maxDailyClaims?: number;
  claimData?: {
    assessmentId: string;
    score: number;
    signature?: string; // If needed for on-chain validation
  };
}
```

---

### 4. Frontend Integration ✅

**Critical Step**: Update UI components to call API routes instead of using direct functions.

**Files to Update**:

1. **Results Page** (`apps/web/src/app/results/page.tsx`):
   - **Before**: Called `calculateAssessmentResult()` directly
   - **After**: Calls `POST /api/assessment/submit` with questions and answers
   - **Fallback**: If API fails, falls back to client-side calculation
   - **Expected Behavior**: 
     - Loads questions/answers from sessionStorage
     - Submits to API for scoring
     - Displays results from API response
     - Handles errors gracefully

2. **Claim Token Button** (`apps/web/src/components/assessment/ClaimTokenButton.tsx`):
   - **Before**: Had TODO comment, no actual validation
   - **After**: Calls `POST /api/assessment/claim` to validate eligibility
   - **Expected Behavior**:
     - Validates score >= 700 (passing threshold)
     - Checks on-chain daily limit
     - Shows appropriate error messages
     - Prepares for smart contract interaction (Phase 5)

3. **Assessment Start** (Optional):
   - **Current**: Uses `getRandomQuestionSet()` directly (works fine)
   - **Future**: Can optionally use `POST /api/assessment/start` for consistency
   - **Note**: Client-side approach is acceptable for now

**What to Expect After Integration**:
- ✅ Results page uses API for scoring (with fallback)
- ✅ Claim button validates eligibility via API
- ✅ Better error handling and user feedback
- ✅ Consistent backend validation
- ✅ Preparation for smart contract integration

---

### 5. Smart Contract Integration

**Location**: `apps/web/src/lib/contracts.ts`

**Functionality**:
- Read contract state (daily claims, can claim)
- Prepare transaction data for token claims
- Validate claim eligibility

**Contract Addresses** (Celo Sepolia):
- AWSRewardToken: `0x9F88a4Cf7daDbd54b1A8c06B60a579d64C01E2E9`
- AssessmentRewards: `0xa246e627EAA83EE57434166669767613597D0691`

---

## 🚀 Execution Flow

### Assessment Flow with API

1. Frontend calls `POST /api/assessment/start`
2. API returns 50 domain-balanced questions
3. User completes assessment
4. Frontend calls `POST /api/assessment/submit` with answers
5. API calculates score and returns result
6. If passed, frontend calls `POST /api/assessment/claim`
7. API validates claim eligibility (score, daily limit)
8. API returns claim data for frontend to execute transaction

---

## 📊 Success Criteria

### API Routes
- [x] Assessment start API returns domain-balanced questions
- [x] Assessment submit API calculates correct scores
- [x] Claim validation API checks on-chain daily limits
- [x] Error handling for all edge cases
- [x] Integration with deployed smart contracts
- [x] Proper validation of all inputs

### Frontend Integration
- [x] Results page calls `/api/assessment/submit` instead of direct function
- [x] Results page has fallback to client-side calculation if API fails
- [x] Claim button calls `/api/assessment/claim` for validation
- [x] Claim button shows appropriate error messages
- [x] All API calls handle errors gracefully
- [x] User experience remains smooth with API integration

### Testing
- [x] API endpoints can be tested independently (see `PHASE_4_TESTING_GUIDE.md`)
- [x] Frontend integration works end-to-end
- [x] Fallback mechanisms work when API fails

---

## 🧪 Testing Strategy

### API Tests
- Test assessment start endpoint
- Test scoring calculation
- Test claim validation logic
- Test error cases (invalid data, contract errors)
- **See**: `PHASE_4_TESTING_GUIDE.md` for detailed testing instructions

### Frontend Integration Tests
- Verify results page calls API correctly
- Verify fallback works when API fails
- Verify claim button validates via API
- Test error handling and user feedback

### Integration Tests
- Full flow: start → submit → claim
- Contract integration tests
- Daily limit enforcement
- End-to-end user flow

### How to Test

**Quick Test**:
```bash
# Start dev server
cd apps/web && pnpm dev

# In another terminal, run test script
./scripts/test-api.sh
# or
node scripts/test-api.js
```

**Manual Test**:
1. Complete an assessment in the browser
2. View results (should use API for scoring)
3. Click "Claim Token" (should validate via API)
4. Check browser console for API calls

**Browser Console Test**:
```javascript
// Test submit API
const submit = await fetch('/api/assessment/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* your data */ })
}).then(r => r.json());
console.log(submit);

// Test claim API
const claim = await fetch('/api/assessment/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* your data */ })
}).then(r => r.json());
console.log(claim);
```

---

## ⏭️ Next Steps After Phase 4

Once Phase 4 is complete:
1. ✅ Test API endpoints end-to-end
2. ✅ Verify frontend integration works
3. ✅ Verify contract integration
4. Proceed to Phase 5: Wallet Integration (token claim flow)

---

## 📝 Implementation Checklist

### Phase 4 Tasks

**API Routes**:
- [x] Create `/api/assessment/start` route
- [x] Create `/api/assessment/submit` route
- [x] Create `/api/assessment/claim` route
- [x] Implement contract utilities in `lib/contracts.ts`
- [x] Add input validation with Zod schemas
- [x] Add error handling

**Frontend Integration**:
- [x] Update `results/page.tsx` to use `/api/assessment/submit`
- [x] Add fallback to client-side calculation in results page
- [x] Update `ClaimTokenButton.tsx` to use `/api/assessment/claim`
- [x] Add error handling and user feedback

**Testing & Documentation**:
- [x] Create testing guide (`PHASE_4_TESTING_GUIDE.md`)
- [x] Create test scripts (`scripts/test-api.sh`, `scripts/test-api.js`)
- [x] Update implementation documentation

---

**Status**: ✅ Complete  
**Last Updated**: 2025-01-24

**What Was Done**:
1. ✅ Created all 3 API routes (start, submit, claim)
2. ✅ Integrated API routes into frontend UI
3. ✅ Replaced native alert() with shadcn AlertDialog for better UX
4. ✅ Added comprehensive testing guide and scripts
5. ✅ Updated all documentation with clear expectations
3. ✅ Added fallback mechanisms for reliability
4. ✅ Created comprehensive testing guide and scripts
5. ✅ Updated documentation with clear expectations

