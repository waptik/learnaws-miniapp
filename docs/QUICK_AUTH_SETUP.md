# Farcaster Quick Auth Setup

**Date**: 2025-01-24  
**Summary**: Quick Auth integration for seamless Farcaster authentication in miniapp.

---

## 🔧 Implementation

### 1. QuickAuthProvider

The `QuickAuthProvider` is integrated into the app's provider tree and handles:
- Getting Quick Auth tokens from Farcaster SDK
- Verifying tokens with the backend
- Managing session state (token, fid, walletAddress)
- Persisting sessions in localStorage
- Auto-restoring sessions on page load

**Location**: `apps/web/src/contexts/quick-auth-context.tsx`

### 2. Backend API

The sign-in endpoint (`/api/auth/sign-in`) already exists and:
- Verifies Quick Auth JWT tokens
- Extracts FID and wallet address
- Generates app session tokens
- Returns authenticated user data

**Location**: `apps/web/src/app/api/auth/sign-in/route.ts`

### 3. Integration

Quick Auth is integrated into the provider tree:
```
ThemeProvider
  └─ ErudaProvider
      └─ FrameWalletProvider
          └─ MiniAppProvider
              └─ QuickAuthProvider  ← Added here
                  └─ ComposerKitProvider
```

---

## 📖 Usage

### Basic Usage

```tsx
import { useQuickAuth } from "@/hooks/use-quick-auth";

function MyComponent() {
  const { 
    token, 
    fid, 
    walletAddress, 
    isAuthenticated, 
    isLoading, 
    signIn, 
    signOut 
  } = useQuickAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={signIn}>
        Sign in with Farcaster
      </button>
    );
  }

  return (
    <div>
      <p>FID: {fid}</p>
      <p>Wallet: {walletAddress}</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

### Auto-Sign In in Miniapp

The Quick Auth can be automatically triggered when in a miniapp. You can add this to your miniapp context or a page component:

```tsx
import { useQuickAuth } from "@/hooks/use-quick-auth";
import { useMiniApp } from "@/contexts/miniapp-context";

function AutoAuth() {
  const { isInMiniApp } = useMiniApp();
  const { isAuthenticated, isLoading, signIn } = useQuickAuth();

  useEffect(() => {
    if (isInMiniApp && !isAuthenticated && !isLoading) {
      signIn();
    }
  }, [isInMiniApp, isAuthenticated, isLoading, signIn]);

  return null;
}
```

### Making Authenticated Requests

```tsx
import { useQuickAuth } from "@/hooks/use-quick-auth";

function MyComponent() {
  const { token } = useQuickAuth();

  const fetchUserData = async () => {
    const response = await fetch("/api/user/data", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  };
}
```

---

## 🔐 Security

- Quick Auth tokens are verified on the backend
- Session tokens are stored in localStorage (consider httpOnly cookies for production)
- Tokens have expiration times (7 days default)
- Invalid/expired tokens are automatically cleared

---

## ⚙️ Configuration

### Environment Variables

Required environment variables (already configured):
- `NEXT_PUBLIC_BASE_URL` - Your app's base URL
- `JWT_SECRET` - Secret for signing session tokens

### Preconnect

A preconnect link is added to the layout for performance:
```html
<link rel="preconnect" href="https://auth.farcaster.xyz" />
```

---

## 🧪 Testing

1. **In Miniapp**: Quick Auth should automatically work when the app is opened in Farcaster
2. **Manual Sign In**: Call `signIn()` from the `useQuickAuth` hook
3. **Session Persistence**: Refresh the page - session should be restored
4. **Sign Out**: Call `signOut()` to clear the session

---

## 📝 Notes

- Quick Auth only works when the app is opened in a Farcaster client (miniapp)
- The `sdk.quickAuth.getToken()` call will fail outside of Farcaster
- Always check `isInMiniApp` before attempting to sign in
- Session tokens are JWT tokens signed with `JWT_SECRET`


