"use client";

import { useEffect, useState } from "react";
import { isMiniPay as checkMiniPay } from "@/lib/wagmi";

/**
 * Hook to detect if running in MiniPay environment
 * @returns boolean indicating if app is running in MiniPay
 */
export function useMiniPay(): boolean {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    setIsMiniPay(checkMiniPay());
  }, []);

  return isMiniPay;
}

/**
 * Hook to get user address in MiniPay (without additional libraries)
 * @returns user address or null
 */
export function useMiniPayAddress(): string | null {
  const [address, setAddress] = useState<string | null>(null);
  const isInMiniPay = useMiniPay();

  useEffect(() => {
    if (isInMiniPay && typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_requestAccounts", params: [] })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            setAddress(accounts[0]);
          }
        })
        .catch((error: Error) => {
          console.error("Error getting MiniPay address:", error);
        });
    }
  }, [isInMiniPay]);

  return address;
}
