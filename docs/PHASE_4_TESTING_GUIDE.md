# Phase 4: API Testing Guide

**Version**: 1.0\
**Last Updated**: 2025-01-24

---

## 🧪 Testing Overview

This guide covers testing the Phase 4 API routes for assessment scoring and
validation.

**⚠️ Important**: Phase 4 includes **both** API route creation **and** frontend
integration. After creating the API routes, you must update the frontend UI
components to use them. See `PHASE_4_IMPLEMENTATION.md` for integration details.

---

## 📋 Prerequisites

1. **Development server running**:
   ```bash
   cd apps/web
   pnpm dev
   ```
   Server should be running on `http://localhost:3000`

2. **Environment variables** (if needed for contract interaction):
   - Ensure `.env.local` has any required RPC URLs

3. **Test data**:
   - Questions JSON file exists at `public/data/questions.json`

---

## 🚀 Manual Testing

### 1. Test Assessment Start API

**Endpoint**: `POST /api/assessment/start`

**Using curl**:

```bash
curl -X POST http://localhost:3000/api/assessment/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:

```json
{
  "assessmentId": "assessment-1234567890-abc123",
  "questions": [
    {
      "id": "...",
      "text": "...",
      "type": "multiple-choice",
      "options": [...],
      "correctAnswer": "A",
      "domain": 1,
      ...
    },
    ...
  ]
}
```

**Validation**:

- ✅ Returns 200 status
- ✅ `assessmentId` is a valid string
- ✅ `questions` array has exactly 50 questions
- ✅ Questions include all 4 domains
- ✅ Domain distribution matches weights (24%, 30%, 34%, 12%)

---

### 2. Test Assessment Submit API

**Endpoint**: `POST /api/assessment/submit`

**Using curl** (with sample data):

```bash
curl -X POST http://localhost:3000/api/assessment/submit \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "assessment-1234567890-abc123",
    "candidateAddress": "0x1234567890123456789012345678901234567890",
    "questions": [
      {
        "id": "q1",
        "text": "Test question?",
        "type": "multiple-choice",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "domain": 1
      }
    ],
    "answers": [
      {
        "questionId": "q1",
        "selected": "A"
      }
    ]
  }'
```

**Expected Response**:

```json
{
  "result": {
    "candidateAddress": "0x1234...",
    "examDate": "2025-01-24T...",
    "scaledScore": 1000,
    "passFail": "PASS",
    "passingScore": 700,
    "domainPerformance": [
      {
        "domain": 1,
        "domainName": "Cloud Concepts",
        "percentage": 24,
        "correct": 1,
        "total": 1,
        "competency": "MEETS"
      },
      ...
    ],
    "totalQuestions": 1,
    "correctAnswers": 1,
    "assessmentId": "assessment-1234567890-abc123"
  }
}
```

**Validation**:

- ✅ Returns 200 status
- ✅ Score calculation is correct
- ✅ Pass/Fail determination is correct (700+ = PASS)
- ✅ Domain performance calculated for all 4 domains
- ✅ Error handling for invalid data (400 status)

**Test Cases**:

1. **Perfect score**: All answers correct → Score 1000, PASS
2. **Passing score**: 70% correct → Score 700+, PASS
3. **Failing score**: <70% correct → Score <700, FAIL
4. **Multiple response**: Test with multiple-response questions
5. **Invalid data**: Missing fields → 400 error
6. **Mismatched arrays**: Different lengths → 400 error

---

### 3. Test Claim Validation API

**Endpoint**: `POST /api/assessment/claim`

**Prerequisites**:

- Need a valid wallet address
- Contract must be deployed and accessible
- RPC endpoint must be configured

**Using curl**:

```bash
curl -X POST http://localhost:3000/api/assessment/claim \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "assessment-1234567890-abc123",
    "candidateAddress": "0x1234567890123456789012345678901234567890",
    "score": 750
  }'
```

**Expected Response (Can Claim)**:

```json
{
    "canClaim": true,
    "dailyCount": 0,
    "maxDailyClaims": 3,
    "claimData": {
        "assessmentId": "assessment-1234567890-abc123",
        "assessmentIdHash": "...",
        "score": 750,
        "candidateAddress": "0x1234..."
    }
}
```

**Expected Response (Cannot Claim - Low Score)**:

```json
{
    "canClaim": false,
    "reason": "Score is below passing threshold",
    "passingScore": 700,
    "score": 650
}
```

**Expected Response (Cannot Claim - Daily Limit)**:

```json
{
    "canClaim": false,
    "reason": "Daily claim limit exceeded",
    "dailyCount": 3,
    "maxDailyClaims": 3
}
```

**Validation**:

- ✅ Returns 200 status
- ✅ Validates score >= 700
- ✅ Checks on-chain daily limit
- ✅ Returns proper error messages
- ✅ Handles contract errors gracefully

**Test Cases**:

1. **Valid claim**: Score 750, under daily limit → `canClaim: true`
2. **Low score**: Score 650 → `canClaim: false`, reason provided
3. **Daily limit**: 3 claims already made → `canClaim: false`
4. **Invalid address**: Malformed address → 400 error
5. **Contract error**: Network/RPC issues → 500 error with fallback

---

## 🧪 Automated Testing

### Using Postman/Insomnia

1. **Import Collection**: Create a collection with all 3 endpoints
2. **Environment Variables**: Set `baseUrl` to `http://localhost:3000`
3. **Test Scripts**: Add assertions for response validation

### Using Jest/Testing Library

