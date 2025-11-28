/**
 * AWS Certification Assessment Types
 * Based on AWS Certified Cloud Practitioner (CLF-C02) exam structure
 */

/**
 * CLF-C02 Exam Domains
 */
export enum Domain {
  CLOUD_CONCEPTS = 1,              // 24% of exam
  SECURITY_COMPLIANCE = 2,         // 30% of exam
  CLOUD_TECH_SERVICES = 3,         // 34% of exam
  BILLING_PRICING_SUPPORT = 4      // 12% of exam
}

/**
 * Domain metadata
 */
export const DOMAIN_INFO = {
  [Domain.CLOUD_CONCEPTS]: {
    name: 'Cloud Concepts',
    percentage: 24,
    description: 'Cloud Concepts'
  },
  [Domain.SECURITY_COMPLIANCE]: {
    name: 'Security and Compliance',
    percentage: 30,
    description: 'Security and Compliance'
  },
  [Domain.CLOUD_TECH_SERVICES]: {
    name: 'Cloud Technology and Services',
    percentage: 34,
    description: 'Cloud Technology and Services'
  },
  [Domain.BILLING_PRICING_SUPPORT]: {
    name: 'Billing, Pricing, and Support',
    percentage: 12,
    description: 'Billing, Pricing, and Support'
  }
} as const;

/**
 * Question types based on AWS exam format
 */
export type QuestionType = 'multiple-choice' | 'multiple-response';

/**
 * Question structure
 */
export interface Question {
  id: string;                      // Unique identifier (hash of question text)
  text: string;                    // Question text
  type: QuestionType;              // Question type: multiple-choice or multiple-response
  options: string[];               // Answer options (A, B, C, D for multiple-choice; A, B, C, D, E+ for multiple-response)
  correctAnswer: string | string[]; // Correct answer(s): single letter for multiple-choice, array for multiple-response
  explanation?: string;            // Optional explanation
  source: string;                  // Source file name
  domain: Domain;                  // CLF-C02 domain (1-4)
}

/**
 * Multiple Choice Question (one correct answer)
 */
export interface MultipleChoiceQuestion extends Question {
  type: 'multiple-choice';
  options: [string, string, string, string]; // Exactly 4 options
  correctAnswer: 'A' | 'B' | 'C' | 'D';     // Single correct answer
}

/**
 * Multiple Response Question (two or more correct answers)
 */
export interface MultipleResponseQuestion extends Question {
  type: 'multiple-response';
  options: string[];               // Five or more options
  correctAnswer: string[];         // Two or more correct answers (e.g., ['A', 'C', 'E'])
}

/**
 * User's answer to a question
 */
export interface Answer {
  questionId: string;
  selected: string | string[] | null; // Single answer for multiple-choice, array for multiple-response
}

/**
 * Domain-level performance
 */
export interface DomainPerformance {
  domain: Domain;
  domainName: string;
  percentage: number;              // % of exam (24, 30, 34, 12)
  correct: number;                // Number of correct answers
  total: number;                  // Total questions in this domain
  competency: 'MEETS' | 'NEEDS_IMPROVEMENT';
}

/**
 * Complete assessment result
 * Matches AWS exam results format
 */
export interface AssessmentResult {
  // Notice of Exam Results
  candidateAddress: string;        // Wallet address
  examDate: string;                // ISO date string
  scaledScore: number;             // 100-1000 (AWS scaled scoring)
  passFail: 'PASS' | 'FAIL';       // Pass/Fail status
  passingScore: number;            // Always 700 for CLF-C02
  
  // Breakdown of Exam Results
  domainPerformance: DomainPerformance[];
  
  // Metadata
  totalQuestions: number;
  correctAnswers: number;
  assessmentId: string;             // Unique assessment ID
  unscored?: boolean;               // True if wallet disconnected during assessment (no rewards)
}

/**
 * Assessment session state
 */
export interface AssessmentSession {
  assessmentId: string;
  questions: Question[];
  answers: Map<string, Answer>;
  startedAt: Date;
  completedAt?: Date;
  result?: AssessmentResult;
}

/**
 * Scoring configuration
 */
export const SCORING_CONFIG = {
  MIN_SCORE: 100,                  // Minimum scaled score
  MAX_SCORE: 1000,                 // Maximum scaled score
  PASSING_SCORE: 700,              // Passing threshold
  DOMAIN_COMPETENCY_THRESHOLD: 0.7 // 70% to meet competencies
} as const;

