"use client";

import { useEffect } from "react";
import { Question, Answer } from "@/types/assessment";
import { QuestionTypeIndicator } from "./QuestionTypeIndicator";
import { OptionButton } from "./OptionButton";
import { getEffectiveQuestionType } from "@/lib/question-utils";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: Answer | undefined;
  onAnswerChange: (selected: string | string[]) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
}: QuestionCardProps) {
  // Use effective type to handle misclassified questions
  const effectiveType = getEffectiveQuestionType(question);
  const isMultipleResponse = effectiveType === "multiple-response";
  const REQUIRED_SELECTIONS = 2; // Multiple response always requires exactly 2 answers
  const selectedAnswers = answer?.selected
    ? Array.isArray(answer.selected)
      ? answer.selected
      : [answer.selected]
    : [];
  const isAtLimit =
    isMultipleResponse && selectedAnswers.length >= REQUIRED_SELECTIONS;

  // Clear invalid selections (more than required) when question changes
  useEffect(() => {
    if (isMultipleResponse && selectedAnswers.length > REQUIRED_SELECTIONS) {
      // Clear invalid selection - keep only first 2
      const validSelection = selectedAnswers.slice(0, REQUIRED_SELECTIONS);
      onAnswerChange(validSelection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]); // Only run when question changes

  const handleOptionClick = (optionLetter: string) => {
    if (isMultipleResponse) {
      // Multiple response: always exactly 2 answers required
      if (selectedAnswers.includes(optionLetter)) {
        // Deselect if already selected
        const newSelection = selectedAnswers.filter((a) => a !== optionLetter);
        onAnswerChange(newSelection);
      } else {
        // Only allow selection if under limit
        if (selectedAnswers.length < REQUIRED_SELECTIONS) {
          const newSelection = [...selectedAnswers, optionLetter];
          onAnswerChange(newSelection);
        }
        // If already at limit, don't allow more selections
      }
    } else {
      // Single selection for multiple choice
      onAnswerChange(optionLetter);
    }
  };

  const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <QuestionTypeIndicator type={effectiveType} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 leading-tight text-black dark:text-white">
          {question.text}
        </h2>
      </div>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const optionLetter = optionLetters[index];
          const isSelected = isMultipleResponse
            ? selectedAnswers.includes(optionLetter)
            : answer?.selected === optionLetter;

          // Disable option if it's multiple response, not selected, and we're at the limit
          const isDisabled = isMultipleResponse && !isSelected && isAtLimit;

          return (
            <OptionButton
              key={index}
              optionLetter={optionLetter}
              optionText={option}
              questionType={effectiveType}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onClick={() => handleOptionClick(optionLetter)}
            />
          );
        })}
      </div>
    </div>
  );
}
