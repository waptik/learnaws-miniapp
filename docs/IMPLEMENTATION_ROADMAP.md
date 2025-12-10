# Implementation Roadmap

**Status**: 📋 Active Planning Document\
**Last Updated**: 2025-12-01\
**Current Phase**: Post-Phase 5 (Testing & Polish)

---

## 📋 Overview

This document outlines the implementation roadmap for the Learn AWS miniapp,
covering immediate fixes, MiniPay integration, testing, production readiness,
and future enhancements.

---

## 🎯 Phase 1: Immediate Fixes & Polish (1-2 days)

### Priority: High

#### 1.1 Fix Hydration Warning

**Issue**: React hydration error - `<div>` cannot be a descendant of `<p>`

**Tasks**:

- [ ] Locate components with invalid HTML nesting (likely ScoreDisplay or
      DomainBreakdown)
- [ ] Replace `<p>` tags with `<div>` or use proper semantic HTML
- [ ] Test SSR rendering to ensure no hydration errors
- [ ] Verify in production build

**Estimated Time**: 30 minutes

**Files to Check**:

- `apps/web/src/components/assessment/ScoreDisplay.tsx`
- `apps/web/src/components/assessment/DomainBreakdown.tsx`
- Any component rendering assessment results

---

#### 1.2 Verify Contract Deployment

**Issue**: Need to ensure contracts are properly deployed and initialized

**Tasks**:

- [ ] Create verification script to check contract state
- [ ] Verify token ownership is correctly transferred to AssessmentRewards
      contract
- [ ] Document deployment process and verification steps
- [ ] Add contract state checks to frontend (optional)

**Estimated Time**: 1-2 hours

**Script Location**: `apps/contracts/scripts/verify-deployment.ts`

**What to Verify**:

- AssessmentRewards contract is deployed
- AWSRewardToken contract is deployed
- Token ownership is transferred to AssessmentRewards
- Constants are correct (MAX_DAILY_CLAIMS, PASSING_SCORE, etc.)

---

#### 1.3 Error Handling Improvements

**Current State**: Basic error handling exists, but can be improved

**Tasks**:

- [ ] Add retry logic for failed transactions (with exponential backoff)
- [ ] Improve error messages for common failures:
  - Insufficient gas
  - Network errors
  - Contract revert reasons
- [ ] Handle network disconnections gracefully
- [ ] Add user-friendly error messages

**Estimated Time**: 2-3 hours

**Files to Update**:

- `apps/web/src/components/assessment/ClaimTokenButton.tsx`
- `apps/web/src/lib/contracts.ts`

---

## 🚀 Phase 2: MiniPay Integration (Deferred)

### Priority: Medium (Deferred - see considerations below)

**Status**: ⏸️ **Deferred - No implementation for now**

**📖 Full Analysis**: See
[MiniPay Implementation Report](./MINIPAY_IMPLEMENTATION_REPORT.md) for
comprehensive analysis based on Celo documentation.

**Important Consideration**: MiniPay only supports cUSD (not CELO), and cUSD is
on the Celo blockchain.

**Already Implemented**:

- ✅ `isMiniPay()` function exists in `apps/web/src/lib/wagmi.ts`
- ✅ Ethereum types are already declared (no TypeScript errors)
- ✅ Injected connector is already in connectors array
- ✅ Auto-connect for injected wallets is handled by ComposerKit UI

**Implementation Considerations**:

1. **Gas Fees**: MiniPay users need cUSD for gas fees (not CELO)
   - Current contracts use CELO for gas
   - Need to ensure users understand they need cUSD in MiniPay
   - May need to update gas fee messaging/UI

2. **Token Rewards**: Current reward token (AWSP) is separate from cUSD
   - Users receive AWSP tokens as rewards
   - cUSD is only for gas fees
   - This should work fine, but need to clarify in UI

