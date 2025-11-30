"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Question, Answer, AssessmentResult } from "@/types/assessment";
import { calculateAssessmentResult } from "@/lib/scoring";
import { ScoreDisplay } from "@/components/assessment/ScoreDisplay";
import { DomainBreakdown } from "@/components/assessment/DomainBreakdown";
import { ClaimTokenButton } from "@/components/assessment/ClaimTokenButton";
import { TokenBalance } from "@/components/wallet/TokenBalance";
import { Button } from "@/components/ui/button";
import { getCourseById } from "@/lib/courses";

export default function CourseResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const courseId = params.courseId as string;
  const course = getCourseById(courseId);

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate course exists
  useEffect(() => {
    if (!course) {
      router.push("/");
      return;
    }
  }, [course, router]);

  useEffect(() => {
    // Load assessment data from sessionStorage
    const questionsJson = sessionStorage.getItem("assessmentQuestions");
    const answersJson = sessionStorage.getItem("assessmentAnswers");
    const assessmentId = sessionStorage.getItem("assessmentId");
    const storedAddress = sessionStorage.getItem("candidateAddress");
    const walletDisconnected = sessionStorage.getItem("walletDisconnected") === "true";
    const disconnectedAddress = sessionStorage.getItem("disconnectedAddress");
    const storedCourseId = sessionStorage.getItem("currentCourseId");
    
    // Verify courseId matches
    if (storedCourseId && storedCourseId !== courseId) {
      router.push("/");
      return;
    }
    
    // Use disconnected address if wallet was disconnected, otherwise use current address
    const candidateAddress = walletDisconnected && disconnectedAddress
      ? disconnectedAddress
      : storedAddress || address || "";

    if (!questionsJson || !answersJson || !assessmentId || !candidateAddress) {
      // Redirect to course page if no assessment data
      router.push(`/courses/${courseId}`);
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
        const walletDisconnected = sessionStorage.getItem("walletDisconnected") === "true";

        // If wallet was disconnected, mark as unscored (no rewards)
        if (walletDisconnected) {
          // Calculate result but mark as unscored
          const assessmentResult = calculateAssessmentResult(
            questions,
            answers,
            validCandidateAddress,
            validAssessmentId
          );
          // Mark as unscored - no rewards eligible
          const unscoredResult = {
            ...assessmentResult,
            passFail: "FAIL" as const, // Force FAIL to prevent rewards
            scaledScore: assessmentResult.scaledScore, // Keep score for display
            unscored: true, // Flag to indicate no rewards
            courseId: courseId, // Add course context
            certificationCode: course?.certificationCode || null,
            rewardTokenSymbol: course?.rewardTokenSymbol || "AWSP",
          };
          setResult(unscoredResult);
          setIsLoading(false);
          return;
        }

        // Submit to API for scoring (only if wallet was connected)
        const response = await fetch("/api/assessment/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: validAssessmentId,
            candidateAddress: validCandidateAddress,
            questions,
            answers,
            courseId: courseId, // Include courseId in API call
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit assessment");
        }

        const data = await response.json();
        // Add course context to result
        const resultWithCourse = {
          ...data.result,
          courseId: courseId,
          certificationCode: course?.certificationCode || null,
          rewardTokenSymbol: course?.rewardTokenSymbol || "AWSP",
        };
        setResult(resultWithCourse);
      } catch (error) {
        console.error("Failed to submit assessment:", error);
        // Fallback to client-side calculation if API fails
        try {
          const questions: Question[] = JSON.parse(validQuestionsJson);
          const answers: Answer[] = JSON.parse(validAnswersJson);
          const walletDisconnected = sessionStorage.getItem("walletDisconnected") === "true";
          
          const assessmentResult = calculateAssessmentResult(
            questions,
            answers,
            validCandidateAddress,
            validAssessmentId
          );
          
          // Mark as unscored if wallet was disconnected
          if (walletDisconnected) {
            const unscoredResult = {
              ...assessmentResult,
              passFail: "FAIL" as const,
              unscored: true,
              courseId: courseId,
              certificationCode: course?.certificationCode || null,
              rewardTokenSymbol: course?.rewardTokenSymbol || "AWSP",
            };
            setResult(unscoredResult);
          } else {
            const resultWithCourse = {
              ...assessmentResult,
              courseId: courseId,
              certificationCode: course?.certificationCode || null,
              rewardTokenSymbol: course?.rewardTokenSymbol || "AWSP",
            };
            setResult(resultWithCourse);
          }
        } catch (fallbackError) {
          console.error("Fallback calculation also failed:", fallbackError);
          router.push(`/courses/${courseId}`);
        }
      } finally {
        setIsLoading(false);
      }
    }

    submitAssessment();
  }, [router, address, courseId, course]);

  const handleTakeAnother = () => {
    // Clear session storage
    sessionStorage.removeItem("assessmentQuestions");
    sessionStorage.removeItem("assessmentAnswers");
    sessionStorage.removeItem("assessmentId");
    sessionStorage.removeItem("candidateAddress");
    sessionStorage.removeItem("currentCourseId");

    // Navigate to course assessment
    router.push(`/courses/${courseId}/assessment`);
  };

  if (!course) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading course...
          </p>
        </div>
      </main>
    );
  }

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
          <Button onClick={() => router.push(`/courses/${courseId}`)}>Back to Course</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push(`/courses/${courseId}`)}
          variant="outline"
          className="mb-6 border-2 border-black dark:border-white"
        >
          ← Back to Course
        </Button>

        {/* Course Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-1">
            {course.name}
          </h1>
          {course.certificationCode && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {course.certificationCode} Practice Exam Results
            </p>
          )}
        </div>

        {/* Token Balance */}
        <div className="mb-6 flex justify-end">
          <TokenBalance />
        </div>

        {/* Score Display */}
        <ScoreDisplay result={result} />

        {/* Domain Breakdown */}
        <DomainBreakdown domainPerformance={result.domainPerformance} />

        {/* Unscored Warning */}
        {result.unscored && (
          <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-black dark:text-white mb-1">
                  Assessment Unscored - No Rewards
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your wallet was disconnected during this assessment. While you can see your score, this assessment is not eligible for token rewards. Please keep your wallet connected throughout the assessment to earn rewards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          {!result.unscored && (
          <div className="flex-1">
            <ClaimTokenButton result={result} />
          </div>
          )}
          <Button
            onClick={handleTakeAnother}
            variant="outline"
            className={result.unscored ? "w-full" : "flex-1 border-2 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-800"}
          >
            Take Another Assessment
          </Button>
        </div>
      </div>
    </main>
  );
}


