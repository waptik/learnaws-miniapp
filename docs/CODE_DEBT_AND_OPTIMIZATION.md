# Code Debt Analysis & Optimization Report

**Date**: 2025-01-24\
**Scope**: MiniPay integration, payment hooks, contract calls, and related
infrastructure

---

## 📋 Executive Summary

This document identifies code debt, optimization opportunities, and
architectural improvements across the codebase. The analysis focuses on:

- **Code Duplication**: Repeated patterns that can be consolidated
- **Type Safety**: `any` types and missing type definitions
- **Error Handling**: Inconsistent error handling patterns
- **Performance**: Unnecessary re-renders and computations
- **Architecture**: Separation of concerns and abstraction layers
- **Maintainability**: Code organization and documentation

---

## 🔴 Critical Issues

### 1. **Direct `window.ethereum` Usage in Multiple Places**

**Location**:

- `apps/web/src/hooks/use-chain.ts:52` - `getChainKeyFromWallet()`
- `apps/web/src/hooks/use-minipay.ts:29-31` - `useMiniPayAddress()`
- `apps/web/src/lib/wagmi.ts:46` - `isMiniPay()`
- `apps/web/src/hooks/use-platform.ts:33` - `isInPlatform()`

**Problem**:

- Violates the stated goal of "only use wagmi"
- Creates inconsistency in wallet interaction patterns
- Makes testing harder (requires mocking `window.ethereum`)
- Potential race conditions with multiple direct calls

**Impact**: High - Architectural inconsistency

**Recommendation**:

```typescript
// Create a centralized wallet utility that uses wagmi
// apps/web/src/lib/wallet-utils.ts
import { useAccount, useChainId } from "wagmi";

export function useWalletChainId() {
    return useChainId(); // Use wagmi instead of window.ethereum
}

// For non-React contexts, use publicClient from wagmi config
export async function getChainIdFromWagmi(config: any): Promise<number> {
    const publicClient = config.getPublicClient();
    return await publicClient.getChainId();
}
```

**Priority**: High\
**Effort**: Medium (2-3 hours)

---

### 2. **Type Safety: Excessive `any` Types**

**Location**:

- `apps/web/src/lib/minipay.ts:43-44` - `walletClient: any`, `publicClient: any`
- `apps/web/src/hooks/use-payment.ts:161` - `errorObj as any`
- `apps/web/src/hooks/use-contract-call.ts:95` - `errorObj as any`

**Problem**:

- Loss of type safety
- No IntelliSense support
- Runtime errors not caught at compile time

**Recommendation**:

```typescript
// apps/web/src/lib/minipay.ts
import type { PublicClient, WalletClient } from "viem";

export async function sendContractTransaction(
    walletClient: WalletClient,
    publicClient: PublicClient,
    // ... rest
);
```

**Priority**: Medium\
**Effort**: Low (1-2 hours)

---

### 3. **Code Duplication: Gas Estimation Logic**

**Location**:

- `apps/web/src/lib/minipay.ts:59-82` - Gas estimation
- `apps/web/src/hooks/use-payment.ts:89-113` - Similar gas estimation

**Problem**:

- Duplicated logic for gas estimation with `feeCurrency`
- Same error handling pattern repeated
- Maintenance burden (changes need to be made in multiple places)

**Recommendation**:

```typescript
// apps/web/src/lib/gas-estimation.ts
export async function estimateGasWithFeeCurrency(
    publicClient: PublicClient,
    params: {
        account: Address;
        to: Address;
        data?: `0x${string}`;
        value?: bigint;
        feeCurrency: Address;
    },
): Promise<{ gasEstimate: bigint; gasPrice: bigint } | null> {
    try {
        const gasEstimate = await publicClient.estimateGas({
            ...params,
            value: params.value || 0n,
            data: params.data || "0x",
        });

        const gasPriceHex = (await publicClient.request({
            method: "eth_gasPrice",
            params: [params.feeCurrency] as any,
        })) as `0x${string}`;
        const gasPrice = BigInt(gasPriceHex);

        return { gasEstimate, gasPrice };
    } catch (error) {
        console.warn(
            "[gas-estimation] Failed, proceeding without gas parameters:",
            error,
        );
        return null;
    }
}
```

