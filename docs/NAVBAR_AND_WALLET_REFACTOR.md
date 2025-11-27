# Navbar and Wallet Connection Refactor

**Date**: 2025-01-24  
**Summary**: Refactored navbar and wallet connection components to support both miniapp and non-miniapp environments with improved UX.

---

## 🔧 Changes Made

### 1. Package Updates

**Replaced deprecated packages:**
- `@farcaster/frame-core` → `@farcaster/miniapp-core@0.4.1`
- `@farcaster/frame-sdk` → `@farcaster/miniapp-sdk@0.2.1`
- Updated all imports from `@farcaster/frame-*` to `@farcaster/miniapp-*`
- Pinned all `@farcaster` packages to specific versions (removed "latest")

**Files affected:**
- `apps/web/package.json`
- `apps/web/src/contexts/miniapp-context.tsx`
- `apps/web/src/lib/notification-client.ts`
- `apps/web/src/lib/memory-store.ts`

### 2. Navbar Refactor

**Simplified navbar structure:**
- Removed mobile menu drawer (swiper)
- Always visible: clickable app name, theme switcher, and connect button
- App name uses `APP_NAME` constant ("LearnAWS")
- Theme toggle shows in navbar for non-miniapp (including mobile)
- Theme toggle moved to dropdown menu for miniapp/small screens

**Files affected:**
- `apps/web/src/components/navbar.tsx`

### 3. Connect Button Refactor

**Environment-specific behavior:**

#### Non-Miniapp Environment
- Uses ComposerKit UI components (`Wallet`, `Connect`, `Name`, `Avatar`)
- Automatically handles wallet connection and disconnect
- Shows wallet name and avatar when connected
- Works with MetaMask and other injected wallets

#### Miniapp Environment
- **Not Connected**: Button explicitly connects to Farcaster wallet connector
- **Connected**: Shows dropdown menu with:
  - User profile (avatar, display name, username)
  - Theme switcher
  - Disconnect button
- Menu appears on small screens (< 768px) or when in miniapp

**Files affected:**
- `apps/web/src/components/connect-button.tsx`

### 4. Miniapp Context Fixes

**Fixed auto-reconnect issue:**
- Prevented automatic reconnection after manual disconnect
- Changed `useEffect` dependency array to run only once on mount
- Used `useRef` to track if auto-connect has been attempted

**Fixed splash screen hanging:**
- Added timeout protection (2 seconds) for SDK calls
- Only calls `sdk.context` when actually in miniapp
- Gracefully handles failures outside miniapp environment

**Files affected:**
- `apps/web/src/contexts/miniapp-context.tsx`

---

## ✅ Features

### Navbar
- ✅ Clickable app name linking to home (all screens)
- ✅ Theme switcher always visible (non-miniapp) or in menu (miniapp)
- ✅ Connect button adapts to environment

### Connect Button
- ✅ **Non-miniapp**: Uses ComposerKit UI with automatic wallet detection
- ✅ **Miniapp**: Explicitly connects to Farcaster wallet
- ✅ **Miniapp + Connected**: Dropdown menu with profile, theme, and disconnect
- ✅ **Small screens**: Menu interface for better mobile UX

### Miniapp Context
- ✅ No auto-reconnect after manual disconnect
- ✅ Timeout protection prevents hanging
- ✅ Graceful error handling outside miniapp

---

## 🧪 Testing Checklist

- [x] Connect button works in miniapp
- [x] Connect button works outside miniapp (MetaMask, etc.)
- [x] Theme toggle visible on mobile (non-miniapp)
- [x] Theme toggle in dropdown menu (miniapp)
- [x] Disconnect works and doesn't auto-reconnect
- [x] Navbar shows on all screens
- [x] App name links to home

---

## 📝 Notes

- ComposerKit UI components handle wallet connection/disconnection automatically for non-miniapp environments
- Miniapp environment requires explicit Farcaster connector selection
- Screen size detection (< 768px) determines menu vs. inline display
- All `@farcaster` packages are pinned to specific versions for stability

