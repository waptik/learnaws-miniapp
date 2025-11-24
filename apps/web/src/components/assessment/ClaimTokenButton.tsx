"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
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
import { AssessmentResult } from "@/types/assessment";

interface ClaimTokenButtonProps {
  result: AssessmentResult;
}

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
  const { address, isConnected } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (result.passFail !== "PASS") {
      setError("You must pass the assessment to claim tokens");
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      // Validate claim eligibility via API
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
        return;
      }

      // TODO: Call smart contract to actually claim tokens
      // For now, we just validate eligibility
      // The actual contract call will be implemented in the next phase
      console.log("Claim validated:", validationData);
      const remainingClaims =
        validationData.maxDailyClaims - validationData.dailyCount;
      setSuccessMessage(
        `Claim validated! You can claim ${remainingClaims} more time(s) today. Smart contract integration coming soon.`
      );
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim tokens");
    } finally {
      setIsClaiming(false);
    }
  };

  if (result.passFail !== "PASS") {
    return null;
  }

  return (
    <>
      <div>
        <Button
          onClick={handleClaim}
          disabled={isClaiming || !isConnected}
          className="w-full bg-[#35D07F] hover:bg-[#2db86a] text-white font-bold py-3 px-6"
        >
          {isClaiming ? "Claiming..." : "Claim Token"}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
            {error}
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