**Priority**: Medium\
**Effort**: Medium (2-3 hours)

---

### 4. **Error Handling Inconsistency**

**Location**:

- `apps/web/src/hooks/use-payment.ts:153-206` - Complex nested error extraction
- `apps/web/src/hooks/use-contract-call.ts:88-106` - Simpler error extraction
- `apps/web/src/lib/minipay.ts:75-82` - Basic error logging

**Problem**:

- Different error handling patterns across files
- `use-payment.ts` has overly complex error extraction (50+ lines)
- Inconsistent user-facing error messages

**Recommendation**:

```typescript
// apps/web/src/lib/error-utils.ts
export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    if (typeof error === "object" && error !== null) {
        const errorObj = error as Record<string, unknown>;

        // Try common error message paths
        const messagePaths = [
            "message",
            "error.message",
            "error.data.message",
            "data.message",
        ];

        for (const path of messagePaths) {
            const value = getNestedValue(errorObj, path);
            if (typeof value === "string" && value.length > 0) {
                return value;
            }
        }

        // RPC error code
        if (errorObj.code) {
            return `Error ${errorObj.code}: ${
                errorObj.message || "Transaction failed"
            }`;
        }
    }

    return "An unknown error occurred";
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current, key) => {
        return current && typeof current === "object" && key in current
            ? (current as Record<string, unknown>)[key]
            : undefined;
    }, obj as unknown);
}
```

**Priority**: Medium\
**Effort**: Low (1-2 hours)

---

## 🟡 Medium Priority Issues

### 5. **Unused/Dead Code**

**Location**:

- `apps/web/src/lib/minipay.ts:7` - `toHex` imported but never used
- `apps/web/src/lib/minipay.ts:57` - `gasPrice` calculated but never used (after
  removal)
- `apps/web/src/hooks/use-payment.ts:48` - Empty comment "// Reset state"
- `apps/web/src/hooks/use-payment.ts:114` - Comment "// data" with no code
- `apps/web/src/hooks/use-cusd-balance.ts:4` - `stableTokenABI` imported but not
  used

**Problem**:

- Increases bundle size
- Confuses developers
- Indicates incomplete refactoring

**Recommendation**: Remove unused imports and dead code

**Priority**: Low\
**Effort**: Low (30 minutes)

---

### 6. **Console Logging in Production Code**

**Location**:

- Multiple files use `console.log`, `console.warn`, `console.error`
- `apps/web/src/hooks/use-cusd-balance.ts:25` - Debug logging
- `apps/web/src/lib/minipay.ts:78` - Warning logs
- `apps/web/src/components/assessment/ClaimTokenButton.tsx:76,93` - Transaction
  logs

**Problem**:

- No logging abstraction
- Can't control log levels in production
- Potential performance impact
- Exposes internal state to console

**Recommendation**:

```typescript
// apps/web/src/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
    private level: LogLevel;

    constructor() {
        this.level = process.env.NODE_ENV === "development" ? "debug" : "error";
    }

    debug(...args: unknown[]) {
        if (this.shouldLog("debug")) console.log("[DEBUG]", ...args);
    }

    warn(...args: unknown[]) {
        if (this.shouldLog("warn")) console.warn("[WARN]", ...args);
    }

    error(...args: unknown[]) {
        if (this.shouldLog("error")) console.error("[ERROR]", ...args);
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ["debug", "info", "warn", "error"];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
}

export const logger = new Logger();
```

**Priority**: Low\
**Effort**: Medium (2-3 hours)

---

### 7. **Redundant State Management**

**Location**:

- `apps/web/src/components/assessment/ClaimTokenButton.tsx:47-52` - Multiple
  useState for error/success states
