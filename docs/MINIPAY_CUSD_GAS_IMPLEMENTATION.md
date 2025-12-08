# MiniPay cUSD Gas Fees Implementation

**Date**: 2025-01-24  
**Purpose**: Enable cUSD gas fees for reward claiming in MiniPay

---

## 📋 Overview

This implementation enables users in MiniPay to pay gas fees in cUSD (instead of CELO) when claiming reward tokens. This is different from the chess-puzzles use case which was about payments for subscriptions - here we're just using cUSD for gas fees on contract calls.

---

## 🎯 What Was Implemented

### 1. MiniPay Contract Call Utility (`lib/minipay.ts`)

Created a utility module that handles contract calls with MiniPay-specific requirements:

- **`sendContractTransaction()`**: Sends contract transactions via MiniPay with cUSD gas fees
- **`shouldUseMiniPayContractCall()`**: Checks if we should use MiniPay contract calls

**Key Features:**
- Encodes contract function calls
- Sets `feeCurrency` to cUSD address (required by MiniPay)
- Uses legacy transaction format (`gasPrice` instead of EIP-1559)
- Estimates gas before sending
- Handles errors gracefully

### 2. Updated ClaimTokenButton Component

Modified `ClaimTokenButton` to:
- Detect MiniPay environment
- Use MiniPay contract calls with cUSD gas fees when in MiniPay
- Use regular wagmi `writeContract` for other wallets
- Show appropriate UI messages (cUSD vs CELO for gas)

### 3. Updated cUSD Address

Fixed cUSD contract address for Celo Sepolia to match verified address:
- **Celo Mainnet**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **Celo Sepolia**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` ✅

---

## 🔧 How It Works

### For MiniPay Users

1. User clicks "Claim Token"
2. System detects MiniPay environment
3. Contract call is encoded with function data
4. Transaction is sent via `window.ethereum.request` with:
   - `feeCurrency: cUSD_ADDRESS` (pays gas in cUSD)
   - `data: encoded_function_call`
   - `gasPrice: current_gas_price`
   - `gas: estimated_gas`
5. User confirms transaction in MiniPay wallet
6. Gas fees are deducted in cUSD automatically

### For Other Wallets

1. User clicks "Claim Token"
2. System uses regular wagmi `writeContract`
3. Gas fees are paid in CELO (standard behavior)

---

## 📝 Code Changes

### New File: `lib/minipay.ts`

```typescript
export async function sendContractTransaction(
  address: Address,
  contractAddress: Address,
  abi: readonly any[],
  functionName: string,
  args: readonly unknown[]
): Promise<`0x${string}`> {
  // MiniPay-specific transaction with cUSD gas fees
  const txParams = {
    from: address,
    to: contractAddress,
    value: "0x0",
    data: encodeFunctionData(...),
    feeCurrency: cUSD_ADDRESS, // Key: pays gas in cUSD
    gasPrice: await getGasPrice(),
    gas: await estimateGas(),
  };
  
  return await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [txParams],
  });
}
```

### Updated: `components/assessment/ClaimTokenButton.tsx`

```typescript
// Detect MiniPay
const isInMiniPay = useMiniPay();

// Use MiniPay contract call if in MiniPay
if (shouldUseMiniPayContractCall() && address) {
  const txHash = await sendContractTransaction(
    address,
    ASSESSMENT_REWARDS_ADDRESS,
    ASSESSMENT_REWARDS_ABI,
    "claimReward",
    [BigInt(score), assessmentIdBytes32, courseCode]
  );
  setMinipayTxHash(txHash);
} else {
  // Use regular wagmi for other wallets
  writeContract({ ... });
}
```

---

## 🔑 Key Differences from Chess Puzzles

| Aspect | Chess Puzzles | Learn AWS |
|--------|--------------|-----------|
| **Use Case** | Payment TO merchant (subscription) | Contract call WITH cUSD gas fees |
| **Transaction Type** | Simple transfer (`value` field) | Contract call (`data` field) |
| **Recipient** | Merchant address | Smart contract address |
| **Value** | Payment amount (1 cUSD) | Zero (just gas fees) |
| **Backend Verification** | ✅ Required (payment tracking) | ❌ Not needed (no payment) |

---

## ✅ Benefits

1. **Better UX for MiniPay Users**: Can use cUSD they already have instead of needing CELO
2. **Automatic Detection**: System automatically uses cUSD when in MiniPay
3. **Backward Compatible**: Other wallets continue to work normally
4. **No Breaking Changes**: Existing functionality unchanged

---

## 🧪 Testing

### Test in MiniPay:
1. Open app in MiniPay browser
2. Complete an assessment and pass
3. Click "Claim Token"
4. Verify transaction uses cUSD for gas fees
5. Check transaction on block explorer

### Test in Regular Wallet:
1. Open app in regular browser (MetaMask, etc.)
2. Complete an assessment and pass
3. Click "Claim Token"
4. Verify transaction uses CELO for gas fees (normal behavior)

---

## 📚 Related Files

- `apps/web/src/lib/minipay.ts` - MiniPay contract call utility
- `apps/web/src/components/assessment/ClaimTokenButton.tsx` - Updated claim button
- `apps/web/src/lib/constants.ts` - Updated cUSD addresses
- `apps/web/src/hooks/use-minipay.ts` - MiniPay detection hook
- `apps/web/src/lib/wagmi.ts` - Wagmi configuration

---

## 🔗 References

- [Chess Puzzles Analysis](./CHESS_PUZZLES_MINIPAY_ANALYSIS.md) - Reference implementation
- [Celo MiniPay Documentation](https://docs.celo.org/build-on-celo/build-on-minipay/overview)
- [Celo cUSD Contract](https://docs.celo.org/developer-guide/celo-for-eth-devs)

---

## 🚀 Next Steps (Optional)

1. **Add cUSD Balance Check**: Show warning if user doesn't have enough cUSD for gas
2. **Gas Estimation Display**: Show estimated gas cost in cUSD before transaction
3. **Error Handling**: Better error messages for insufficient cUSD balance
4. **Transaction Status**: Add polling for MiniPay transactions (currently relies on wagmi's `useWaitForTransactionReceipt`)

---

**Implementation Complete** ✅

Users in MiniPay can now claim rewards using cUSD for gas fees, making it easier to interact with the app without needing CELO tokens.




