"use client";

import { QuestionType } from "@/types/assessment";

interface OptionButtonProps {
  optionLetter: string; // A, B, C, D, E, F
  optionText: string;
  questionType: QuestionType;
  isSelected: boolean;
  isDisabled?: boolean; // For multiple response when limit reached
  onClick: () => void;
}

export function OptionButton({
  optionLetter,
  optionText,
  questionType,
  isSelected,
  isDisabled = false,
  onClick,
}: OptionButtonProps) {
  const isMultipleResponse = questionType === "multiple-response";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full text-left p-4 mb-3 border-2 transition-all ${
        isSelected
          ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800 font-semibold"
          : isDisabled
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Radio or Checkbox indicator */}
        <div
          className={`flex-shrink-0 w-5 h-5 mt-0.5 border-2 flex items-center justify-center ${
            isSelected
              ? "border-black dark:border-white bg-black dark:bg-white"
              : "border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800"
          }`}
        >
          {isSelected &&
            (isMultipleResponse ? (
              <svg
                className="w-3 h-3 text-white dark:text-black"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
            ))}
        </div>

        {/* Option letter and text */}
        <div className="flex-1">
          <span className="font-bold text-lg mr-2 text-black dark:text-white">
            {optionLetter}.
          </span>
          <span className="text-base text-black dark:text-white">
            {optionText}
          </span>
        </div>
      </div>
    </button>
  );
}
