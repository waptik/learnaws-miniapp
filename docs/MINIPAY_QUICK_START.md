# MiniPay Quick Start Guide

**Status**: 📋 Implementation Guide  
**Last Updated**: 2025-12-01

---

## 🚀 Quick Implementation Steps

### Step 1: Install Packages (5 min)

```bash
cd apps/web
pnpm add @celo/abis @celo/identity
```

### Step 2: Create Hooks (2 hours)

1. **`hooks/use-minipay.ts`** - MiniPay detection
2. **`hooks/use-payment.ts`** - Payment/transaction handling
3. **`hooks/use-cusd-balance.ts`** - cUSD balance checking

### Step 3: Create Server Clients (15 min)

**`lib/clients.ts`** - Server and public client setup

### Step 4: Migrate to Server Actions (2-3 hours)

1. **`actions/assessment/start.ts`** - Start assessment
2. **`actions/assessment/submit.ts`** - Submit assessment
3. **`actions/assessment/claim.ts`** - Validate claim

### Step 5: Update Frontend (1-2 hours)

Replace API route calls with server actions

---

## 📦 Required Packages

```json
{
  "dependencies": {
    "@celo/abis": "^latest",
    "@celo/identity": "^latest",
    "viem": "^2.27.2", // ✅ Already installed
    "wagmi": "^2.14.12" // ✅ Already installed
  }
}
```

---

## 🎣 Hook Examples

### useMiniPay

```typescript
import { useMiniPay } from "@/hooks/use-minipay";

const isInMiniPay = useMiniPay();
```

### usePayment

```typescript
import { usePayment } from "@/hooks/use-payment";

const { sendPayment, isPending, gasEstimate } = usePayment();
```

### useCUSDBalance

```typescript
import { useCUSDBalance } from "@/hooks/use-cusd-balance";

const { balance, hasBalance, cusdAddress } = useCUSDBalance();
// cusdAddress can be used for feeCurrency in transactions
```

**Note**: Uses existing `CONTRACT_ADDRESSES.cUSD` from `@/lib/constants` - no need to hardcode addresses!

---

## 🔄 Server Action Example

### Before (API Route)

```typescript
const response = await fetch("/api/assessment/claim", {
  method: "POST",
  body: JSON.stringify(data),
});
const result = await response.json();
```

### After (Server Action)

```typescript
import { validateClaim } from "@/actions/assessment/claim";

const result = await validateClaim(data);
```

---

## 📚 Full Documentation

- [Full Implementation Plan](./MINIPAY_FULL_IMPLEMENTATION_PLAN.md) - Complete step-by-step guide
- [Implementation Report](./MINIPAY_IMPLEMENTATION_REPORT.md) - Analysis and considerations
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) - Overall project roadmap

---

**Status**: Ready for Implementation

