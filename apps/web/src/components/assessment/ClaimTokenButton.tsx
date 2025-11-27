"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
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
} from "@/lib/contracts";

interface ClaimTokenButtonProps {
  result: AssessmentResult;
}

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

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

  const isPending = isPendingWrite || isConfirming;

  if (result.passFail !== "PASS") {
    return null;
  }

  return (
    <>
      <div>
        <Button
          onClick={handleClaim}
          disabled={isPending || !isConnected || isSuccess}
          className="w-full bg-[#35D07F] hover:bg-[#2db86a] text-white font-bold py-3 px-6 disabled:opacity-50"
        >
          {isPendingWrite
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
        {hash && isConfirming && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 text-center">
            Transaction submitted. Waiting for confirmation...
          </p>
        )}
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Claim Validated</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