- `apps/web/src/hooks/use-contract-call.ts:32` - Local `minipayHash` state when
  wagmi already tracks hash

**Problem**:

- Duplicate state tracking
- Potential state synchronization issues
- More complex component logic

**Recommendation**:

- Use wagmi's built-in state management more consistently
- Consider using a state machine (e.g., XState) for complex transaction flows

**Priority**: Low\
**Effort**: Medium (3-4 hours)

---

### 8. **Inconsistent Chain Detection**

**Location**:

- `apps/web/src/hooks/use-chain.ts:13-30` - Uses `useChainId()` from wagmi
- `apps/web/src/hooks/use-chain.ts:45-65` - `getChainKeyFromWallet()` uses
  `window.ethereum`
- `apps/web/src/lib/minipay.ts:16` - Uses `getChainKeyFromWallet()` (async, uses
  window.ethereum)

**Problem**:

- Mixed approaches for chain detection
- Async chain detection in sync contexts
- Potential race conditions

**Recommendation**: Standardize on wagmi's `useChainId()` hook everywhere

**Priority**: Medium\
**Effort**: Low (1-2 hours)

---

### 9. **Missing Input Validation**

**Location**:

- `apps/web/src/hooks/use-payment.ts:44-77` - Basic validation but could be more
  robust
- `apps/web/src/lib/minipay.ts:42-51` - No validation of function parameters

**Problem**:

- Runtime errors not caught early
- Poor error messages for invalid inputs

**Recommendation**:

```typescript
// apps/web/src/lib/validation.ts
import { isAddress } from "viem";

export function validateAddress(
    address: string,
    name = "Address",
): asserts address is `0x${string}` {
    if (!isAddress(address)) {
        throw new Error(`${name} must be a valid Ethereum address`);
    }
}

export function validateAmount(amount: string | number): bigint {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num) || num <= 0) {
        throw new Error("Amount must be greater than 0");
    }
    return parseEther(amount.toString());
}
```

**Priority**: Low\
**Effort**: Low (1 hour)

---

## 🟢 Low Priority / Nice to Have

### 10. **Performance: Unnecessary Re-renders**

**Location**:

- `apps/web/src/hooks/use-minipay.ts:11-17` - `useState` + `useEffect` for
  static check
- `apps/web/src/hooks/use-platform.ts:10-20` - Multiple hook calls that could be
  memoized

**Problem**:

- `useMiniPay()` uses state for a value that doesn't change during component
  lifecycle
- Platform detection hooks could be optimized

**Recommendation**:

```typescript
// Use useMemo for derived values
export function usePlatform() {
    const isMiniPay = useMiniPay();
    const { isInMiniApp } = useMiniApp();

    return useMemo(() => ({
        isMiniPay,
        isInMiniApp,
        isInPlatform: isMiniPay || isInMiniApp,
    }), [isMiniPay, isInMiniApp]);
}
```

**Priority**: Low\
**Effort**: Low (1 hour)

---

### 11. **Documentation Gaps**

**Location**: Multiple files missing JSDoc comments

**Problem**:

- Harder for new developers to understand code
- Missing parameter descriptions
- No examples in documentation

**Recommendation**: Add comprehensive JSDoc comments to all exported functions

**Priority**: Low\
**Effort**: Medium (4-6 hours)

---

### 12. **Test Coverage**

**Location**: No test files found for hooks and utilities

**Problem**:

- No unit tests for critical hooks (`use-payment`, `use-contract-call`,
  `use-chain`)
- No integration tests for MiniPay flow
- Risk of regressions

**Recommendation**:

- Add unit tests for hooks using React Testing Library
- Add integration tests for transaction flows
- Mock wagmi hooks for testing

**Priority**: Medium\
**Effort**: High (8-12 hours)

---

## 📊 Code Metrics

### File Complexity

