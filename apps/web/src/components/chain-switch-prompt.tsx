"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { selectedChain } from "@/lib/chain";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useChain } from "@/hooks/use-chain";
import { useMiniPay } from "@/hooks/use-minipay";

/**
 * Component that detects if user is on the wrong chain and prompts them to switch
 * The expected chain is determined by environment variables (NEXT_PUBLIC_CHAIN or NEXT_PUBLIC_VERCEL_ENV)
 */
export function ChainSwitchPrompt() {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { chain: currentChain } = useChain();
  const isInMiniPay = useMiniPay();
  const {
    switchChain,
    isPending,
    error,
    data: switchChainData,
  } = useSwitchChain();
  const [showDialog, setShowDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userClosed, setUserClosed] = useState(false);

  const expectedChainId = selectedChain.id;
  const isWrongChain = isConnected && chainId !== expectedChainId;

  // Open the modal when chain is wrong (only if user hasn't manually closed it)
  // Never auto-close - user must manually close it, no matter what
  useEffect(() => {
    if (isWrongChain && !userClosed) {
      setShowDialog(true);
      setErrorMessage(null);
    }
    // Never auto-close, even when chain becomes correct
    // User must manually close it
  }, [isWrongChain, userClosed]);

  // Clear error when chain changes
  useEffect(() => {
    if (!isWrongChain) {
      setErrorMessage(null);
    }
  }, [chainId, isWrongChain]);

  // For MiniPay: Don't show chain switch prompt - automatically adapt to whatever chain MiniPay is connected to
  // MiniPay users must manually switch chains in the MiniPay app, so we just use whatever chain they're on
  if (isInMiniPay) {
    return null;
  }

  const handleSwitchChain = async () => {
    if (switchChain) {
      try {
        await switchChain({ chainId: expectedChainId });
      } catch (err) {
        // Handle switch chain errors
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else if (typeof err === "object" && err !== null) {
          const errorObj = err as any;
          setErrorMessage(
            errorObj.message ||
              errorObj.error?.message ||
              "Failed to switch chain. Please try again."
          );
        } else {
          setErrorMessage("Failed to switch chain. Please try again.");
        }
      }
    }
  };

  // Only show dialog if connected and either on wrong chain or dialog was manually opened
  // Don't hide component when chain becomes correct - let user manually close
  if (!isConnected || (!isWrongChain && !showDialog)) {
    return null;
  }

  const chainName = selectedChain.name;

  return (
    <AlertDialog
      open={showDialog}
      onOpenChange={(open) => {
        // Allow users to manually close the modal
        setShowDialog(open);
        if (!open) {
          // Track that user manually closed it
          setUserClosed(true);
        }
        // If user closes and still on wrong chain, it won't reopen automatically
        // They can continue using the app (though some features may not work)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isWrongChain ? "Wrong Network" : "Network Switched"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-2">
              <div>
                You are currently connected to{" "}
                <strong>{currentChain.name}</strong> (Chain ID: {chainId}).
              </div>
              {isWrongChain ? (
                <div>
                  Please switch to <strong>{chainName}</strong> (Chain ID:{" "}
                  {expectedChainId}) to continue using this application.
                </div>
              ) : (
                <div className="text-green-600 dark:text-green-400">
                  ✓ Successfully switched to <strong>{chainName}</strong>! You
                  can now close this dialog.
                </div>
              )}
            </div>
            {errorMessage && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}
            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error.message || "An error occurred while switching chains."}
              </div>
            )}
            {switchChainData && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                <div className="font-medium">Switch initiated:</div>
                <div className="mt-1 break-all text-xs">
                  {typeof switchChainData === "string" ? (
                    <code className="bg-muted px-2 py-1 rounded">
                      {switchChainData}
                    </code>
                  ) : (
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(switchChainData, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleSwitchChain}
            disabled={isPending}
            className="bg-[#35D07F] hover:bg-[#2db86a] text-white"
          >
            {isPending ? "Switching..." : `Switch to ${chainName}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
