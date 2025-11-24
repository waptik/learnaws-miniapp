"use client";

import { QuestionType } from "@/types/assessment";

interface QuestionTypeIndicatorProps {
  type: QuestionType;
}

export function QuestionTypeIndicator({ type }: QuestionTypeIndicatorProps) {
  const isMultipleResponse = type === "multiple-response";

  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        className={`px-3 py-1 text-xs font-bold uppercase tracking-wide ${
          isMultipleResponse
            ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700"
            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
        }`}
      >
        {isMultipleResponse ? "Multiple Response" : "Multiple Choice"}
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {isMultipleResponse ? "Choose TWO" : "Select one"}
      </span>
    </div>
  );
}
