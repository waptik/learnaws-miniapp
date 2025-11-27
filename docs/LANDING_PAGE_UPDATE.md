# Landing Page Update: Token Rewards Alignment

**Date**: 2025-01-27  
**Status**: ✅ Complete

## Overview

Updated the landing page "How to Play" section to accurately reflect the token-based reward system instead of the non-existent XP points system.

## Changes Made

### File: `apps/web/src/app/page.tsx`

**Step 2 - "Earn Tokens"** (previously "Earn XP Points"):
- **Title**: Changed from "Earn XP Points" to "Earn Tokens"
- **Description**: Updated from "Complete quizzes to earn XP points and climb the leaderboard rankings" to "Complete quizzes to earn reward tokens (1 token per passing assessment, max 3 per day)"

## Rationale

The application uses a **token-based reward system** implemented via smart contracts:
- 1 token per passing assessment (score >= 700/1000)
- Maximum 3 tokens per day per user
- Tokens are ERC20 tokens minted on the Celo blockchain
- No XP points system exists in the codebase

The previous copy mentioned "XP points" and "leaderboard rankings" which are not implemented features. This update aligns the landing page messaging with the actual reward mechanism.

## Related Documentation

- [PRD.md](./PRD.md) - Token Rewards section (lines 96-110)
- [PHASE_2_IMPLEMENTATION.md](./PHASE_2_IMPLEMENTATION.md) - Smart contracts implementation
- [AssessmentRewards.sol](../../apps/contracts/contracts/AssessmentRewards.sol) - Contract enforcing daily limits

## Future Considerations

If an XP/leaderboard system is desired, see [XP_SYSTEM_IMPLEMENTATION_PLAN.md](./XP_SYSTEM_IMPLEMENTATION_PLAN.md) for implementation approach.