3. **Network Compatibility**: cUSD is on Celo blockchain
   - Should work with existing Celo Sepolia/Celo mainnet setup
   - No network changes needed

4. **User Experience**:
   - Need to update faucet links/instructions for cUSD (not CELO)
   - May need different messaging for MiniPay users
   - Should test gas estimation with cUSD

**What's Needed When Implementing**:

- [ ] Update gas fee messaging to mention cUSD for MiniPay users
- [ ] Update faucet instructions (cUSD faucet, not CELO)
- [ ] Test gas estimation with cUSD
- [ ] Update UI to hide connect button in MiniPay
- [ ] Test full flow in MiniPay environment

**Decision**: Defer implementation until we have clarity on:

- Gas fee handling with cUSD
- User experience requirements
- Testing access to MiniPay environment

**Technical Notes**:

- cUSD is a stablecoin on Celo blockchain (1 cUSD ≈ $1 USD)
- CELO is the native token of Celo blockchain (used for gas fees normally)
- MiniPay uses cUSD for gas fees instead of CELO
- Contracts should work the same (both tokens on Celo blockchain)
- Main consideration is user messaging and gas fee instructions

---

### 2.1 Update Connect Button for MiniPay (When Implementing)

**File**: `apps/web/src/components/connect-button.tsx`

**Tasks**:

- [ ] Import `isMiniPay` from `@/lib/wagmi`
- [ ] Hide connect button when in MiniPay (since auto-connect is handled)
- [ ] Test UI changes

**Implementation**:

```typescript
import { isMiniPay } from "@/lib/wagmi";

export function WalletConnectButton() {
  const isInMiniPay = isMiniPay();

  // Hide connect button in MiniPay (auto-connected by ComposerKit UI)
  if (isInMiniPay) {
    return null;
  }

  // ... rest of component
}
```

**Estimated Time**: 15 minutes

---

### 2.2 Optional: Update Navbar (if needed)

**File**: `apps/web/src/components/navbar.tsx` (if connect button is shown
there)

**Tasks**:

- [ ] Check if navbar shows connect button
- [ ] Apply same MiniPay detection if needed
- [ ] Test UI changes

**Estimated Time**: 15 minutes (if needed)

---

### 2.3 Testing MiniPay Integration (When Implementing)

**Tasks**:

- [ ] Enable Developer Mode in MiniPay app
- [ ] Deploy to publicly accessible URL (Vercel/Netlify)
- [ ] Load URL in MiniPay's developer settings
- [ ] Test auto-connect functionality
- [ ] Test transaction flow (claim tokens) with cUSD for gas
- [ ] Verify gas estimation works with cUSD
- [ ] Verify error handling works
- [ ] Test faucet instructions for cUSD (not CELO)

**Estimated Time**: 2-3 hours (mostly device testing)

**Testing Checklist**:

- [ ] MiniPay detection works (`isMiniPay()` returns true in MiniPay)
- [ ] Auto-connect works (handled by ComposerKit UI automatically)
- [ ] Connect button is hidden in MiniPay
- [ ] Wallet balance displays correctly (cUSD balance)
- [ ] Transactions work in MiniPay with cUSD for gas
- [ ] Gas fee messaging is correct (mentions cUSD, not CELO)
- [ ] Faucet instructions are correct for cUSD
- [ ] Works on both testnet and mainnet
- [ ] Fallback to manual connect works for other wallets

**Note**: Since auto-connect is handled by ComposerKit UI, we mainly need to
verify it works, hide the connect button, and ensure gas fee messaging is
correct for cUSD.

---

## 🧪 Phase 3: Testing & Quality Assurance (3-5 days)

### Priority: High (Before production)

### 3.1 End-to-End Testing

**Test Scenarios**:

- [ ] Full assessment flow (start → answer → submit → claim)
- [ ] Multiple wallet scenarios:
  - Farcaster MiniApp wallet
  - MiniPay wallet
  - MetaMask/browser extension
