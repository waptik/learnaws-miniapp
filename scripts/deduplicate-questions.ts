/**
 * Deduplicate questions using content hashing
 */

import crypto from "node:crypto";
import type { ParsedQuestion, QuestionWithDomain } from "./types";

/**
 * Create SHA256 hash for question deduplication
 */
export function createQuestionHash(question: ParsedQuestion): string {
  const content = [question.text, ...question.options].join("|");
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Deduplicate questions by hash
 */
export function deduplicateQuestions(
  questions: ParsedQuestion[]
): ParsedQuestion[] {
  const seen = new Map<string, ParsedQuestion>();
  const duplicates: string[] = [];

  for (const question of questions) {
    const hash = createQuestionHash(question);
    if (seen.has(hash)) {
      duplicates.push(hash);
    } else {
      seen.set(hash, question);
    }
  }

  const uniqueQuestions = Array.from(seen.values());

  if (duplicates.length > 0) {
    console.log(
      `  Found ${duplicates.length} duplicate(s), removed ${duplicates.length}`
    );
  }

  return uniqueQuestions;
}

/**
 * Add IDs to questions (using hash)
 */
export function addQuestionIds(
  questions: ParsedQuestion[]
): QuestionWithDomain[] {
  return questions.map((q) => ({
    ...q,
    id: createQuestionHash(q),
    domain: 3 as const, // Temporary, will be mapped in next step
  }));
}