| File                   | Lines | Complexity | Issues                                   |
| ---------------------- | ----- | ---------- | ---------------------------------------- |
| `use-payment.ts`       | 222   | High       | Error handling (50+ lines), duplication  |
| `ClaimTokenButton.tsx` | 701   | Very High  | Multiple responsibilities, complex state |
| `minipay.ts`           | 115   | Medium     | Type safety, unused code                 |
| `use-contract-call.ts` | 120   | Medium     | Error handling inconsistency             |
| `use-chain.ts`         | 66    | Low        | Mixed chain detection approaches         |

### Type Safety Score

- **Current**: ~60% (many `any` types)
- **Target**: 95%+ (only necessary `any` types)

### Code Duplication

- **Gas Estimation**: 2 locations (minipay.ts, use-payment.ts)
- **Error Extraction**: 3 different implementations
- **Chain Detection**: 2 different approaches

---

## 🎯 Optimization Roadmap

### Phase 1: Critical Fixes (Week 1)

1. ✅ Remove direct `window.ethereum` usage
2. ✅ Add proper TypeScript types
3. ✅ Extract gas estimation utility
4. ✅ Standardize error handling

**Estimated Time**: 8-10 hours

### Phase 2: Code Quality (Week 2)

5. ✅ Remove dead code and unused imports
6. ✅ Add input validation
7. ✅ Standardize chain detection
8. ✅ Add logging abstraction

**Estimated Time**: 6-8 hours

### Phase 3: Performance & Testing (Week 3)

9. ✅ Optimize re-renders
10. ✅ Add unit tests
11. ✅ Add integration tests
12. ✅ Improve documentation

**Estimated Time**: 12-16 hours

---

## 🔧 Quick Wins (Can be done immediately)

1. **Remove unused imports** (5 minutes)
   - `toHex` from minipay.ts
   - `stableTokenABI` from use-cusd-balance.ts
   - Unused `gasPrice` variable

2. **Add type definitions** (30 minutes)
   - Replace `any` with proper types in minipay.ts
   - Add WalletClient and PublicClient types

3. **Extract error utility** (1 hour)
   - Create `error-utils.ts` with `extractErrorMessage()`
   - Replace error handling in use-payment.ts and use-contract-call.ts

4. **Remove dead code** (15 minutes)
   - Empty comments
   - Unused variables

---

## 📝 Best Practices Recommendations

### 1. **Single Responsibility Principle**

- `ClaimTokenButton.tsx` is doing too much (700+ lines)
- Consider splitting into:
  - `ClaimTokenButton.tsx` - UI component
  - `useClaimTokens.ts` - Business logic hook
  - `ClaimTokenDialog.tsx` - Success/error dialogs

### 2. **Dependency Injection**

- Pass `walletClient` and `publicClient` as parameters instead of getting them
  inside functions
- Makes testing easier
- Reduces coupling

### 3. **Error Boundaries**

- Add React Error Boundaries for transaction errors
- Prevent entire app crashes from transaction failures

### 4. **Configuration Management**

- Centralize contract addresses and chain configs
- Use environment-based configuration
- Consider using a config service

### 5. **Transaction State Machine**

- Use a state machine for complex transaction flows
- States: `idle` → `preparing` → `signing` → `pending` → `confirmed` → `error`
- Makes state management predictable

---

## 🎓 Learning Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Viem TypeScript Guide](https://viem.sh/docs/typescript)
- [React Hook Best Practices](https://react.dev/reference/react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## ✅ Checklist for Code Review

When reviewing code, check for:

- [ ] No direct `window.ethereum` usage (use wagmi hooks)
- [ ] No `any` types (use proper TypeScript types)
- [ ] Error handling is consistent
- [ ] No unused imports or dead code
- [ ] Console logs use logger abstraction
- [ ] Input validation for user inputs
- [ ] JSDoc comments for exported functions
- [ ] Tests for new functionality

---

**Last Updated**: 2025-01-24\
**Next Review**: After Phase 1 completion

