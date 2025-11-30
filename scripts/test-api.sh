#!/bin/bash

# Phase 4 API Testing Script
# Make sure the dev server is running: pnpm dev

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 Testing Phase 4 API Routes"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Start Assessment
echo "1️⃣  Testing POST /api/assessment/start..."
START_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assessment/start" \
  -H "Content-Type: application/json")

if echo "$START_RESPONSE" | jq -e '.assessmentId' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Assessment started successfully${NC}"
  ASSESSMENT_ID=$(echo "$START_RESPONSE" | jq -r '.assessmentId')
  QUESTION_COUNT=$(echo "$START_RESPONSE" | jq '.questions | length')
  echo "   Assessment ID: $ASSESSMENT_ID"
  echo "   Questions: $QUESTION_COUNT"
  
  # Check domain distribution
  echo "   Domain distribution:"
  echo "$START_RESPONSE" | jq -r '.questions | group_by(.domain) | map({domain: .[0].domain, count: length}) | .[]' | while read line; do
    echo "   $line"
  done
else
  echo -e "${RED}❌ Failed to start assessment${NC}"
  echo "$START_RESPONSE" | jq '.'
  exit 1
fi

echo ""

# Test 2: Submit Assessment
echo "2️⃣  Testing POST /api/assessment/submit..."

# Create perfect answers (all correct)
QUESTIONS=$(echo "$START_RESPONSE" | jq '.questions')
ANSWERS=$(echo "$QUESTIONS" | jq 'map({
  questionId: .id,
  selected: .correctAnswer
})')

SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assessment/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"assessmentId\": \"$ASSESSMENT_ID\",
    \"candidateAddress\": \"0x1234567890123456789012345678901234567890\",
    \"questions\": $QUESTIONS,
    \"answers\": $ANSWERS
  }")

if echo "$SUBMIT_RESPONSE" | jq -e '.result.scaledScore' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Assessment submitted successfully${NC}"
  SCORE=$(echo "$SUBMIT_RESPONSE" | jq -r '.result.scaledScore')
  PASS_FAIL=$(echo "$SUBMIT_RESPONSE" | jq -r '.result.passFail')
  CORRECT=$(echo "$SUBMIT_RESPONSE" | jq -r '.result.correctAnswers')
  TOTAL=$(echo "$SUBMIT_RESPONSE" | jq -r '.result.totalQuestions')
  echo "   Score: $SCORE"
  echo "   Status: $PASS_FAIL"
  echo "   Correct: $CORRECT/$TOTAL"
else
  echo -e "${RED}❌ Failed to submit assessment${NC}"
  echo "$SUBMIT_RESPONSE" | jq '.'
  exit 1
fi

echo ""

# Test 3: Validate Claim
echo "3️⃣  Testing POST /api/assessment/claim..."
CLAIM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assessment/claim" \
  -H "Content-Type: application/json" \
  -d "{
    \"assessmentId\": \"$ASSESSMENT_ID\",
    \"candidateAddress\": \"0x1234567890123456789012345678901234567890\",
    \"score\": $SCORE
  }")

if echo "$CLAIM_RESPONSE" | jq -e '.canClaim' > /dev/null 2>&1; then
  CAN_CLAIM=$(echo "$CLAIM_RESPONSE" | jq -r '.canClaim')
  if [ "$CAN_CLAIM" = "true" ]; then
    echo -e "${GREEN}✅ Claim validation successful${NC}"
    echo "$CLAIM_RESPONSE" | jq '.claimData'
  else
    echo -e "${YELLOW}⚠️  Cannot claim (expected for test)${NC}"
    echo "$CLAIM_RESPONSE" | jq '.reason'
  fi
else
  echo -e "${RED}❌ Failed to validate claim${NC}"
  echo "$CLAIM_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All API tests completed!${NC}"




