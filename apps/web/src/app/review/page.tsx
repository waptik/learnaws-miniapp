"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Question, Answer } from "@/types/assessment";
import { Button } from "@/components/ui/button";
import { getEffectiveQuestionType } from "@/lib/question-utils";
import {
  useAssessmentQuestions,
  useAssessmentAnswers,
  setReviewMode,
  setReviewQuestionIndex,
} from "@/hooks/use-assessment";

export default function ReviewPage() {
  const router = useRouter();
  const { address } = useAccount();

  // Load questions and answers using React Query
  const {
    data: questions = [],
    isLoading: questionsLoading,
    error: questionsError,
  } = useAssessmentQuestions(true); // Load from storage

  const {
    data: answers = new Map<string, Answer>(),
    isLoading: answersLoading,
  } = useAssessmentAnswers();

  const isLoading = questionsLoading || answersLoading;

  // Redirect if no data available
  useEffect(() => {
    if (!isLoading && (questionsError || questions.length === 0)) {
      router.push("/");
    }
  }, [isLoading, questionsError, questions.length, router]);

  const getAnswerStatus = (question: Question): "answered" | "unanswered" => {
    const answer = answers.get(question.id);
    if (
      !answer ||
      answer.selected === null ||
      (Array.isArray(answer.selected) && answer.selected.length === 0)
    ) {
      return "unanswered";
    }

    const effectiveType = getEffectiveQuestionType(question);
    if (effectiveType === "multiple-response") {
      const selected = Array.isArray(answer.selected)
        ? answer.selected
        : [answer.selected];
      // For multiple response, must have exactly 2 answers to be considered answered
      return selected.length === 2 ? "answered" : "unanswered";
    }

    // For multiple choice, any non-null selection is considered answered
    return answer.selected ? "answered" : "unanswered";
  };

  const handleViewQuestion = (questionIndex: number) => {
    // Set review mode so assessment page knows we're coming from review
    setReviewMode(true);
    setReviewQuestionIndex(questionIndex);

    // Get courseId from sessionStorage or default to old route
    const courseId = sessionStorage.getItem("currentCourseId");
    if (courseId) {
      router.push(`/courses/${courseId}/assessment`);
    } else {
      // Fallback to old route for backwards compatibility
      router.push("/assessment");
    }
  };

  const handleSubmit = () => {
    // Convert answers map to array
    const answersArray = Array.from(answers.values());

    // Store in sessionStorage for results page
    const assessmentId = sessionStorage.getItem("assessmentId");
    const candidateAddress =
      sessionStorage.getItem("candidateAddress") || address || "";

    sessionStorage.setItem("assessmentQuestions", JSON.stringify(questions));
    sessionStorage.setItem("assessmentAnswers", JSON.stringify(answersArray));
    sessionStorage.setItem("assessmentId", assessmentId || "");
    sessionStorage.setItem("candidateAddress", candidateAddress);

    // Clear review mode
    setReviewMode(false);
    setReviewQuestionIndex(null);

    // Get courseId from sessionStorage or default to old route
    const courseId = sessionStorage.getItem("currentCourseId");
    if (courseId) {
      router.push(`/courses/${courseId}/results`);
    } else {
      // Fallback to old route for backwards compatibility
      router.push("/results");
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading review...
          </p>
        </div>
      </main>
    );
  }

  if (questionsError || questions.length === 0) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400 mb-4">
            No assessment data found
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  const answeredCount = questions.filter(
    (q) => getAnswerStatus(q) === "answered"
  ).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <main className="flex-1 min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
            Review Your Answers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {answeredCount} answered, {unansweredCount} unanswered
          </p>
        </div>

        {/* Questions List */}
        <div className="border-2 border-black dark:border-white p-6 mb-8 bg-white dark:bg-gray-900">
          <div className="space-y-3">
            {questions.map((question, index) => {
              const status = getAnswerStatus(question);
              const isAnswered = status === "answered";

              return (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-lg text-black dark:text-white">
                      {index + 1}.
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 text-xs font-bold uppercase ${
                            isAnswered
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                          }`}
                        >
                          {isAnswered ? "Answered" : "Unanswered"}
                        </span>
                        {getEffectiveQuestionType(question) ===
                          "multiple-response" && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            (Choose TWO)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleViewQuestion(index)}
                    variant="outline"
                    className="border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    View Question
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-lg"
          >
            Submit Assessment
          </Button>
        </div>
      </div>
    </main>
  );
}
