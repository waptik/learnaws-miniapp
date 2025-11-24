/**
 * Map questions to CLF-C02 domains based on content/keywords
 */

import type { QuestionWithDomain } from "./types";

// Domain keywords for classification
const DOMAIN_KEYWORDS = {
  1: [
    // Cloud Concepts
    "cloud concepts",
    "cloud models",
    "shared responsibility",
    "cloud economics",
    "cloud computing",
    "cloud benefits",
    "cloud deployment",
    "cloud service models",
    "iaas",
    "paas",
    "saas",
    "on-premises",
    "hybrid cloud",
    "private cloud",
    "public cloud",
  ],
  2: [
    // Security & Compliance
    "security",
    "compliance",
    "iam",
    "identity",
    "access",
    "encryption",
    "ssl",
    "tls",
    "certificate",
    "authentication",
    "authorization",
    "aws shield",
    "waf",
    "kms",
    "secrets manager",
    "guardduty",
    "security groups",
    "nacl",
    "vpc",
    "data protection",
    "gdpr",
    "hipaa",
  ],
  3: [
    // Cloud Technology & Services
    "ec2",
    "lambda",
    "s3",
    "rds",
    "dynamodb",
    "compute",
    "storage",
    "database",
    "networking",
    "vpc",
    "cloudfront",
    "route 53",
    "elastic load balancer",
    "auto scaling",
    "elastic beanstalk",
    "cloudformation",
    "sns",
    "sqs",
    "api gateway",
    "aws services",
    "containers",
    "eks",
    "ecs",
    "fargate",
  ],
  4: [
    // Billing, Pricing, and Support
    "billing",
    "pricing",
    "cost",
    "budget",
    "cost optimization",
    "reserved instances",
    "savings plans",
    "spot instances",
    "support",
    "support plan",
    "aws support",
    "trusted advisor",
    "cost explorer",
    "aws marketplace",
    "free tier",
    "pricing calculator",
  ],
};

/**
 * Calculate domain score for a question based on keyword matches
 */
function calculateDomainScore(
  questionText: string,
  options: string[],
  domain: 1 | 2 | 3 | 4
): number {
  const keywords = DOMAIN_KEYWORDS[domain];
  const allText = `${questionText} ${options.join(" ")}`.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, "gi");
    const matches = allText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

/**
 * Map a question to a CLF-C02 domain
 */
export function mapQuestionToDomain(question: {
  text: string;
  options: string[];
}): 1 | 2 | 3 | 4 {
  const scores = {
    1: calculateDomainScore(question.text, question.options, 1),
    2: calculateDomainScore(question.text, question.options, 2),
    3: calculateDomainScore(question.text, question.options, 3),
    4: calculateDomainScore(question.text, question.options, 4),
  };

  // Find domain with highest score
  let maxScore = 0;
  let bestDomain: 1 | 2 | 3 | 4 = 3; // Default to Domain 3 (largest)

  for (const [domain, score] of Object.entries(scores) as [
    "1" | "2" | "3" | "4",
    number
  ][]) {
    if (score > maxScore) {
      maxScore = score;
      bestDomain = Number(domain) as 1 | 2 | 3 | 4;
    }
  }

  // If no clear match (all scores are 0), default to Domain 3
  if (maxScore === 0) {
    return 3;
  }

  return bestDomain;
}

/**
 * Map all questions to domains
 */
export function mapQuestionsToDomains(
  questions: QuestionWithDomain[]
): QuestionWithDomain[] {
  return questions.map((q) => ({
    ...q,
    domain: mapQuestionToDomain({ text: q.text, options: q.options }),
  }));
}

/**
 * Calculate domain counts
 */
export function calculateDomainCounts(
  questions: QuestionWithDomain[]
): Record<"1" | "2" | "3" | "4", number> {
  const counts = { "1": 0, "2": 0, "3": 0, "4": 0 };

  for (const question of questions) {
    counts[question.domain.toString() as "1" | "2" | "3" | "4"]++;
  }

  return counts;
}

