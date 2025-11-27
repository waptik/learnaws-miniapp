"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Question, Answer, AssessmentResult } from "@/types/assessment";
import { calculateAssessmentResult } from "@/lib/scoring";
import { ScoreDisplay } from "@/components/assessment/ScoreDisplay";
import { DomainBreakdown } from "@/components/assessment/DomainBreakdown";
import { ClaimTokenButton } from "@/components/assessment/ClaimTokenButton";
import { TokenBalance } from "@/components/wallet/TokenBalance";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load assessment data from sessionStorage
    const questionsJson = sessionStorage.getItem("assessmentQuestions");
    const answersJson = sessionStorage.getItem("assessmentAnswers");
    const assessmentId = sessionStorage.getItem("assessmentId");
    const storedAddress = sessionStorage.getItem("candidateAddress");
    const candidateAddress = storedAddress || address || "";

    if (!questionsJson || !answersJson || !assessmentId || !candidateAddress) {
      // Redirect to home if no assessment data
      router.push("/");
      return;
    }

    // TypeScript now knows these are not null after the check above
    const validAssessmentId: string = assessmentId;
    const validCandidateAddress: string = candidateAddress;
    const validQuestionsJson: string = questionsJson;
    const validAnswersJson: string = answersJson;

    async function submitAssessment() {
      try {
        const questions: Question[] = JSON.parse(validQuestionsJson);
        const answers: Answer[] = JSON.parse(validAnswersJson);

        // Submit to API for scoring
        const response = await fetch("/api/assessment/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: validAssessmentId,
            candidateAddress: validCandidateAddress,
            questions,
            answers,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit assessment");
        }

        const data = await response.json();
        setResult(data.result);
      } catch (error) {
        console.error("Failed to submit assessment:", error);
        // Fallback to client-side calculation if API fails
        try {
          const questions: Question[] = JSON.parse(validQuestionsJson);
          const answers: Answer[] = JSON.parse(validAnswersJson);
          const assessmentResult = calculateAssessmentResult(
            questions,
            answers,
            validCandidateAddress,
            validAssessmentId
          );
          setResult(assessmentResult);
        } catch (fallbackError) {
          console.error("Fallback calculation also failed:", fallbackError);
          router.push("/");
        }
      } finally {
        setIsLoading(false);
      }
    }

    submitAssessment();
  }, [router, address]);

  const handleTakeAnother = () => {
    // Clear session storage
    sessionStorage.removeItem("assessmentQuestions");
    sessionStorage.removeItem("assessmentAnswers");
    sessionStorage.removeItem("assessmentId");
    sessionStorage.removeItem("candidateAddress");

    // Navigate to assessment
    router.push("/assessment");
  };

  if (isLoading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Calculating results...
          </p>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400 mb-4">
            No assessment results found
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Token Balance */}
        <div className="mb-6 flex justify-end">
          <TokenBalance />
        </div>

        {/* Score Display */}
        <ScoreDisplay result={result} />

        {/* Domain Breakdown */}
        <DomainBreakdown domainPerformance={result.domainPerformance} />

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <div className="flex-1">
            <ClaimTokenButton result={result} />
          </div>
          <Button
            onClick={handleTakeAnother}
            variant="outline"
            className="flex-1 border-2 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Take Another Assessment
          </Button>
        </div>
      </div>
    </main>
  );
}
