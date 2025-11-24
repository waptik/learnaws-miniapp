# Phase 2: Smart Contracts

## Implementation Plan

**Version**: 1.0\
**Status**: ✅ Complete\
**Last Updated**: 2025-11-24\
**Phase**: Smart Contracts (Week 1-2)

---

## 📚 Navigation

**Project Documentation**:

- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and
  implementation guide
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection &
  processing

**Technical Specifications**:

- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment
  results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference

---

## 📋 Overview

Phase 2 focuses on implementing smart contracts for token rewards. This includes
an ERC20 reward token contract and an assessment rewards contract that enforces
daily limits and validates claims.

---

## 🎯 Objectives

1. **AWSRewardToken Contract**: ERC20 token for rewards
2. **AssessmentRewards Contract**: Daily limits and claim validation
3. **Comprehensive Tests**: Unit tests for all contract functions
4. **Deployment Scripts**: Deploy to Celo Sepolia testnet
5. **Contract Verification**: Verify contracts on Celoscan

---

## 📁 File Structure

```
apps/contracts/
├── contracts/
│   ├── AWSRewardToken.sol          # ERC20 reward token
│   └── AssessmentRewards.sol        # Rewards and daily limits
├── test/
│   ├── AWSRewardToken.test.ts       # Token contract tests
│   └── AssessmentRewards.test.ts    # Rewards contract tests
├── ignition/
│   └── modules/
│       ├── AWSRewardToken.ts        # Token deployment
│       └── AssessmentRewards.ts       # Rewards deployment
└── hardhat.config.ts                # Hardhat configuration
```

---

## 🔧 Implementation Details

### 1. AWSRewardToken Contract

**Location**: `apps/contracts/contracts/AWSRewardToken.sol`

**Features**:

- ERC20 token using OpenZeppelin
- Mintable by authorized contracts/owner
- Standard ERC20 functionality

**Contract Structure**:

```solidity
contract AWSRewardToken is ERC20, Ownable {
    string public constant name = "AWS Practice Reward";
    string public constant symbol = "AWSP";
    uint8 public constant decimals = 18;
    
    // Minting function for rewards
    function mintReward(address to, uint256 amount) external onlyOwner;
}
```

**Key Functions**:

- `mintReward(address to, uint256 amount)`: Mint tokens to a user (owner only)
- Standard ERC20 functions inherited from OpenZeppelin

---

### 2. AssessmentRewards Contract

**Location**: `apps/contracts/contracts/AssessmentRewards.sol`

**Features**:

- Track daily claims per user
- Validate pass/fail eligibility (score >= 700)
- Mint tokens on successful claim
- Enforce daily limits (3 tokens max per day)
- Signature verification for score validation (future enhancement)

**Contract Structure**:

```solidity
contract AssessmentRewards is Ownable, ReentrancyGuard {
    AWSRewardToken public rewardToken;
    
    uint256 public constant TOKENS_PER_PASS = 1e18; // 1 token
    uint256 public constant MAX_DAILY_CLAIMS = 3;
    uint256 public constant PASSING_SCORE = 700; // 700/1000
    
    struct DailyClaim {
        uint256 count;
        uint256 lastClaimTimestamp;
    }
    
    mapping(address => mapping(uint256 => DailyClaim)) public dailyClaims;
    
    // Main claim function
    function claimReward(uint256 score, bytes32 assessmentId) 
        external 
        nonReentrant;
    
    // Check if user can claim
    function canClaim(address user) external view returns (bool);
    
    // Get today's claim count
    function getTodayClaimCount(address user) external view returns (uint256);
    
    // Get current day (UTC)
    function getCurrentDay() public view returns (uint256);
}
```

**Key Functions**:

- `claimReward(uint256 score, bytes32 assessmentId)`: Claim tokens for passing
  assessment
- `canClaim(address user)`: Check if user can claim (hasn't exceeded daily
  limit)
- `getTodayClaimCount(address user)`: Get number of claims today
- `getCurrentDay()`: Get current UTC day for daily tracking

**Security Features**:

- ReentrancyGuard protection
- Daily reset mechanism (UTC day)
- Score validation (must be >= 700)
- Daily limit enforcement (max 3 claims per day)

---

## 🚀 Execution Flow

### Deployment Process

The `AssessmentRewards.ts` deployment module handles everything automatically in
one command:

1. **Deploy Both Contracts** (single command)
   ```bash
   pnpm contracts:deploy:sepolia
   ```

   This single command:
   - Deploys `AWSRewardToken` contract
   - Deploys `AssessmentRewards` contract (with token address)
   - Transfers token ownership to `AssessmentRewards` contract (so it can mint
     tokens)

   **Alternative**: Deploy token separately if needed
   ```bash
   pnpm contracts:deploy:token:sepolia  # Deploy token only
   ```

2. **Verify contracts**
   ```bash
   pnpm contracts:verify
   ```

### Claim Flow

1. User completes assessment and passes (score >= 700)
2. Frontend calls `canClaim(userAddress)` to check eligibility
3. If eligible, frontend calls `claimReward(score, assessmentId)`
4. Contract validates:
   - Score >= 700
   - User hasn't exceeded daily limit (3 claims)
   - Current day tracking
5. Contract mints 1 token to user
6. Contract updates daily claim count

---

## 📊 Success Criteria

- [x] AWSRewardToken contract deployed successfully
      (0x9F88a4Cf7daDbd54b1A8c06B60a579d64C01E2E9)
- [x] AssessmentRewards contract deployed successfully
      (0xa246e627EAA83EE57434166669767613597D0691)
- [x] All tests passing (39/39 tests, 100% coverage)
- [x] Daily limit enforcement working correctly
- [x] Score validation working correctly
- [x] Contracts verified on Celoscan
- [x] Gas optimization acceptable (~567k for AssessmentRewards, ~662k for
      AWSRewardToken)

---

## 🧪 Testing Strategy

### Unit Tests

**AWSRewardToken Tests**:

- Token minting
- Token transfers
- Owner-only functions
- Token metadata

**AssessmentRewards Tests**:

- Successful claim (score >= 700)
- Failed claim (score < 700)
- Daily limit enforcement
- Multiple claims same day
- Daily reset mechanism
- Reentrancy protection

### Integration Tests

- Full claim flow
- Token minting integration
- Daily limit edge cases
- Multiple users claiming

---

## 🔐 Security Considerations

1. **Reentrancy Protection**: Use ReentrancyGuard
2. **Daily Limits**: Enforced on-chain (cannot be bypassed)
3. **Score Validation**: Must be >= 700 to claim
4. **Access Control**: Owner-only functions protected
5. **Gas Optimization**: Efficient storage patterns

---

## ⏭️ Next Steps After Phase 2

Once Phase 2 is complete and validated:

1. Deploy to Celo Sepolia testnet
2. Verify contracts on Celoscan
3. Test end-to-end claim flow
4. Proceed to Phase 3: Frontend - Assessment UI

---

**Status**: ✅ Complete\
**Next Action**: Phase 2 complete. Proceeded to Phase 3: Frontend - Assessment
UI