- [ ] Error scenarios:
  - Network failures
  - Transaction rejections
  - Insufficient gas
  - Wrong network
- [ ] Edge cases:
  - Daily claim limit reached
  - Score below passing threshold
  - Wallet disconnection during assessment

**Estimated Time**: 1-2 days

**Test Plan Location**: `docs/TESTING_PLAN.md` (to be created)

---

### 3.2 Performance Optimization

**Tasks**:

- [ ] Optimize question loading (lazy load, pagination)
- [ ] Reduce bundle size (code splitting, tree shaking)
- [ ] Add loading skeletons for better UX
- [ ] Optimize images and assets
- [ ] Implement caching strategies

**Estimated Time**: 1 day

**Metrics to Track**:

- Initial page load time (< 2s target)
- Time to interactive
- Bundle size
- Lighthouse scores

---

### 3.3 Security Audit

**Areas to Review**:

- [ ] Smart contract interactions (reentrancy, overflow, etc.)
- [ ] Input validation (all user inputs)
- [ ] API route security (rate limiting, validation)
- [ ] Wallet connection security
- [ ] XSS/CSRF protection

**Estimated Time**: 1 day

**Already Implemented**:

- ✅ ReentrancyGuard in smart contracts
- ✅ Input validation with Zod schemas
- ✅ Score validation before claims

**To Add**:

- [ ] Rate limiting on API routes
- [ ] Additional input sanitization
- [ ] Security headers

---

### 3.4 Documentation

**Tasks**:

- [ ] Update README with deployment steps
- [ ] Document all environment variables
- [ ] Create troubleshooting guide
- [ ] Document API endpoints
- [ ] Add code comments where needed

**Estimated Time**: 1 day

**Documents to Create/Update**:

- `README.md` - Main project documentation
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `docs/API_REFERENCE.md` - API endpoint documentation

---

## 🚢 Phase 4: Production Readiness (2-3 days)

### Priority: High (Required for launch)

### 4.1 Environment Configuration

**Tasks**:

- [ ] Set up production environment variables
- [ ] Configure production chain (Celo mainnet)
- [ ] Set up monitoring and logging (Sentry, Vercel Analytics)
- [ ] Configure error tracking
- [ ] Set up analytics (optional)

**Estimated Time**: 1 day

**Environment Variables to Configure**:

- `NEXT_PUBLIC_CHAIN=celo` (mainnet)
- `NEXT_PUBLIC_VERCEL_ENV=production`
- Contract addresses (mainnet)
- API keys for monitoring services

---

### 4.2 Deployment

**Tasks**:

- [ ] Deploy contracts to Celo mainnet
- [ ] Verify contracts on Celoscan
- [ ] Deploy frontend to production (Vercel)
- [ ] Update Farcaster MiniApp URL
- [ ] Test all functionality in production

**Estimated Time**: 1 day

**Deployment Checklist**:

- [ ] Contracts deployed to mainnet
- [ ] Contracts verified on block explorer
- [ ] Frontend deployed to production
- [ ] Environment variables configured
- [ ] All features tested in production
- [ ] Monitoring set up and working

---

### 4.3 Monitoring & Maintenance

**Tasks**:

- [ ] Set up error tracking (Sentry)
- [ ] Add analytics for user behavior
- [ ] Monitor transaction success rates
- [ ] Set up alerts for critical errors
- [ ] Create runbook for common issues

**Estimated Time**: 1 day

**Metrics to Monitor**:

- Transaction success rate
- API error rates
- User engagement metrics
- Performance metrics
- Contract interaction success rates

---

## 🔮 Phase 5: Future Enhancements (Optional)

### Priority: Low (Post-launch)

### 5.1 XP System

**Status**: Planned (see `docs/XP_SYSTEM_IMPLEMENTATION_PLAN.md`)

**Features**:

- XP tracking for assessments
- Leaderboard
- Streak tracking
- Achievements

**Estimated Time**: 1-2 weeks

