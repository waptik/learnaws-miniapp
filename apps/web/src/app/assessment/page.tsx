"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Question, Answer } from "@/types/assessment";
import { getEffectiveQuestionType } from "@/lib/question-utils";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { Button } from "@/components/ui/button";
import {
  useAssessmentQuestions,
  useAssessmentAnswers,
  useUpdateAnswer,
  saveAssessmentData,
  getOrCreateAssessmentId,
  isReviewMode,
  setReviewMode,
  getReviewQuestionIndex,
  setReviewQuestionIndex,
  getCurrentIndex,
  saveCurrentIndex,
} from "@/hooks/use-assessment";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export default function AssessmentPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [currentIndex, setCurrentIndexState] = useState(() =>
    getCurrentIndex()
  );
  const [assessmentId] = useState(() => getOrCreateAssessmentId());
  // Check if coming from review
  const fromReview = isReviewMode();
  const reviewQuestionIndex = getReviewQuestionIndex();

  // Wrapper to save index whenever it changes
  const setCurrentIndex = (index: number) => {
    setCurrentIndexState(index);
    saveCurrentIndex(index);
  };

  // Load questions and answers using React Query
  const {
    data: questions = [],
    isLoading: questionsLoading,
    error: questionsError,
  } = useAssessmentQuestions(fromReview);

  const {
    data: answers = new Map<string, Answer>(),
    isLoading: answersLoading,
    error: answersError,
  } = useAssessmentAnswers();

  const updateAnswerMutation = useUpdateAnswer();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Restore current index from storage when questions load (for refresh persistence)
  // Only restore if not coming from review (review navigation is handled separately)
  useEffect(() => {
    if (questions.length > 0 && !fromReview && reviewQuestionIndex === null) {
      const savedIndex = getCurrentIndex();
      if (savedIndex >= 0 && savedIndex < questions.length) {
        setCurrentIndex(savedIndex);
      }
    }
  }, [questions.length, fromReview, reviewQuestionIndex]);

  // Navigate to specific question if coming from review
  useEffect(() => {
    if (fromReview && reviewQuestionIndex !== null && questions.length > 0) {
      const index = reviewQuestionIndex;
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
      }
      // Clear review question index but keep review mode so user can go back
      setReviewQuestionIndex(null);
    }
  }, [fromReview, reviewQuestionIndex, questions.length]);

  const isLoading = questionsLoading || answersLoading;
  const hasError = questionsError || answersError;

  // Log errors for debugging
  useEffect(() => {
    if (questionsError) {
      console.error("Questions loading error:", questionsError);
    }
    if (answersError) {
      console.error("Answers loading error:", answersError);
    }
    if (updateAnswerMutation.isError) {
      console.error("Answer update error:", updateAnswerMutation.error);
    }
  }, [
    questionsError,
    answersError,
    updateAnswerMutation.isError,
    updateAnswerMutation.error,
  ]);

  const handleAnswerChange = (selected: string | string[]) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    updateAnswerMutation.mutate({
      questionId: currentQuestion.id,
      selected,
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Clear invalid selections for current question before navigating
      const currentQuestion = questions[currentIndex];
      const currentEffectiveType = currentQuestion
        ? getEffectiveQuestionType(currentQuestion)
        : null;
      if (currentQuestion && currentEffectiveType === "multiple-response") {
        const currentAnswer = answers.get(currentQuestion.id);
        if (currentAnswer) {
          const selected = Array.isArray(currentAnswer.selected)
            ? currentAnswer.selected
            : currentAnswer.selected !== null
            ? [currentAnswer.selected]
            : [];

          // Clear if more than 2 answers (keep first 2)
          if (selected.length > 2) {
            const validSelection = selected.slice(0, 2);
            updateAnswerMutation.mutate({
              questionId: currentQuestion.id,
              selected: validSelection,
            });
          }
          // Clear if exactly 1 answer (user must select 0 or 2)
          else if (selected.length === 1) {
            updateAnswerMutation.mutate({
              questionId: currentQuestion.id,
              selected: null,
            });
          }
        }
      }

      // Clear invalid selections for previous question when navigating to it
      const previousQuestion = questions[currentIndex - 1];
      const previousEffectiveType = previousQuestion
        ? getEffectiveQuestionType(previousQuestion)
        : null;
      if (previousQuestion && previousEffectiveType === "multiple-response") {
        const previousAnswer = answers.get(previousQuestion.id);
        if (previousAnswer) {
          const selected = Array.isArray(previousAnswer.selected)
            ? previousAnswer.selected
            : previousAnswer.selected !== null
            ? [previousAnswer.selected]
            : [];

          // Clear if more than 2 answers (keep first 2)
          if (selected.length > 2) {
            const validSelection = selected.slice(0, 2);
            updateAnswerMutation.mutate({
              questionId: previousQuestion.id,
              selected: validSelection,
            });
          }
          // Clear if exactly 1 answer (user must select 0 or 2)
          else if (selected.length === 1) {
            updateAnswerMutation.mutate({
              questionId: previousQuestion.id,
              selected: null,
            });
          }
        }
      }
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const currentAnswer = answers.get(currentQuestion.id);
    const effectiveType = getEffectiveQuestionType(currentQuestion);

    // For multiple-response: allow proceeding only if 0 or 2 answers selected
    // For multiple-choice: allow proceeding only if answered or user confirms
    if (effectiveType === "multiple-response") {
      const selected =
        currentAnswer && Array.isArray(currentAnswer.selected)
          ? currentAnswer.selected
          : currentAnswer && currentAnswer.selected !== null
          ? [currentAnswer.selected]
          : [];

      // Block proceeding if exactly 1 answer is selected
      if (selected.length === 1) {
        return; // Do not allow proceeding with only 1 answer
      }

      // Prompt if no answer is selected (0 answers)
      if (selected.length === 0) {
        const shouldProceed = await confirm({
          title: "No Answer Selected",
          description:
            "You have not selected any answers. Multiple-response questions require exactly 2 answers or none. Do you want to proceed without answering this question?",
          confirmText: "Proceed",
          cancelText: "Cancel",
        });
        if (!shouldProceed) {
          return;
        }
      }

      // Only allow if 0 or 2 answers selected
      if (selected.length > 2) {
        const shouldProceed = await confirm({
          title: "Too Many Answers Selected",
          description:
            "You have selected more than 2 answers. Multiple-response questions require exactly 2 answers or none. Do you want to proceed without completing this question?",
          confirmText: "Proceed",
          cancelText: "Cancel",
        });
        if (!shouldProceed) {
          return;
        }
        // Clear invalid selection if user confirms to proceed
        updateAnswerMutation.mutate({
          questionId: currentQuestion.id,
          selected: null,
        });
      }
    } else {
      // Multiple-choice: prompt if not answered
      const hasAnswer =
        currentAnswer &&
        currentAnswer.selected !== null &&
        (Array.isArray(currentAnswer.selected)
          ? currentAnswer.selected.length > 0
          : true);

      if (!hasAnswer) {
        const shouldProceed = await confirm({
          title: "No Answer Selected",
          description:
            "You have not answered this question. Do you want to proceed without answering?",
          confirmText: "Proceed",
          cancelText: "Cancel",
        });
        if (!shouldProceed) {
          return;
        }
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleReview = () => {
    // Save assessment data
    saveAssessmentData(questions, answers, assessmentId, address || "");

    // Navigate to review page
    router.push("/review");
  };

  const handleBackToReview = () => {
    // Save current state before going back
    saveAssessmentData(questions, answers, assessmentId, address || "");
    // Keep review mode enabled
    setReviewMode(true);
    router.push("/review");
  };

  if (isLoading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading assessment...
          </p>
        </div>
      </main>
    );
  }

  if (hasError || questions.length === 0) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400 mb-4">
            {questionsError
              ? "Failed to load questions"
              : answersError
              ? "Failed to load answers"
              : "No questions available"}
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id)
    : undefined;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const inReviewMode = isReviewMode();

  // Calculate actual answered count (only valid answers)
  const answeredCount = questions.filter((q) => {
    const answer = answers.get(q.id);
    if (!answer || answer.selected === null) return false;

    const effectiveType = getEffectiveQuestionType(q);
    if (effectiveType === "multiple-response") {
      const selected = Array.isArray(answer.selected)
        ? answer.selected
        : [answer.selected];
      return selected.length === 2; // Must have exactly 2 for multiple response
    }

    return true; // Any answer is valid for multiple choice
  }).length;

  // Check if Next button should be hidden (1 answer selected for multiple-response)
  const shouldHideNext = (() => {
    if (!currentQuestion || !currentAnswer) {
      return false;
    }
    const effectiveType = getEffectiveQuestionType(currentQuestion);
    if (effectiveType !== "multiple-response") {
      return false;
    }
    const selected = Array.isArray(currentAnswer.selected)
      ? currentAnswer.selected
      : currentAnswer.selected !== null
      ? [currentAnswer.selected]
      : [];
    return selected.length === 1;
  })();

  return (
    <main className="flex-1 min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              AWS Practice Assessment
            </h1>
            {inReviewMode && (
              <Button
                onClick={handleBackToReview}
                variant="outline"
                className="px-4 border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Back to Review
              </Button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            CLF-C02 Practice Exam
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar current={currentIndex + 1} total={questions.length} />

        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            answer={currentAnswer}
            onAnswerChange={handleAnswerChange}
          />
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            variant="outline"
            className="px-6 border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {answeredCount} of {questions.length} answered
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleReview}
              className="px-6 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Review
            </Button>
          ) : shouldHideNext ? null : (
            <Button
              onClick={handleNext}
              className="px-6 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Next
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </main>
  );
}
