/**
 * Type definitions for Phase 1: Data Collection & Processing
 */

export interface ParsedQuestion {
  text: string;
  type: "multiple-choice" | "multiple-response";
  options: string[];
  correctAnswers: string[]; // ["A"] or ["A", "B"] (always 2 for multiple-response)
  explanation?: string;
  source: string; // e.g., "practice-exam-1.md"
}

export interface QuestionWithDomain extends ParsedQuestion {
  id: string; // SHA256 hash
  domain: 1 | 2 | 3 | 4;
}

export interface ExamFile {
  name: string;
  content: string;
}

export interface QuestionsData {
  questions: QuestionWithDomain[];
  metadata: {
    totalQuestions: number;
    lastUpdated: string;
    sources: string[];
    domainWeights: {
      "1": number;
      "2": number;
      "3": number;
      "4": number;
    };
    domainCounts: {
      "1": number;
      "2": number;
      "3": number;
      "4": number;
    };
  };
}

