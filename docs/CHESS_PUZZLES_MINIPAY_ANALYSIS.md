# Chess Puzzles MiniPay & Payment Implementation Analysis

**Repository**: https://github.com/Emmo00/chess-puzzles\
**Analysis Date**: 2025-01-24\
**Purpose**: Analyze how chess-puzzles implements MiniPay detection and cUSD
payments

---

## 📋 Executive Summary

The chess-puzzles repository implements a **premium subscription model** using
cUSD payments on Celo. Key features:

- MiniPay auto-detection and wallet connection
- cUSD payment processing for $1/month premium subscriptions
- Payment verification via backend API
- Wagmi v2 + Viem for blockchain interactions
- MongoDB for payment status tracking

---

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Blockchain**: Wagmi v2, Viem, Celo SDK
- **Wallet**: MiniPay (Opera Mini browser wallet)
- **Database**: MongoDB (payment tracking)
- **Payment Token**: cUSD (Celo Dollar stablecoin)

### Project Structure

```
├── lib/
│   ├── config/wagmi.ts          # Wagmi configuration
│   └── hooks/
│       └── usePayment.ts         # Payment hook
├── components/
│   ├── PaymentModal.tsx         # Payment UI component
│   └── paywall-card.tsx         # Access control UI
├── app/
│   ├── api/payments/
│   │   ├── verify/route.ts       # Payment verification
│   │   └── status/route.ts       # Payment status check
│   └── daily/page.tsx            # Main puzzle page (uses payment)
```

---

## 🔍 Key Implementation Details

### 1. Wagmi Configuration (`lib/config/wagmi.ts`)

**Key Features:**

- Uses Wagmi v2 with injected connector
- Configures Celo Mainnet and Celo Sepolia
- **MiniPay Detection**: Uses `window.ethereum?.isMiniPay` flag
- Auto-connects when MiniPay is detected

**Code Pattern:**

```typescript
// MiniPay detection function
export function isMiniPay(): boolean {
    if (typeof window === "undefined") return false;
    return (window.ethereum as any)?.isMiniPay === true;
}

// Wagmi config
export const config = createConfig({
    chains: [celo, celoSepolia],
    connectors: [
        injected({
            target: "metaMask", // Works with MiniPay too
        }),
    ],
    // ... other config
});
```

**Key Insight**: They use the standard `injected` connector, which works with
both MetaMask and MiniPay. MiniPay is detected via the `isMiniPay` flag but
doesn't require a special connector.

---

### 2. Payment Hook (`lib/hooks/usePayment.ts`)

**Purpose**: Handles cUSD payment transactions with MiniPay support

**Key Features:**

1. **MiniPay Detection**: Checks if running in MiniPay environment
2. **Fee Currency**: Automatically sets `feeCurrency` to cUSD for MiniPay
3. **Transaction Building**: Uses legacy transaction format (not EIP-1559)
4. **Error Handling**: Comprehensive error handling with user-friendly messages

**Payment Flow:**

```typescript
const sendPayment = async (to: Address, amount: string) => {
    // 1. Detect MiniPay
    const isMiniPayEnv = isMiniPay();

    // 2. Build transaction params
    const txParams = {
        from: address,
        to: to,
        value: parseEther(amount),
        data: "0x", // Required by MiniPay
        feeCurrency: cUSD_ADDRESS, // Required for MiniPay
        gasPrice: await getGasPrice(),
    };

    // 3. Send transaction via window.ethereum (for MiniPay) or wagmi (for others)
    if (isMiniPayEnv) {
        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [txParams],
        });
    } else {
        // Use wagmi for other wallets
    }

    // 4. Wait for confirmation
    // 5. Verify payment on backend
};
```

**Critical MiniPay Requirements:**

- ✅ Must include `feeCurrency: cUSD_ADDRESS`
- ✅ Must include `data: "0x"` (even for simple transfers)
- ✅ Must use `gasPrice` (not `maxFeePerGas` - legacy transactions only)
- ✅ Uses `window.ethereum.request` directly for MiniPay (not wagmi's
  writeContract)

**cUSD Contract Addresses:**

- Celo Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Celo Sepolia: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

---

### 3. Payment Modal Component (`components/PaymentModal.tsx`)

**Purpose**: UI component for handling premium subscription payments

**Features:**

- Displays payment amount ($1 USD = ~1 cUSD)
- Shows wallet connection status
- Handles payment flow with loading states
- Calls backend API to verify payment after transaction

**Payment Flow:**

