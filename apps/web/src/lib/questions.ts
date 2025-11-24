/**
 * Question Loading and Selection Utilities
 * Handles loading questions from JSON and domain-balanced selection
 */

import { Question, Domain, DOMAIN_INFO } from '@/types/assessment';

/**
 * Question data structure from JSON file
 */
interface QuestionData {
  text: string;
  type: 'multiple-choice' | 'multiple-response';
  options: string[];
  correctAnswers: string[]; // Always an array in JSON
  source: string;
  id: string;
  domain: number;
  explanation?: string;
}

interface QuestionsJson {
  questions: QuestionData[];
  metadata: {
    totalQuestions: number;
    lastUpdated: string;
    sources: string[];
    domainWeights: Record<string, number>;
    domainCounts: Record<string, number>;
  };
}

/**
 * Domain weights for CLF-C02 exam
 */
const DOMAIN_WEIGHTS = {
  1: 0.24, // Cloud Concepts (24%)
  2: 0.30, // Security & Compliance (30%)
  3: 0.34, // Cloud Tech & Services (34%)
  4: 0.12, // Billing & Pricing (12%)
} as const;

/**
 * Convert JSON question format to Question type
 */
function convertQuestionData(data: QuestionData): Question {
  return {
    id: data.id,
    text: data.text,
    type: data.type,
    options: data.options,
    correctAnswer: data.type === 'multiple-choice' 
      ? data.correctAnswers[0] // Single answer for multiple-choice
      : data.correctAnswers,   // Array for multiple-response
    explanation: data.explanation,
    source: data.source,
    domain: data.domain as Domain,
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get domain-balanced question set
 * Ensures all 4 domains are represented with proper distribution
 */
export function getDomainBalancedQuestionSet(
  questions: Question[],
  count: number = 50
): Question[] {
  // Calculate target distribution
  const domainCounts = {
    1: Math.round(count * DOMAIN_WEIGHTS[1]), // ~12 questions
    2: Math.round(count * DOMAIN_WEIGHTS[2]), // ~15 questions
    3: Math.round(count * DOMAIN_WEIGHTS[3]), // ~17 questions
    4: Math.round(count * DOMAIN_WEIGHTS[4]), // ~6 questions
  };

  // Group questions by domain
  const questionsByDomain: Record<number, Question[]> = {
    1: questions.filter((q) => q.domain === Domain.CLOUD_CONCEPTS),
    2: questions.filter((q) => q.domain === Domain.SECURITY_COMPLIANCE),
    3: questions.filter((q) => q.domain === Domain.CLOUD_TECH_SERVICES),
    4: questions.filter((q) => q.domain === Domain.BILLING_PRICING_SUPPORT),
  };

  // Randomly select from each domain
  const selected: Question[] = [];
  for (const [domainStr, targetCount] of Object.entries(domainCounts)) {
    const domain = parseInt(domainStr) as keyof typeof questionsByDomain;
    const domainQuestions = questionsByDomain[domain];
    
    if (domainQuestions.length === 0) {
      console.warn(`No questions available for domain ${domain}`);
      continue;
    }
    
    const shuffled = shuffleArray([...domainQuestions]);
    selected.push(...shuffled.slice(0, Math.min(targetCount, domainQuestions.length)));
  }

  // Shuffle final set to randomize order
  return shuffleArray(selected);
}

/**
 * Load all questions from JSON file
 */
export async function loadAllQuestions(): Promise<Question[]> {
  try {
    // In Next.js, we can import JSON directly or fetch it
    // Using dynamic import for client-side, fetch for server-side
    const response = await fetch('/data/questions.json');
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.statusText}`);
    }
    
    const data: QuestionsJson = await response.json();
    
    // Convert to Question type
    return data.questions.map(convertQuestionData);
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
}

/**
 * Get a random set of 50 domain-balanced questions
 */
export async function getRandomQuestionSet(count: number = 50): Promise<Question[]> {
  const allQuestions = await loadAllQuestions();
  return getDomainBalancedQuestionSet(allQuestions, count);
}

/**
 * Generate unique assessment ID
 */
export function generateAssessmentId(): string {
  return `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