Create test files:

**`apps/web/src/app/api/assessment/start/route.test.ts`**:

```typescript
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("/api/assessment/start", () => {
    it("should return assessment with 50 questions", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/assessment/start",
            {
                method: "POST",
            },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.assessmentId).toBeDefined();
        expect(data.questions).toHaveLength(50);
    });
});
```

---

## 🔍 Frontend Integration Testing

### Test from Browser Console

1. **Start Assessment**:

```javascript
const startResponse = await fetch("/api/assessment/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
});
const startData = await startResponse.json();
console.log("Assessment started:", startData);
```

2. **Submit Assessment** (with sample answers):

```javascript
const submitResponse = await fetch("/api/assessment/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        assessmentId: startData.assessmentId,
        candidateAddress: "0x1234...",
        questions: startData.questions,
        answers: startData.questions.map((q) => ({
            questionId: q.id,
            selected: q.correctAnswer,
        })),
    }),
});
const submitData = await submitResponse.json();
console.log("Assessment submitted:", submitData);
```

3. **Validate Claim**:

```javascript
const claimResponse = await fetch("/api/assessment/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        assessmentId: startData.assessmentId,
        candidateAddress: "0x1234...",
        score: submitData.result.scaledScore,
    }),
});
const claimData = await claimResponse.json();
console.log("Claim validation:", claimData);
```

---

## 🐛 Debugging Tips

### 1. Check Server Logs

- Look for console.error messages
- Check Next.js dev server output

### 2. Network Tab

- Open browser DevTools → Network
- Filter by "api"
- Inspect request/response payloads

### 3. Contract Interaction Issues

- Verify RPC endpoint is accessible
- Check contract addresses are correct
- Test contract calls directly with viem

### 4. Common Issues

**Issue**: "Failed to load questions"

- **Fix**: Check `public/data/questions.json` exists
- **Fix**: Verify file is accessible

**Issue**: "Contract read failed"

- **Fix**: Check RPC endpoint in environment
- **Fix**: Verify contract addresses
- **Fix**: Check network connectivity

**Issue**: "Invalid request data"

- **Fix**: Check request body matches schema
- **Fix**: Verify Content-Type header

---

## ✅ Test Checklist

### Assessment Start API

- [ ] Returns 50 questions
- [ ] Questions include all 4 domains
- [ ] Domain distribution is correct
- [ ] Assessment ID is unique
- [ ] Error handling works

### Assessment Submit API

- [ ] Calculates score correctly
- [ ] Determines Pass/Fail correctly
- [ ] Calculates domain performance
- [ ] Handles multiple-choice questions
- [ ] Handles multiple-response questions
- [ ] Validates input data
- [ ] Returns proper errors

### Claim Validation API

- [ ] Validates passing score
- [ ] Checks daily limit on-chain
- [ ] Returns claim data when eligible
- [ ] Returns proper error messages
- [ ] Handles contract errors gracefully
- [ ] Works with real wallet addresses

---

## 🚀 Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Starting assessment..."
START_RESPONSE=$(curl -s -X POST $BASE_URL/api/assessment/start \
  -H "Content-Type: application/json")
echo $START_RESPONSE | jq '.assessmentId'

ASSESSMENT_ID=$(echo $START_RESPONSE | jq -r '.assessmentId')
QUESTIONS=$(echo $START_RESPONSE | jq '.questions')

echo "\n2. Submitting assessment..."
# Create perfect answers
ANSWERS=$(echo $QUESTIONS | jq 'map({
  questionId: .id,
  selected: .correctAnswer
})')

SUBMIT_RESPONSE=$(curl -s -X POST $BASE_URL/api/assessment/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"assessmentId\": \"$ASSESSMENT_ID\",
    \"candidateAddress\": \"0x1234567890123456789012345678901234567890\",
    \"questions\": $QUESTIONS,
    \"answers\": $ANSWERS
  }")
echo $SUBMIT_RESPONSE | jq '.result.scaledScore, .result.passFail'

SCORE=$(echo $SUBMIT_RESPONSE | jq -r '.result.scaledScore')

echo "\n3. Validating claim..."
curl -s -X POST $BASE_URL/api/assessment/claim \
  -H "Content-Type: application/json" \
  -d "{
    \"assessmentId\": \"$ASSESSMENT_ID\",
    \"candidateAddress\": \"0x1234567890123456789012345678901234567890\",
    \"score\": $SCORE
  }" | jq '.'
```

Make it executable and run:

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Verifying Frontend Integration

After API routes are created, verify the frontend is using them:

### 1. Check Results Page Integration

1. Complete an assessment in the browser
2. Open DevTools → Network tab
3. Navigate to results page
4. **Expected**: See a `POST /api/assessment/submit` request
5. **Verify**: Response contains `result` object with score

### 2. Check Claim Button Integration

1. On results page, click "Claim Token" button
2. Open DevTools → Network tab
3. **Expected**: See a `POST /api/assessment/claim` request
4. **Verify**: Response contains `canClaim` boolean

### 3. Test Error Handling

1. Temporarily break an API route (comment out code)
2. Try to use the feature
3. **Expected**: UI shows error message or falls back gracefully
4. **Verify**: User experience isn't completely broken

### 4. Verify Fallback Works

1. Stop the dev server
2. Try to view results (if cached)
3. **Expected**: Results page falls back to client-side calculation
4. **Verify**: User can still see results

---

**Status**: Ready for Testing\
**Next**: Test all endpoints and verify frontend integration