1. User clicks "Subscribe" button
2. Modal opens, checks wallet connection
3. If not connected, prompts to connect wallet
4. Shows payment amount and recipient address
5. User confirms transaction in wallet
6. Transaction is sent
7. Backend verifies payment via API
8. User gets premium access

**Key Code Pattern:**

```typescript
const handlePayment = async () => {
    try {
        // 1. Send payment
        const txHash = await sendPayment(
            MERCHANT_ADDRESS, // Recipient
            "1", // Amount in cUSD
        );

        // 2. Verify on backend
        const response = await fetch("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({ txHash, userId }),
        });

        // 3. Update UI
        if (response.ok) {
            setPaymentStatus("success");
        }
    } catch (error) {
        // Handle error
    }
};
```

---

### 4. Payment Verification API (`app/api/payments/verify/route.ts`)

**Purpose**: Backend verification of payment transactions

**Flow:**

1. Receives transaction hash from frontend
2. Fetches transaction details from Celo blockchain
3. Validates:
   - Transaction exists and is confirmed
   - Recipient address matches merchant address
   - Amount matches expected payment amount
   - Transaction is from correct user
4. Updates MongoDB with payment record
5. Returns success/failure status

**Key Validation Logic:**

```typescript
// 1. Get transaction from blockchain
const tx = await publicClient.getTransaction({ hash: txHash });

// 2. Validate recipient
if (tx.to?.toLowerCase() !== MERCHANT_ADDRESS.toLowerCase()) {
    return error("Invalid recipient");
}

// 3. Validate amount
const expectedAmount = parseEther("1"); // 1 cUSD
if (tx.value !== expectedAmount) {
    return error("Invalid amount");
}

// 4. Validate sender
if (tx.from.toLowerCase() !== userId.toLowerCase()) {
    return error("Invalid sender");
}

// 5. Save to database
await db.payments.create({
    txHash,
    userId,
    amount: "1",
    status: "verified",
    timestamp: new Date(),
});
```

**Security Considerations:**

- ✅ Validates transaction on-chain (not just trusting frontend)
- ✅ Checks transaction confirmation status
- ✅ Validates all transaction parameters
- ✅ Stores payment records for audit trail

---

### 5. Payment Status API (`app/api/payments/status/route.ts`)

**Purpose**: Check if user has active premium subscription

**Flow:**

1. Receives user address
2. Queries MongoDB for recent payments
3. Checks if payment is within subscription period (30 days)
4. Returns subscription status

**Key Logic:**

```typescript
const payment = await db.payments.findOne({
  userId: address,
  status: "verified",
  timestamp: { $gte: thirtyDaysAgo },
});

return {
  hasAccess: !!payment,
  expiresAt: payment?.timestamp + 30_DAYS,
};
```

---

### 6. Paywall Component (`components/paywall-card.tsx`)

**Purpose**: UI component that blocks access until payment is made

**Features:**

- Shows payment prompt for non-premium users
- Displays subscription benefits
- Integrates with PaymentModal
- Checks payment status on mount

**Usage Pattern:**

```typescript
<PaywallCard>
    {hasAccess ? <PremiumContent /> : <PaymentPrompt />}
</PaywallCard>;
```

---

## 🔑 Key Differences from Standard Wagmi Usage

### 1. **Direct `window.ethereum` Usage for MiniPay**

Instead of using wagmi's `writeContract` or `sendTransaction`, they use
`window.ethereum.request` directly for MiniPay:

```typescript
// MiniPay-specific code
if (isMiniPay()) {
    const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
    });
} else {
    // Use wagmi for other wallets
    const { hash } = await writeContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
    });
}
```

**Why?** MiniPay requires specific transaction parameters (`feeCurrency`,
`data`) that are easier to set directly.

### 2. **Legacy Transaction Format**

MiniPay only supports legacy transactions (not EIP-1559):

- Uses `gasPrice` instead of `maxFeePerGas` and `maxPriorityFeePerGas`
- Must estimate gas separately
- Must get gas price from network

### 3. **Fee Currency Requirement**

All transactions must specify `feeCurrency: cUSD_ADDRESS`:

- Required for MiniPay to pay gas fees in cUSD
- Must be the cUSD contract address (not just "cUSD")
- Different addresses for mainnet vs testnet

---

## 📊 Payment Flow Diagram

