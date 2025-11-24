/**
 * Assessment Scoring Logic
 * Implements AWS CLF-C02 scoring methodology
 */

import {
  Question,
  Answer,
  AssessmentResult,
  DomainPerformance,
  Domain,
  DOMAIN_INFO,
  SCORING_CONFIG,
  MultipleChoiceQuestion,
  MultipleResponseQuestion
} from '@/types/assessment';

/**
 * Calculate scaled score (100-1000) from raw percentage
 * AWS uses scaled scoring to normalize across different exam versions
 */
function calculateScaledScore(rawPercentage: number): number {
  // AWS scaled scoring: 100 + (percentage * 900)
  // This ensures scores range from 100-1000
  return Math.round(SCORING_CONFIG.MIN_SCORE + (rawPercentage * 900));
}

/**
 * Determine domain competency level
 * Based on percentage correct in that domain
 */
function calculateDomainCompetency(
  correct: number,
  total: number
): 'MEETS' | 'NEEDS_IMPROVEMENT' {
  if (total === 0) return 'NEEDS_IMPROVEMENT';
  const percentage = correct / total;
  return percentage >= SCORING_CONFIG.DOMAIN_COMPETENCY_THRESHOLD
    ? 'MEETS'
    : 'NEEDS_IMPROVEMENT';
}

/**
 * Check if answer is correct for a question
 * Handles both multiple-choice (single answer) and multiple-response (multiple answers)
 */
function isAnswerCorrect(question: Question, answer: Answer | undefined): boolean {
  if (!answer || !answer.selected) return false;
  
  if (question.type === 'multiple-choice') {
    // Multiple choice: single answer must match exactly
    return answer.selected === question.correctAnswer;
  } else {
    // Multiple response: all correct answers must be selected, and no incorrect ones
    const correctAnswers = Array.isArray(question.correctAnswer) 
      ? question.correctAnswer 
      : [question.correctAnswer];
    const selectedAnswers = Array.isArray(answer.selected) 
      ? answer.selected 
      : [answer.selected];
    
    // Must select exactly the correct answers (no more, no less)
    if (selectedAnswers.length !== correctAnswers.length) return false;
    
    // Check if all correct answers are selected
    const sortedCorrect = [...correctAnswers].sort();
    const sortedSelected = [...selectedAnswers].sort();
    return JSON.stringify(sortedCorrect) === JSON.stringify(sortedSelected);
  }
}

/**
 * Calculate domain-level performance
 */
function calculateDomainPerformance(
  questions: Question[],
  answers: Answer[],
  domain: Domain
): DomainPerformance {
  // Filter questions for this domain
  const domainQuestions = questions.filter(q => q.domain === domain);
  
  // Count correct answers
  let correct = 0;
  domainQuestions.forEach(question => {
    const answer = answers.find(a => a.questionId === question.id);
    if (isAnswerCorrect(question, answer)) {
      correct++;
    }
  });
  
  return {
    domain,
    domainName: DOMAIN_INFO[domain].name,
    percentage: DOMAIN_INFO[domain].percentage,
    correct,
    total: domainQuestions.length,
    competency: calculateDomainCompetency(correct, domainQuestions.length)
  };
}

/**
 * Main scoring function
 * Calculates overall score and domain-level performance
 */
export function calculateAssessmentResult(
  questions: Question[],
  answers: Answer[],
  candidateAddress: string,
  assessmentId: string
): AssessmentResult {
  // Calculate overall score
  let correctCount = 0;
  questions.forEach(question => {
    const answer = answers.find(a => a.questionId === question.id);
    if (isAnswerCorrect(question, answer)) {
      correctCount++;
    }
  });
  
  const rawPercentage = correctCount / questions.length;
  const scaledScore = calculateScaledScore(rawPercentage);
  
  // Calculate domain-level performance for all 4 domains
  const domainPerformance: DomainPerformance[] = [
    calculateDomainPerformance(questions, answers, Domain.CLOUD_CONCEPTS),
    calculateDomainPerformance(questions, answers, Domain.SECURITY_COMPLIANCE),
    calculateDomainPerformance(questions, answers, Domain.CLOUD_TECH_SERVICES),
    calculateDomainPerformance(questions, answers, Domain.BILLING_PRICING_SUPPORT)
  ];
  
  return {
    candidateAddress,
    examDate: new Date().toISOString(),
    scaledScore,
    passFail: scaledScore >= SCORING_CONFIG.PASSING_SCORE ? 'PASS' : 'FAIL',
    passingScore: SCORING_CONFIG.PASSING_SCORE,
    domainPerformance,
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    assessmentId
  };
}

/**
 * Check if assessment result qualifies for token reward
 */
export function canClaimReward(result: AssessmentResult): boolean {
  return result.passFail === 'PASS' && result.scaledScore >= SCORING_CONFIG.PASSING_SCORE;
}