**Decision**: Defer to post-launch

---

### 5.2 Additional Features

**Potential Features**:

- [ ] More courses/certifications
- [ ] Social features (sharing results)
- [ ] Achievement system
- [ ] Study mode (practice without scoring)
- [ ] Question explanations
- [ ] Progress tracking over time

**Estimated Time**: Varies by feature

---

## 📅 Recommended Timeline

### Week 1: Immediate Fixes

- **Day 1-2**: Fix hydration warning, verify contracts, improve error handling
- **Day 3**: Error handling improvements, contract verification
- **Note**: MiniPay integration deferred (see Phase 2 considerations)

### Week 2: Testing & Polish

- **Day 1-3**: End-to-end testing, fix any bugs found
- **Day 4-5**: Performance optimization, security review

### Week 3: Production Deployment

- **Day 1-2**: Production setup and configuration
- **Day 3**: Deploy and verify
- **Day 4-5**: Monitor and fix any production issues

---

## 🎯 Quick Wins (Can Do Now)

These are small tasks that provide immediate value:

1. **Fix Hydration Warning** (30 min)
   - High impact, low effort
   - Improves SSR stability

2. **Add Contract State Verification** (1 hour)
   - Helps debug deployment issues
   - Provides confidence in contract state

3. **Improve Error Messages** (1 hour)
   - Better user experience
   - Easier debugging

4. **Add Transaction Retry Logic** (2 hours)
   - Handles transient network failures
   - Improves success rate

---

## 🔍 Decision Points

### 1. MiniPay Integration: Now or Later?

**Recommendation**: **Defer**

- **Reason**: MiniPay only supports cUSD (not CELO) for gas fees
- **Considerations**:
  - Need to update gas fee messaging/instructions for cUSD
  - Need to test gas estimation with cUSD
  - Need access to MiniPay environment for testing
  - Current setup uses CELO terminology
- **When to Implement**: After clarifying gas fee handling and testing
  requirements
- **Effort**: Low (30 min - 1 hour) once requirements are clear
- **Value**: High for mobile users, but can be added post-launch

### 2. XP System: Implement Now or Defer?

**Recommendation**: **Defer**

- Focus on core functionality first
- Can be added post-launch
- Requires database setup
- Not critical for MVP

### 3. Database Migration: When?

**Recommendation**: **When XP System is Needed**

- Current JSON storage is sufficient for MVP
- Database needed for XP, leaderboards, analytics
- Can migrate incrementally

---

## 📊 Success Metrics

### Technical Metrics

- [ ] Zero hydration errors
- [ ] < 2s page load time
- [ ] 95% transaction success rate
- [ ] Zero critical security vulnerabilities

### User Experience Metrics

- [ ] Smooth wallet connection flow
- [ ] Clear error messages
- [ ] Fast claim process
- [ ] Works across all wallet types

### Business Metrics

- [ ] User engagement (assessments completed)
- [ ] Token claims per day
- [ ] User retention
- [ ] Error rates

---

## 📝 Notes

- **Current State**: Core functionality is complete (Phases 1-5)
- **Next Priority**: Fix immediate issues, then MiniPay integration
- **Production Target**: After Phase 4 completion
- **Future Work**: XP system and additional features can be added post-launch

---

## 🔗 Related Documents

- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture
- [MiniPay Implementation Report](./MINIPAY_IMPLEMENTATION_REPORT.md) -
  Comprehensive implementation analysis based on Celo docs
- [MiniPay Integration Analysis](../minipay-demo/MINIPAY_INTEGRATION_ANALYSIS.md) -
  Reference implementation analysis
- [XP System Plan](./XP_SYSTEM_IMPLEMENTATION_PLAN.md) - Future XP system design
- [Phase 5 Implementation](./PHASE_5_IMPLEMENTATION.md) - Wallet integration
  details

---

**Last Updated**: 2025-12-01\
**Status**: Active Planning