```
User clicks "Subscribe"
    ↓
PaymentModal opens
    ↓
Check wallet connection
    ↓
[If not connected] → Prompt to connect
    ↓
[If connected] → Show payment details
    ↓
User confirms in wallet
    ↓
Transaction sent (with feeCurrency: cUSD)
    ↓
Wait for transaction confirmation
    ↓
Call /api/payments/verify with txHash
    ↓
Backend validates transaction on-chain
    ↓
Backend saves payment to MongoDB
    ↓
Return success to frontend
    ↓
Update UI: User has premium access
```

---

## 🎯 Best Practices Observed

### 1. **MiniPay Detection**

- Uses `window.ethereum?.isMiniPay` flag
- Checks on component mount
- Provides fallback for non-MiniPay wallets

### 2. **Error Handling**

- Comprehensive error messages
- Handles network errors gracefully
- Shows user-friendly error messages
- Logs detailed errors for debugging

### 3. **Payment Verification**

- Always verifies on backend (never trust frontend)
- Validates all transaction parameters
- Checks transaction confirmation status
- Stores payment records for audit

### 4. **User Experience**

- Clear loading states
- Transaction hash display
- Link to block explorer
- Clear error messages

### 5. **Security**

- Backend validation of all payments
- Validates transaction parameters
- Checks sender/recipient/amount
- Stores audit trail in database

---

## 🔧 Implementation Checklist

If implementing similar functionality, ensure:

- [ ] Wagmi v2 configured with Celo chains
- [ ] Injected connector configured
- [ ] MiniPay detection function (`isMiniPay()`)
- [ ] cUSD contract addresses for both networks
- [ ] Payment hook with MiniPay support
- [ ] Fee currency set to cUSD for MiniPay
- [ ] Legacy transaction format (gasPrice, not EIP-1559)
- [ ] Backend payment verification API
- [ ] Payment status checking API
- [ ] MongoDB schema for payment records
- [ ] Error handling for all failure cases
- [ ] Loading states in UI
- [ ] Transaction hash display
- [ ] Block explorer links

---

## 🚨 Common Pitfalls to Avoid

1. **Forgetting `feeCurrency`**: MiniPay requires this for all transactions
2. **Using EIP-1559**: MiniPay only supports legacy transactions
3. **Missing `data` field**: Must include `data: "0x"` even for simple transfers
4. **Trusting frontend**: Always verify payments on backend
5. **Wrong cUSD address**: Different addresses for mainnet vs testnet
6. **Not checking confirmation**: Wait for transaction confirmation before
   verifying
7. **Poor error handling**: Users need clear error messages

---

## 📝 Code Snippets Reference

### MiniPay Detection

```typescript
export function isMiniPay(): boolean {
    if (typeof window === "undefined") return false;
    return (window.ethereum as any)?.isMiniPay === true;
}
```

### Payment Transaction (MiniPay)

```typescript
const txParams = {
    from: address,
    to: MERCHANT_ADDRESS,
    value: parseEther("1"), // 1 cUSD
    data: "0x",
    feeCurrency: CUSD_ADDRESS,
    gasPrice: await getGasPrice(),
    gas: await estimateGas(),
};

const txHash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [txParams],
});
```

### Backend Verification

```typescript
// Get transaction from blockchain
const tx = await publicClient.getTransaction({ hash: txHash });

// Validate
if (tx.to !== MERCHANT_ADDRESS) throw new Error("Invalid recipient");
if (tx.value !== parseEther("1")) throw new Error("Invalid amount");
if (tx.from !== userId) throw new Error("Invalid sender");

// Save to database
await db.payments.create({ txHash, userId, amount: "1", status: "verified" });
```

---

## 🔗 Related Files in Repository

- `lib/config/wagmi.ts` - Wagmi configuration
- `lib/hooks/usePayment.ts` - Payment hook
- `components/PaymentModal.tsx` - Payment UI
- `components/paywall-card.tsx` - Access control
- `app/api/payments/verify/route.ts` - Payment verification
- `app/api/payments/status/route.ts` - Status checking
- `app/daily/page.tsx` - Usage example
- `MINIPAY_INTEGRATION.md` - Integration guide

---

## 📚 Additional Resources

- [Celo MiniPay Documentation](https://docs.celo.org/build-on-celo/build-on-minipay/overview)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Celo cUSD Contract](https://docs.celo.org/developer-guide/celo-for-eth-devs)

---

**Analysis Complete** ✅

This implementation provides a solid reference for integrating MiniPay payments
with cUSD on Celo. The key takeaway is the need for MiniPay-specific transaction
parameters (`feeCurrency`, `data`, legacy format) and robust backend
verification.



