"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { selectedChain } from "@/contexts/frame-wallet-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Component that detects if user is on the wrong chain and prompts them to switch
 */
export function ChainSwitchPrompt() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [showDialog, setShowDialog] = useState(false);

  const expectedChainId = selectedChain.id;
  const isWrongChain = isConnected && chainId !== expectedChainId;

  useEffect(() => {
    if (isWrongChain) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [isWrongChain]);

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: expectedChainId });
    }
  };

  if (!isConnected || !isWrongChain) {
    return null;
  }

  const chainName = selectedChain.name;

  return (
    <AlertDialog 
      open={showDialog} 
      onOpenChange={(open) => {
        // Allow closing, but it will reopen if still on wrong chain
        setShowDialog(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Wrong Network</AlertDialogTitle>
          <AlertDialogDescription>
            You are connected to a different network. Please switch to{" "}
            <strong>{chainName}</strong> to continue using this application.
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

