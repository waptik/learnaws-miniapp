"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  verifications?: string[];
}

interface UseFarcasterReturn {
  user: FarcasterUser | null;
  isLoading: boolean;
  isInFarcaster: boolean;
  connectWallet: () => Promise<void>;
  error: string | null;
}

export function useFarcaster(): UseFarcasterReturn {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
    checkFarcasterEnvironment();
  }, []);

  const checkFarcasterEnvironment = () => {
    // Check if we're in Farcaster frame/miniapp
    const isFrame =
      typeof window !== "undefined" &&
      (window.parent !== window ||
        document.referrer.includes("warpcast.com") ||
        document.referrer.includes("farcaster.xyz") ||
        window.location.search.includes("frame=") ||
        navigator.userAgent.includes("Warpcast"));

    setIsInFarcaster(isFrame);
  };

  const loadUserData = useCallback(async () => {
    if (!mounted) return;

    try {
      setIsLoading(true);
      setError(null);

      // Try to get Farcaster user data from various sources
      let userData: FarcasterUser | null = null;

      // Method 1: Check for Farcaster SDK
      if (typeof window !== "undefined" && (window as any).fc) {
        try {
          const fcUser = await (window as any).fc.getUser();
          if (fcUser) {
            userData = {
              fid: fcUser.fid,
              username: fcUser.username,
              displayName: fcUser.displayName,
              pfpUrl: fcUser.pfpUrl,
              bio: fcUser.bio,
              followerCount: fcUser.followerCount,
              followingCount: fcUser.followingCount,
              verifications: fcUser.verifications,
            };
          }
        } catch (err) {
          console.log("Farcaster SDK not available or failed");
        }
      }

      // Method 2: Check URL parameters for frame data
      if (!userData && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const fid = urlParams.get("fid");
        const username = urlParams.get("username");

        if (fid || username) {
          userData = {
            fid: fid ? parseInt(fid) : undefined,
            username: username || undefined,
            displayName: urlParams.get("displayName") || undefined,
            pfpUrl: urlParams.get("pfpUrl") || undefined,
          };
        }
      }

      // Method 3: Check localStorage for cached user data
      if (!userData && typeof window !== "undefined") {
        const cachedUser = localStorage.getItem("farcaster_user");
        if (cachedUser) {
          try {
            userData = JSON.parse(cachedUser);
          } catch (err) {
            console.log("Failed to parse cached user data");
          }
        }
      }

      // Method 4: Create mock user for development/fallback
      if (!userData && isConnected && address) {
        userData = {
          fid: Math.floor(Math.random() * 100000),
          username: `user_${address.slice(-6)}`,
          displayName: `User ${address.slice(-4)}`,
          pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
          bio: "Swipevest investor",
          followerCount: Math.floor(Math.random() * 1000),
          followingCount: Math.floor(Math.random() * 500),
          verifications: [address],
        };
      }

      // Only update state if component is still mounted
      if (mounted) {
        setUser(userData);

        // Cache user data
        if (userData && typeof window !== "undefined") {
          localStorage.setItem("farcaster_user", JSON.stringify(userData));
        }
      }
    } catch (err: any) {
      console.error("Error loading user data:", err);
      if (mounted) {
        setError(err.message || "Failed to load user data");
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  }, [mounted, isConnected, address]);

  useEffect(() => {
    if (!mounted) return;

    if (isConnected && address) {
      loadUserData();
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [mounted, isConnected, address, loadUserData]);

  const connectWallet = async () => {
    try {
      if (mounted) {
        setError(null);
      }
      // This will be handled by the wagmi connector
      // The useAccount hook will trigger loadUserData when connected
    } catch (err: any) {
      if (mounted) {
        setError(err.message || "Failed to connect wallet");
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, []);

  return {
    user,
    isLoading,
    isInFarcaster,
    connectWallet,
    error,
  };
}
