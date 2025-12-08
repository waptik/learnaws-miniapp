# XP System Implementation Plan

**Status**: 📋 Planning Document  
**Last Updated**: 2025-01-27

## Overview

This document outlines how to implement an XP (Experience Points) system with leaderboards, separate from the existing token rewards system.

## Current State

- ✅ **Token Rewards**: Implemented via smart contracts (1 token per pass, max 3/day)
- ❌ **XP System**: Not implemented
- ❌ **Leaderboard**: Not implemented

## Proposed XP System Architecture

### 1. Database Schema

**Option A: On-Chain (Celo)**
- Store XP in a smart contract
- Pros: Decentralized, transparent, immutable
- Cons: Gas costs, slower reads, more complex queries

**Option B: Off-Chain (Database)**
- Store XP in a database (PostgreSQL/MongoDB)
- Pros: Fast queries, complex leaderboards, no gas costs
- Cons: Requires backend, centralized storage

**Recommended**: **Hybrid Approach**
- Store XP off-chain for performance
- Use smart contract events for verification/audit trail
- Periodic on-chain snapshots for transparency

### 2. XP Calculation Rules

```typescript
interface XPRules {
  // Base XP per assessment
  baseXP: {
    pass: 100,      // Passing assessment (score >= 700)
    fail: 10,       // Failing assessment (score < 700)
  };
  
  // Bonus multipliers
  bonuses: {
    perfectScore: 1.5,        // 1000/1000 score
    highScore: 1.2,           // 900-999 score
    firstAttempt: 1.1,        // First assessment of the day
    streak: 0.1,              // +10% per day streak (max 5 days = +50%)
  };
  
  // Daily limits
  dailyLimit: 500,            // Max XP per day
}
```

### 3. Database Schema (PostgreSQL Example)

```sql
-- User XP tracking
CREATE TABLE user_xp (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL UNIQUE,
  total_xp BIGINT NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_assessment_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- XP history/audit log
CREATE TABLE xp_transactions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  assessment_id VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  base_xp INTEGER NOT NULL,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL,
  transaction_hash VARCHAR(66), -- Optional: link to on-chain event
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard (materialized view or cache)
CREATE TABLE leaderboard (
  rank INTEGER NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  total_xp BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (rank, user_address)
);

-- Indexes
CREATE INDEX idx_user_xp_address ON user_xp(user_address);
CREATE INDEX idx_xp_transactions_address ON xp_transactions(user_address);
CREATE INDEX idx_xp_transactions_date ON xp_transactions(created_at);
```

### 4. API Endpoints

```typescript
// Get user XP
GET /api/xp/user/:address
Response: {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
}

// Get leaderboard
GET /api/xp/leaderboard?limit=100&offset=0
Response: {
  leaderboard: Array<{
    rank: number;
    address: string;
    totalXP: number;
    displayName?: string;
  }>;
  userRank?: number; // If authenticated
}

// Award XP (internal, called after assessment)
POST /api/xp/award
Body: {
  userAddress: string;
  assessmentId: string;
  score: number;
  passed: boolean;
}
```

### 5. Implementation Steps

#### Phase 1: Database Setup
1. Set up PostgreSQL database
2. Create schema (user_xp, xp_transactions, leaderboard tables)
3. Set up database connection in Next.js API routes

#### Phase 2: XP Calculation Service
1. Create `apps/web/src/lib/xp-calculator.ts`:
   ```typescript
   export function calculateXP(score: number, isFirstAttempt: boolean, streak: number): number
   export function getBonusMultiplier(score: number, streak: number): number
   ```

#### Phase 3: API Routes
1. Create `/api/xp/award` - Award XP after assessment completion
2. Create `/api/xp/user/:address` - Get user XP stats
3. Create `/api/xp/leaderboard` - Get leaderboard

#### Phase 4: Frontend Components
1. Create `apps/web/src/components/xp/XPDisplay.tsx` - Show user XP
2. Create `apps/web/src/components/xp/Leaderboard.tsx` - Leaderboard table
3. Create `apps/web/src/app/leaderboard/page.tsx` - Leaderboard page

#### Phase 5: Integration
1. Update assessment submission to award XP
2. Add XP display to user profile/navbar
3. Add leaderboard link to navigation

### 6. Smart Contract Events (Optional)

For transparency, emit events when XP is awarded:

```solidity
event XPAwarded(
  address indexed user,
  uint256 assessmentId,
  uint256 score,
  uint256 xpAwarded,
  uint256 totalXP
);
```

### 7. Caching Strategy

- **Leaderboard**: Cache top 100 for 5 minutes
- **User XP**: Cache for 1 minute
- Use Redis or in-memory cache

### 8. Security Considerations

- Validate assessment scores match on-chain results
- Prevent duplicate XP awards (check assessment_id)
- Rate limiting on XP award endpoint
- Verify user signatures for XP claims

## Alternative: On-Chain XP (Simpler but More Expensive)

If you want fully decentralized XP:

```solidity
contract XPTracker {
  mapping(address => uint256) public userXP;
  mapping(address => uint256) public currentStreak;
  
  function awardXP(address user, uint256 score, bool passed) external {
    // Calculate and award XP
    uint256 xp = calculateXP(score, passed);
    userXP[user] += xp;
    // Update streak...
  }
}
```

**Trade-offs**:
- ✅ Fully decentralized
- ❌ Gas costs for every XP update
- ❌ Complex leaderboard queries (would need off-chain indexing anyway)

## Recommended Approach

**Hybrid**: Off-chain database with on-chain verification events
- Fast leaderboards and queries
- Transparent via blockchain events
- Lower gas costs
- Can migrate to fully on-chain later if needed

## Estimated Effort

- **Database Setup**: 2-4 hours
- **XP Calculation Logic**: 4-6 hours
- **API Routes**: 6-8 hours
- **Frontend Components**: 8-12 hours
- **Integration & Testing**: 4-6 hours
- **Total**: ~24-36 hours





