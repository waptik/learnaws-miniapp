import { Question, QuestionType } from "@/types/assessment";

/**
 * Detect if a question should be treated as multiple-response based on text patterns
 * This handles cases where questions say "Select TWO" but are misclassified as multiple-choice
 */
export function detectMultipleResponseFromText(question: Question): boolean {
  // If already marked as multiple-response, return true
  if (question.type === "multiple-response") {
    return true;
  }

  // Check for patterns that indicate multiple-response
  const text = question.text.toLowerCase();
  const patterns = [
    /select\s+(two|2|three|3|four|4|five|5)/i,
    /choose\s+(two|2|three|3|four|4|five|5)/i,
    /pick\s+(two|2|three|3|four|4|five|5)/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Get the effective question type, considering text patterns
 */
export function getEffectiveQuestionType(question: Question): QuestionType {
  return detectMultipleResponseFromText(question)
    ? "multiple-response"
    : question.type;
}
