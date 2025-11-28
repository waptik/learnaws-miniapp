"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
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
import { useToast } from "@/hooks/use-toast";
import { AssessmentResult } from "@/types/assessment";
import {
  ASSESSMENT_REWARDS_ADDRESS,
  ASSESSMENT_REWARDS_ABI,
  stringToBytes32,
  generateAssessmentIdHash,
  getBlockExplorerUrl,
} from "@/lib/contracts";
import { selectedChain } from "@/contexts/frame-wallet-context";
import { celoSepolia } from "wagmi/chains";

interface ClaimTokenButtonProps {
  result: AssessmentResult;
}

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showChainDialog, setShowChainDialog] = useState(false);

  // Wagmi hooks for contract interaction
  const {
    writeContract,
    data: hash,
    isPending: isPendingWrite,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Show toast notifications for transaction status
  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Tokens Claimed! 🎉",
        description: "Your reward tokens have been minted successfully.",
      });
      setSuccessMessage("Your tokens have been successfully claimed!");
      setShowSuccessDialog(true);
    }
  }, [isSuccess, hash, toast]);

  useEffect(() => {
    if (writeError) {
      const errorMessage =
        writeError.message || "Transaction failed. Please try again.";
      setError(errorMessage);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  useEffect(() => {
    if (receiptError) {
      const errorMessage =
        receiptError.message || "Transaction confirmation failed.";
      setError(errorMessage);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [receiptError, toast]);

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (result.passFail !== "PASS") {
      setError("You must pass the assessment to claim tokens");
      return;
    }

    // Check if user is on the correct chain
    const expectedChainId = selectedChain.id;
    if (chainId !== expectedChainId) {
      setShowChainDialog(true);
      setError(`Please switch to ${selectedChain.name} to claim tokens`);
      return;
    }

    setError(null);

    try {
      // Validate claim eligibility via API first
      const validationResponse = await fetch("/api/assessment/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: result.assessmentId,
          candidateAddress: address,
          score: result.scaledScore,
        }),
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json();
        throw new Error(errorData.error || "Failed to validate claim");
      }

      const validationData = await validationResponse.json();

      if (!validationData.canClaim) {
        setError(validationData.reason || "Cannot claim tokens at this time");
        toast({
          title: "Cannot Claim",
          description:
            validationData.reason || "Cannot claim tokens at this time",
          variant: "destructive",
        });
        return;
      }

      // Generate assessment ID hash
      const assessmentIdHash = generateAssessmentIdHash(
        result.assessmentId,
        address,
        result.scaledScore
      );
      const assessmentIdBytes32 = stringToBytes32(assessmentIdHash);

      // Call smart contract to claim tokens
      writeContract({
        address: ASSESSMENT_REWARDS_ADDRESS,
        abi: ASSESSMENT_REWARDS_ABI,
        functionName: "claimReward",
        args: [BigInt(result.scaledScore), assessmentIdBytes32],
      });

      toast({
        title: "Transaction Submitted",
        description: "Please confirm the transaction in your wallet.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to claim tokens";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: selectedChain.id });
      setShowChainDialog(false);
    }
  };

  const isPending = isPendingWrite || isConfirming || isSwitchingChain;

  if (result.passFail !== "PASS") {
    return null;
  }

  // Determine if we're on testnet to show faucet info
  // Celo Sepolia is the testnet, Celo is mainnet
  const isTestnet = selectedChain.id === celoSepolia.id;
  const faucetUrl = isTestnet ? "https://faucet.celo.org/celo-sepolia" : null;

  return (
    <>
      <div>
        {isTestnet && isConnected && !isSuccess && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Note:</strong> {"You'll"} need <strong>CELO</strong>{" "}
              tokens on {selectedChain.name} to pay for gas fees.
            </p>
            {faucetUrl && (
              <div className="space-y-1">
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium block"
                >
                  Get free testnet CELO tokens from faucet →
                </a>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {`If your wallet shows "missing token" in the faucet link, you
                  can still use the faucet directly or copy your wallet address
                  to receive tokens.`}
                </p>
              </div>
            )}
          </div>
        )}
        <Button
          onClick={handleClaim}
          disabled={isPending || !isConnected || isSuccess}
          className="w-full bg-[#35D07F] hover:bg-[#2db86a] text-white font-bold py-3 px-6 disabled:opacity-50"
        >
          {isSwitchingChain
            ? "Switching Network..."
            : isPendingWrite
            ? "Confirming..."
            : isConfirming
            ? "Processing..."
            : isSuccess
            ? "Claimed ✓"
            : "Claim Token"}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}
        {hash && (
          <div className="mt-2 text-center space-y-2">
            {isConfirming && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Transaction submitted. Waiting for confirmation...
              </p>
            )}
            <a
              href={getBlockExplorerUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              View transaction on block explorer
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tokens Claimed! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              {successMessage}
              {hash && (
                <div className="mt-3 pt-3 border-t">
                  <a
                    href={getBlockExplorerUrl(hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    View transaction on block explorer
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wrong Network</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be connected to <strong>{selectedChain.name}</strong>{" "}
              to claim tokens. Please switch your network to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleSwitchChain}
              disabled={isSwitchingChain}
              className="bg-[#35D07F] hover:bg-[#2db86a] text-white"
            >
              {isSwitchingChain
                ? "Switching..."
                : `Switch to ${selectedChain.name}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
