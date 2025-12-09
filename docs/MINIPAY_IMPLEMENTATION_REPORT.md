# MiniPay Implementation Report

**Status**: 📋 Analysis Complete - Implementation Deferred\
**Last Updated**: 2025-12-01\
**Based On**:
[Celo MiniPay Documentation](https://docs.celo.org/build-on-celo/build-on-minipay/overview)

---

## 📋 Executive Summary

This report analyzes Celo's MiniPay integration documentation and provides a
comprehensive implementation plan for integrating MiniPay into the Learn AWS
miniapp. **Implementation is currently deferred** due to cUSD-specific
considerations, but all technical requirements and steps are documented for
future implementation.

---

## 🎯 What is MiniPay?

According to the
[Celo documentation](https://docs.celo.org/build-on-celo/build-on-minipay/overview),
MiniPay is:

- **A stablecoin wallet** with built-in Mini App discovery page
- **Integrated in Opera Mini** Android browser and available as standalone app
  (Android/iOS)
- **Fastest growing non-custodial wallet** in Global South (25% of new USDT
  addresses in Q4 2024, 5M+ activations)
- **10 Million activated addresses** with access to Opera's large user base

### Key Features

1. **Phone Number Mapping**: Uses mobile phone numbers as wallet addresses
2. **Fast, Low-Cost Transactions**: Sub-cent fees for P2P stablecoin
   transactions
3. **Lightweight Design**: Only 2MB, works with limited data
4. **Built-in App Discovery**: Users can discover and interact with Mini Apps
   directly within the wallet

---

## 🔍 Technical Requirements from Documentation

### 1. Fee Currency Support

**Critical Constraint**: MiniPay currently **only supports cUSD** for gas fees
(not CELO)

- When running `eth_sendTransaction`, must set `feeCurrency` property to `cUSD`
- More currencies may be supported in the future
- **Impact**: Need to ensure transaction requests specify cUSD as fee currency

**Source**:
[Celo MiniPay Quickstart](https://docs.celo.org/build/build-on-minipay/quickstart)

### 2. Transaction Type

**Constraint**: MiniPay only accepts **legacy transactions** (not EIP-1559)

- EIP-1559 properties won't be considered when handling requests
- Must use legacy transaction format
- **Impact**: Need to ensure Wagmi/Viem uses legacy transaction format for
  MiniPay

**Source**:
[Celo MiniPay Quickstart](https://docs.celo.org/build/build-on-minipay/quickstart)

### 3. Network Support

- **Mainnet**: Celo mainnet
- **Testnet**: Celo Sepolia L2 (via Developer Mode)
- **Note**: Uses Celo Sepolia L2 (not Alfajores) for testnet

### 4. Detection

MiniPay injects `window.ethereum` with `isMiniPay` flag:

```typescript
window.ethereum?.isMiniPay === true;
```

---

## 🏗️ Current Project State

### ✅ Already Implemented

1. **MiniPay Detection Function**
   - Location: `apps/web/src/lib/wagmi.ts`
   - Function: `isMiniPay()` - returns boolean
   - Status: ✅ Working

2. **Ethereum Types**
   - Location: `apps/web/src/types/global.d.ts`
   - Includes: `isMiniPay?: boolean` in Window.ethereum interface
   - Status: ✅ Complete

3. **Injected Connector**
   - Location: `apps/web/src/lib/wagmi.ts`
   - Connector: `injected()` from `@wagmi/connectors`
   - Status: ✅ Already in connectors array

4. **Auto-Connect Infrastructure**
   - ComposerKit UI (RainbowKit wrapper) handles auto-connect for injected
     wallets
   - Status: ✅ Infrastructure ready

5. **Network Configuration**
   - Supports Celo Sepolia (testnet) - matches MiniPay testnet
   - Supports Celo mainnet - matches MiniPay mainnet
   - Status: ✅ Compatible

### ⚠️ Missing/Needed

1. **Fee Currency Configuration**
   - Need to set `feeCurrency: 'cUSD'` in transaction requests
   - Current implementation doesn't specify fee currency

2. **Transaction Format**
   - Need to ensure legacy transaction format (not EIP-1559)
   - Current Wagmi config may default to EIP-1559

3. **UI Adaptation**
   - Hide connect button when in MiniPay
   - Update gas fee messaging for cUSD (not CELO)
   - Update faucet instructions for cUSD

4. **Testing Setup**
   - Need access to MiniPay app for testing
   - Need to set up Developer Mode
   - Need publicly accessible URL for testing

---

## 📝 Implementation Plan

### Phase 1: Transaction Configuration (Required)

#### 1.1 Configure Fee Currency for MiniPay

**File**: `apps/web/src/lib/wagmi.ts` or transaction call sites

**Implementation**:

```typescript
// When in MiniPay, transactions must use cUSD for fees
import { isMiniPay } from "@/lib/wagmi";

// In transaction calls (e.g., ClaimTokenButton)
const isInMiniPay = isMiniPay();

writeContract({
    address: ASSESSMENT_REWARDS_ADDRESS,
    abi: ASSESSMENT_REWARDS_ABI,
    functionName: "claimReward",
    args: [BigInt(score), assessmentIdBytes32, courseCode],
    // Add fee currency for MiniPay
    ...(isInMiniPay && {
        feeCurrency: "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD address on Celo
    }),
});
```

**Alternative**: Configure at Wagmi config level if possible

**Tasks**:

- [ ] Research Wagmi/Viem support for feeCurrency parameter
- [ ] Add feeCurrency to transaction calls when in MiniPay
- [ ] Test transaction submission with cUSD fee currency

**Estimated Time**: 2-3 hours

---

#### 1.2 Ensure Legacy Transaction Format

**File**: `apps/web/src/lib/wagmi.ts`

**Implementation**:

```typescript
// Wagmi config may need adjustment for legacy transactions
export const wagmiConfig = createConfig({
    chains: [celo, celoSepolia],
    connectors,
    transports: {
        [celo.id]: http(),
        [celoSepolia.id]: http(),
    },
    // May need to configure for legacy transactions in MiniPay
});
```

**Tasks**:

- [ ] Research Wagmi configuration for legacy transactions
- [ ] Test if current config works with MiniPay (legacy format)
- [ ] Adjust if needed to force legacy format when in MiniPay

**Estimated Time**: 1-2 hours

**Note**: Wagmi/Viem may automatically handle this, but needs verification

---

### Phase 2: UI Adaptation

#### 2.1 Hide Connect Button in MiniPay

**File**: `apps/web/src/components/connect-button.tsx`

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

**Tasks**:

- [ ] Import `isMiniPay` from `@/lib/wagmi`
- [ ] Add early return when in MiniPay
- [ ] Test UI in different environments

**Estimated Time**: 15 minutes

---

#### 2.2 Update Gas Fee Messaging

**File**: `apps/web/src/components/assessment/ClaimTokenButton.tsx`

**Current**: Shows "You'll need CELO tokens on Celo Sepolia Testnet"

**Update to**: Show cUSD for MiniPay users, CELO for others

**Implementation**:

```typescript
import { isMiniPay } from "@/lib/wagmi";

const isInMiniPay = isMiniPay();
const gasToken = isInMiniPay ? "cUSD" : "CELO";
const faucetUrl = isInMiniPay
    ? "https://faucet.celo.org/celo-sepolia" // Update to cUSD faucet
    : "https://faucet.celo.org/celo-sepolia";

// Update messaging
<p>
    <strong>Note:</strong> You'll need <strong>{gasToken}</strong> tokens on
    {" "}
    {selectedChain.name} to pay for gas fees.
</p>;
```

**Tasks**:

- [ ] Detect MiniPay environment
- [ ] Update gas token messaging (cUSD vs CELO)
- [ ] Update faucet link/instructions for cUSD
- [ ] Test messaging in different environments

**Estimated Time**: 30 minutes

---

#### 2.3 Update Faucet Instructions

**File**: `apps/web/src/components/assessment/ClaimTokenButton.tsx`

**Current**: Links to CELO faucet

**Update**: Provide cUSD faucet instructions for MiniPay users

**Tasks**:

- [ ] Find cUSD faucet URL for Celo Sepolia
- [ ] Update faucet link when in MiniPay
- [ ] Update instructions text for cUSD
- [ ] Test faucet links

**Estimated Time**: 30 minutes

---

### Phase 3: Testing & Validation

#### 3.1 Setup Testing Environment

**Steps** (from
[Celo Documentation](https://docs.celo.org/build/build-on-minipay/quickstart)):

1. **Install MiniPay**:
   - Download from
     [Google Play](https://play.google.com/store/apps/details?id=com.minipay.app)
     or
     [App Store](https://apps.apple.com/app/minipay-stablecoin-wallet/id1234567890)
   - Create account using Google account and phone number

2. **Enable Developer Mode**:
   - Open MiniPay app
   - Navigate to **Settings** > **About**
   - Tap version number multiple times until developer options enabled
   - Return to **Settings** > **Developer Settings**
   - Enable **Developer Mode**
   - Toggle **Use Testnet** to connect to Sepolia L2 testnet

3. **Get Testnet Tokens**:
   - Request CELO testnet tokens from [Celo faucet](https://faucet.celo.org/)
   - Exchange CELO for cUSD using [Mento app](https://mento.org/)
   - **Note**: For MiniPay, need cUSD (not CELO) for gas fees

4. **Deploy for Testing**:
   - Deploy to publicly accessible URL (Vercel, Netlify)
   - Or use tunneling service (ngrok, Cloudflare Tunnel) for localhost
   - Load URL in MiniPay Developer Settings > "Load Test Page"

**Tasks**:

- [ ] Install MiniPay app
- [ ] Enable Developer Mode
- [ ] Get testnet cUSD tokens
- [ ] Deploy app or set up tunneling
- [ ] Load app in MiniPay

**Estimated Time**: 1-2 hours

---

#### 3.2 Test Scenarios

**Test Checklist**:

- [ ] MiniPay detection works (`isMiniPay()` returns true)
- [ ] Auto-connect works (ComposerKit UI handles this)
- [ ] Connect button is hidden in MiniPay
- [ ] Wallet balance displays correctly (cUSD balance)
- [ ] Transaction submission works with cUSD fee currency
- [ ] Gas estimation works correctly
- [ ] Transaction confirmation works
- [ ] Token claim flow completes successfully
- [ ] Error handling works (insufficient cUSD, etc.)
- [ ] Works on both testnet and mainnet

**Estimated Time**: 2-3 hours

---

## 🔧 Technical Implementation Details

### Fee Currency Configuration

**Challenge**: Wagmi/Viem may not directly support `feeCurrency` parameter

**Solution Options**:

1. **Use Viem's transaction request directly**:

```typescript
import { createWalletClient, custom } from "viem";
import { celoSepolia } from "viem/chains";

const client = createWalletClient({
    chain: celoSepolia,
    transport: custom(window.ethereum),
});

// For MiniPay, use custom transaction with feeCurrency
if (isMiniPay()) {
    await client.sendTransaction({
        to: contractAddress,
        data: encodedFunctionCall,
        feeCurrency: "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD
    });
}
```

2. **Use ethereum.request directly**:

```typescript
if (isMiniPay()) {
    await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
            from: address,
            to: contractAddress,
            data: encodedFunctionCall,
            feeCurrency: "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD
        }],
    });
}
```

3. **Extend Wagmi writeContract**:

- May need to create custom hook that wraps `writeContract` and adds feeCurrency
  for MiniPay

**Recommended Approach**: Option 2 (direct ethereum.request) for MiniPay,
fallback to Wagmi for others

---

### Legacy Transaction Format

**Current Wagmi Config**: May default to EIP-1559

**Solution**: Wagmi/Viem should handle this automatically, but verify:

- Legacy transactions use `gasPrice` instead of `maxFeePerGas` and
  `maxPriorityFeePerGas`
- MiniPay may automatically convert, but need to test

**Action**: Test with current config first, adjust if needed

---

## 📊 Implementation Checklist

### Pre-Implementation

- [ ] Research Wagmi/Viem feeCurrency support
- [ ] Find cUSD contract addresses for Celo Sepolia and Celo mainnet
- [ ] Find cUSD faucet URL for testnet
- [ ] Set up MiniPay app for testing
- [ ] Get testnet cUSD tokens

### Implementation

- [ ] Configure feeCurrency for MiniPay transactions
- [ ] Ensure legacy transaction format
- [ ] Hide connect button in MiniPay
- [ ] Update gas fee messaging (cUSD vs CELO)
- [ ] Update faucet instructions for cUSD
- [ ] Test all changes in different environments

### Testing

- [ ] Test in MiniPay Developer Mode
- [ ] Test transaction flow with cUSD
- [ ] Test error handling
- [ ] Test on both testnet and mainnet
- [ ] Verify auto-connect works
- [ ] Verify UI adaptations work

### Documentation

- [ ] Update README with MiniPay setup instructions
- [ ] Document feeCurrency configuration
- [ ] Document testing process
- [ ] Update troubleshooting guide

---

## ⚠️ Known Constraints & Considerations

### 1. Fee Currency Limitation

**Issue**: MiniPay only supports cUSD for gas fees (not CELO)

**Impact**:

- Users must have cUSD in their MiniPay wallet (not CELO)
- Need to update all gas fee messaging
- Need to provide cUSD faucet instructions
- May need different transaction flow for MiniPay

**Mitigation**:

- Clear messaging about cUSD requirement
- Provide cUSD faucet links
- Test gas estimation with cUSD

---

### 2. Transaction Format Limitation

**Issue**: MiniPay only accepts legacy transactions (not EIP-1559)

**Impact**:

- May need to force legacy format for MiniPay
- Gas estimation may differ
- Need to test transaction submission

**Mitigation**:

- Test current Wagmi config (may work automatically)
- Adjust if needed to force legacy format
- Test gas estimation

---

### 3. Network Compatibility

**Current Setup**: Uses Celo Sepolia (testnet) and Celo (mainnet)

**MiniPay Support**:

- Testnet: Celo Sepolia L2 ✅ (matches)
- Mainnet: Celo mainnet ✅ (matches)

**Status**: ✅ Compatible - no network changes needed

---

### 4. Auto-Connect Behavior

**Current**: ComposerKit UI handles auto-connect for injected wallets

**MiniPay**: Uses injected wallet connector

**Status**: ✅ Should work automatically - needs testing

---

## 🎯 Recommended Implementation Approach

### Option 1: Minimal Implementation (Recommended for MVP)

**Focus**: Get basic MiniPay support working

**Steps**:

1. Hide connect button in MiniPay (15 min)
2. Update gas fee messaging for cUSD (30 min)
3. Test auto-connect (should work automatically)
4. Test basic transaction flow
5. Add feeCurrency if transactions fail

**Time**: 1-2 hours + testing

**Risk**: Low - minimal changes, mostly UI

---

### Option 2: Full Implementation

**Focus**: Complete MiniPay integration with all optimizations

**Steps**:

1. All steps from Option 1
2. Configure feeCurrency for all transactions
3. Ensure legacy transaction format
4. Comprehensive testing
5. Update all documentation

**Time**: 4-6 hours + testing

**Risk**: Medium - more code changes, need to test thoroughly

---

## 📚 References

- [Celo MiniPay Overview](https://docs.celo.org/build-on-celo/build-on-minipay/overview)
- [Celo MiniPay Quickstart](https://docs.celo.org/build/build-on-minipay/quickstart)
- [Celo Composer Documentation](https://docs.celo.org/composer)
- [MiniPay Integration Analysis](../minipay-demo/MINIPAY_INTEGRATION_ANALYSIS.md) -
  Our reference implementation

---

## 🔄 Current Status

**Decision**: **Deferred** - No implementation for now

**Reason**:

- Need clarity on feeCurrency handling with cUSD
- Need to test gas estimation with cUSD
- Need access to MiniPay environment for testing
- Current implementation works for other wallets

**When to Revisit**:

- When we have access to MiniPay for testing
- When we need to support MiniPay users
- When feeCurrency implementation is clear

**Next Steps** (when ready):

1. Research feeCurrency implementation in Wagmi/Viem
2. Set up MiniPay testing environment
3. Get testnet cUSD tokens
4. Follow implementation plan above

---

**Last Updated**: 2025-12-01\
**Status**: Analysis Complete - Ready for Implementation When Needed




