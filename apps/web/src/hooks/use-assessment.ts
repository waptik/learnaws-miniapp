import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question, Answer } from "@/types/assessment";
import { getRandomQuestionSet, generateAssessmentId } from "@/lib/questions";
import { getEffectiveQuestionType } from "@/lib/question-utils";

const ASSESSMENT_STORAGE_KEY = "assessmentQuestions";
const ANSWERS_STORAGE_KEY = "assessmentAnswers";
const ASSESSMENT_ID_KEY = "assessmentId";
const CANDIDATE_ADDRESS_KEY = "candidateAddress";
const CURRENT_INDEX_KEY = "assessmentCurrentIndex";

/**
 * Load questions from storage or fetch new ones
 */
async function loadQuestions(fromReview: boolean = false): Promise<Question[]> {
  // Always check for existing questions first (for persistence on refresh)
  const existingQuestions = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
  if (existingQuestions) {
    return JSON.parse(existingQuestions);
  }

  // Only fetch new questions if none exist
  const questions = await getRandomQuestionSet(50);
  // Save questions to storage for persistence
  sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(questions));
  // Reset index to 0 when generating new questions
  sessionStorage.setItem(CURRENT_INDEX_KEY, "0");
  return questions;
}

/**
 * Load answers from storage
 */
function loadAnswers(): Map<string, Answer> {
  try {
    const existingAnswers = sessionStorage.getItem(ANSWERS_STORAGE_KEY);
    if (!existingAnswers) {
      return new Map();
    }

    const answersArray: Answer[] = JSON.parse(existingAnswers);
    const answersMap = new Map<string, Answer>();

    // Get questions to validate answers
    let questions: Question[] = [];
    try {
      const questionsJson = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
      questions = questionsJson ? JSON.parse(questionsJson) : [];
    } catch (error) {
      console.warn("Failed to parse questions from storage:", error);
    }

    answersArray.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question) {
        const effectiveType = getEffectiveQuestionType(question);
        if (effectiveType === "multiple-response") {
          const selected = Array.isArray(answer.selected)
            ? answer.selected
            : answer.selected !== null
            ? [answer.selected]
            : [];

          // Clear if more than 2 answers (keep first 2)
          if (selected.length > 2) {
            answer.selected = selected.slice(0, 2);
          }
          // Clear if exactly 1 answer (user must select 0 or 2)
          else if (selected.length === 1) {
            answer.selected = null;
          }
        }
      }
      answersMap.set(answer.questionId, answer);
    });

    return answersMap;
  } catch (error) {
    console.error("Failed to load answers from storage:", error);
    // Clear corrupted data
    sessionStorage.removeItem(ANSWERS_STORAGE_KEY);
    return new Map();
  }
}

/**
 * Save answers to storage
 */
function saveAnswers(answers: Map<string, Answer>) {
  const answersArray = Array.from(answers.values());
  sessionStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(answersArray));
}

/**
 * React Query hook for assessment questions
 */
export function useAssessmentQuestions(fromReview: boolean = false) {
  return useQuery({
    queryKey: ["assessment", "questions", fromReview],
    queryFn: () => loadQuestions(fromReview),
    staleTime: Infinity, // Questions don't change during an assessment
    gcTime: Infinity, // Keep in cache during assessment
  });
}

/**
 * React Query hook for assessment answers
 */
export function useAssessmentAnswers() {
  return useQuery({
    queryKey: ["assessment", "answers"],
    queryFn: loadAnswers,
    staleTime: 0, // Always check storage
    gcTime: Infinity,
  });
}

/**
 * React Query mutation for updating answers
 */
export function useUpdateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      selected,
    }: {
      questionId: string;
      selected: string | string[] | null;
    }) => {
      const currentAnswers =
        queryClient.getQueryData<Map<string, Answer>>([
          "assessment",
          "answers",
        ]) || new Map();

      const updated = new Map(currentAnswers);
      updated.set(questionId, {
        questionId,
        selected,
      });

      // Save to storage
      saveAnswers(updated);

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["assessment", "answers"], updated);
    },
  });
}

/**
 * Save assessment data to storage
 */
export function saveAssessmentData(
  questions: Question[],
  answers: Map<string, Answer>,
  assessmentId: string,
  candidateAddress: string
) {
  sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(questions));
  saveAnswers(answers);
  sessionStorage.setItem(ASSESSMENT_ID_KEY, assessmentId);
  sessionStorage.setItem(CANDIDATE_ADDRESS_KEY, candidateAddress);
}

/**
 * Get assessment ID from storage or generate new one
 */
export function getOrCreateAssessmentId(): string {
  const existing = sessionStorage.getItem(ASSESSMENT_ID_KEY);
  if (existing) {
    return existing;
  }
  const newId = generateAssessmentId();
  sessionStorage.setItem(ASSESSMENT_ID_KEY, newId);
  return newId;
}

/**
 * Check if we're in review mode
 */
export function isReviewMode(): boolean {
  return sessionStorage.getItem("reviewMode") === "true";
}

/**
 * Set review mode
 */
export function setReviewMode(enabled: boolean) {
  if (enabled) {
    sessionStorage.setItem("reviewMode", "true");
  } else {
    sessionStorage.removeItem("reviewMode");
  }
}

/**
 * Get review question index
 */
export function getReviewQuestionIndex(): number | null {
  const index = sessionStorage.getItem("reviewQuestionIndex");
  return index ? parseInt(index, 10) : null;
}

/**
 * Set review question index
 */
export function setReviewQuestionIndex(index: number | null) {
  if (index !== null) {
    sessionStorage.setItem("reviewQuestionIndex", index.toString());
  } else {
    sessionStorage.removeItem("reviewQuestionIndex");
  }
}

/**
 * Get current question index from storage
 */
export function getCurrentIndex(): number {
  const index = sessionStorage.getItem(CURRENT_INDEX_KEY);
  return index ? parseInt(index, 10) : 0;
}

/**
 * Save current question index to storage
 */
export function saveCurrentIndex(index: number) {
  sessionStorage.setItem(CURRENT_INDEX_KEY, index.toString());
}
