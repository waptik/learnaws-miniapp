"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface QuickAuthContextType {
  token: string | null;
  fid: number | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const QuickAuthContext = createContext<QuickAuthContextType | undefined>(
  undefined
);

interface QuickAuthProviderProps {
  children: ReactNode;
}

/**
 * Check if Quick Auth is available in the current context
 */
async function isQuickAuthAvailable(): Promise<boolean> {
  try {
    // Check if we're in a Farcaster Mini App
    const isInMiniApp = await sdk.isInMiniApp();
    if (!isInMiniApp) {
      return false;
    }

    // Check if quickAuth is available on the SDK
    if (!sdk.quickAuth || typeof sdk.quickAuth.getToken !== "function") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function QuickAuthProvider({ children }: QuickAuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [fid, setFid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check availability first
      const available = await isQuickAuthAvailable();
      if (!available) {
        setError(
          "Farcaster connection is only available in Warpcast or Farcaster app. Please open this app in Warpcast to connect."
        );
        setIsLoading(false);
        return;
      }

      // Get Quick Auth token from Farcaster SDK
      const { token: farcasterToken } = await sdk.quickAuth.getToken();

      // Send token to backend for verification and session creation
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: farcasterToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Authentication failed");
      }

      const data = await response.json();

      // Store token and user data
      setToken(data.token);
      setFid(data.user.fid);
      setWalletAddress(data.user.walletAddress);

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_fid", String(data.user.fid));
        localStorage.setItem("auth_walletAddress", data.user.walletAddress);
      }

      // Notify SDK that app is ready
      await sdk.actions.ready();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      console.error("Quick Auth sign-in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setToken(null);
    setFid(null);
    setWalletAddress(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_fid");
      localStorage.removeItem("auth_walletAddress");
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        if (typeof window === "undefined") return;

        const storedToken = localStorage.getItem("auth_token");
        const storedFid = localStorage.getItem("auth_fid");
        const storedWalletAddress = localStorage.getItem("auth_walletAddress");

        if (storedToken && storedFid) {
          // Verify token is still valid by checking expiration
          try {
            const payload = JSON.parse(atob(storedToken.split(".")[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp > now) {
              setToken(storedToken);
              setFid(Number(storedFid));
              setWalletAddress(storedWalletAddress);
            } else {
              // Token expired, clear it
              signOut();
            }
          } catch {
            // Invalid token, clear it
            signOut();
          }
        }
      } catch (err) {
        console.error("Error checking existing session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const value: QuickAuthContextType = {
    token,
    fid,
    walletAddress,
    isAuthenticated: !!token,
    isLoading,
    error,
    signIn,
    signOut,
  };

  return (
    <QuickAuthContext.Provider value={value}>
      {children}
    </QuickAuthContext.Provider>
  );
}

export function useQuickAuth(): QuickAuthContextType {
  const context = useContext(QuickAuthContext);
  if (context === undefined) {
    throw new Error("useQuickAuth must be used within a QuickAuthProvider");
  }
  return context;
}
