/**
 * Parse questions from markdown exam files
 */

import type { ParsedQuestion } from "./types";

/**
 * Pre-process markdown content to clean structure before parsing
 */
function preprocessMarkdown(content: string): string {
  // 1. Remove frontmatter blocks (--- layout: exam ---)
  content = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, "");

  // 2. Remove title headers (# Practice Exam 6)
  content = content.replace(/^#+\s*Practice Exam \d+\s*$/gm, "");

  // 3. Extract answers from HTML <details> tags and normalize format
  // Pattern: <details>...<summary>Answer</summary>...Correct answer: X...</details>
  content = content.replace(
    /<details[^>]*>[\s\S]*?<summary[^>]*>Answer<\/summary>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)[\s\S]*?<\/details>/gi,
    "\nCorrect answer: $1\n"
  );

  // 4. Remove any remaining HTML tags
  content = content.replace(/<[^>]*>/g, "");

  // 5. Normalize whitespace
  content = content.replace(/\n{3,}/g, "\n\n"); // Multiple newlines to double
  content = content.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space

  return content.trim();
}

/**
 * Clean text by removing markdown artifacts and HTML tags
 * Multi-pass approach for thorough cleaning
 */
function cleanText(text: string): string {
  if (!text) return text;

  // Step 1: Remove HTML tags (like <details>, <summary>, etc.)
  // This preserves text content inside tags
  text = text.replace(/<[^>]*>/g, "");

  // Step 2: Remove markdown formatting
  text = text.replace(/\*\*/g, "").replace(/\*/g, ""); // Bold/italic
  text = text.replace(/`/g, ""); // Code markers
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); // Links, keep text only

  // Step 3: Remove trailing "Answer", "Explanation", "Correct answer:" text
  // Also remove if it appears mid-text (common artifact)
  text = text.replace(/\s*(Answer|Explanation|Correct answer:?)\s*$/i, "");
  text = text.replace(/\s+(Answer|Explanation|Correct answer:?)\s+/gi, " ");

  // Step 4: Normalize whitespace
  text = text.replace(/\n+/g, " "); // Replace newlines with space
  text = text.replace(/\r+/g, " "); // Replace carriage returns
  text = text.replace(/\t+/g, " "); // Replace tabs
  text = text.replace(/\s+/g, " "); // Multiple spaces to single space

  // Step 5: Trim edges
  text = text.trim();

  // Step 6: Handle trailing punctuation intelligently
  text = text.replace(/\.{2,}/g, "."); // Multiple periods to one
  text = text.replace(/\s+\.$/, "."); // Space before period at end
  text = text.replace(/[,\s]+$/, ""); // Remove trailing commas/spaces

  return text;
}

/**
 * Extract question text from markdown block
 */
function extractQuestionText(block: string): string | null {
  // Try standard format first: question number, then text, then options on new lines
  let match = block.match(/^\d+\.\s+(.*?)(?=\n\s*[-•]\s*A\.)/s);

  // If that fails, try format where options might be on same line or different spacing
  if (!match) {
    match = block.match(/^\d+\.\s+(.*?)(?=\s*[-•]\s*A\.)/s);
  }

  // If still no match, try to extract up to first option marker (more flexible)
  if (!match) {
    match = block.match(/^\d+\.\s+(.*?)(?=\s*[-•]\s*[A-Z]\.)/s);
  }

  if (!match) return null;

  let text = match[1].trim();
  // Remove any trailing dashes or special characters
  text = text.replace(/\s*[-•]\s*$/, "").trim();
  // Clean markdown and HTML artifacts
  text = cleanText(text);
  return text;
}

/**
 * Detect question type (multiple-choice or multiple-response)
 * Checks both text patterns and number of correct answers
 */
function detectQuestionType(
  questionText: string,
  correctAnswers: string[]
): "multiple-choice" | "multiple-response" {
  // Primary check: If there are 2+ correct answers, it's multiple-response
  if (correctAnswers.length >= 2) {
    return "multiple-response";
  }

  // Secondary check: Look for patterns in text
  // Check for $$Choose TWO$$ pattern (or similar)
  const multipleResponsePattern =
    /\$\$Choose\s+(TWO|THREE|FOUR|FIVE|[2-9])\$\$/i;
  // Also check for "(Choose TWO)" pattern without $$ markers
  const choosePattern = /\(Choose\s+(TWO|THREE|FOUR|FIVE|[2-9])\)/i;

  if (
    multipleResponsePattern.test(questionText) ||
    choosePattern.test(questionText)
  ) {
    return "multiple-response";
  }

  return "multiple-choice";
}

/**
 * Extract options A-F from markdown block
 */
function extractOptions(block: string): Record<string, string> {
  const options: Record<string, string> = {};

  // More flexible patterns to handle different spacing and formats
  // Option A - try with newline first, then without
  let optionAMatch = block.match(/[-•]\s*A\.\s+(.*?)(?=\n\s*[-•]\s*B\.)/s);
  if (!optionAMatch) {
    optionAMatch = block.match(/[-•]\s*A\.\s+(.*?)(?=\s*[-•]\s*B\.)/s);
  }
  if (optionAMatch) options.A = optionAMatch[1].trim();

  // Option B
  let optionBMatch = block.match(/[-•]\s*B\.\s+(.*?)(?=\n\s*[-•]\s*C\.)/s);
  if (!optionBMatch) {
    optionBMatch = block.match(/[-•]\s*B\.\s+(.*?)(?=\s*[-•]\s*C\.)/s);
  }
  if (optionBMatch) options.B = cleanText(optionBMatch[1]);

  // Option C
  let optionCMatch = block.match(/[-•]\s*C\.\s+(.*?)(?=\n\s*[-•]\s*D\.)/s);
  if (!optionCMatch) {
    optionCMatch = block.match(/[-•]\s*C\.\s+(.*?)(?=\s*[-•]\s*D\.)/s);
  }
  if (optionCMatch) options.C = cleanText(optionCMatch[1]);

  // Option D - more flexible end detection
  let optionDMatch = block.match(/[-•]\s*D\.\s+(.*?)(?=\n\s*[-•]\s*E\.)/s);
  if (!optionDMatch) {
    optionDMatch = block.match(/[-•]\s*D\.\s+(.*?)(?=\s*[-•]\s*E\.)/s);
  }
  if (!optionDMatch) {
    optionDMatch = block.match(
      /[-•]\s*D\.\s+(.*?)(?=\n\s*(?:[-•]\s*E\.|<details|Correct\s+answer|Answer:|Explanation:|\n\s*\d+\.|$))/s
    );
  }
  if (!optionDMatch) {
    optionDMatch = block.match(
      /[-•]\s*D\.\s+(.*?)(?=\s*(?:[-•]\s*E\.|<details|Correct\s+answer|Answer:|Explanation:|\n\s*\d+\.|$))/s
    );
  }
  if (optionDMatch) options.D = cleanText(optionDMatch[1]);

  // Option E (optional)
  let optionEMatch = block.match(/[-•]\s*E\.\s+(.*?)(?=\n\s*[-•]\s*F\.)/s);
  if (!optionEMatch) {
    optionEMatch = block.match(/[-•]\s*E\.\s+(.*?)(?=\s*[-•]\s*F\.)/s);
  }
  if (!optionEMatch) {
    optionEMatch = block.match(
      /[-•]\s*E\.\s+(.*?)(?=\n\s*(?:[-•]\s*F\.|<details|Correct\s+answer|Answer:|Explanation:|\n\s*\d+\.|$))/s
    );
  }
  if (optionEMatch) options.E = cleanText(optionEMatch[1]);

  // Option F (optional)
  let optionFMatch = block.match(
    /[-•]\s*F\.\s+(.*?)(?=\n\s*(?:Correct|Answer|Explanation|<\/details|$))/s
  );
  if (!optionFMatch) {
    optionFMatch = block.match(
      /[-•]\s*F\.\s+(.*?)(?=\s*(?:Correct\s+answer|Answer:|Explanation:|<\/details|\n\s*\d+\.|$))/s
    );
  }
  if (optionFMatch) options.F = cleanText(optionFMatch[1]);

  return options;
}

/**
 * Extract correct answer(s) from markdown block
 * Handles both <details> blocks and direct patterns
 */
function extractCorrectAnswer(block: string): string[] | null {
  // First try to extract from <details> block (more reliable)
  const detailsMatch = block.match(
    /<details[^>]*>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)[\s\S]*?<\/details>/i
  );
  if (detailsMatch) {
    const answerString = detailsMatch[1].trim();
    return answerString.split(",").map((a) => a.trim());
  }

  // Fallback to direct pattern match
  const match = block.match(/Correct answer:\s*([A-F](?:,\s*[A-F])*)/i);
  if (!match) return null;

  const answerString = match[1].trim();
  // Parse "A" or "A, B" format
  const answers = answerString.split(",").map((a) => a.trim());
  return answers;
}

/**
 * Extract explanation from markdown block
 */
function extractExplanation(block: string): string | undefined {
  const match = block.match(/(?:Explanation|Answer):\s*(.*?)(?=\n\d+\.|$)/s);
  if (!match) return undefined;

  let explanation = match[1].trim();
  // Clean markdown and HTML artifacts
  explanation = cleanText(explanation);
  return explanation || undefined;
}

/**
 * Parse questions from markdown content
 */
export function parseQuestions(
  content: string,
  sourceName: string
): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Pre-process markdown to clean structure
  content = preprocessMarkdown(content);

  // Split by question numbers
  const questionBlocks = content.split(/\n(?=\d+\.)/);

  for (const block of questionBlocks) {
    if (!block.trim()) continue;

    // Extract question text
    const questionText = extractQuestionText(block);
    if (!questionText) {
      const preview = block.substring(0, 100).replace(/\n/g, " ");
      // Skip frontmatter/metadata blocks silently
      if (block.includes("--- layout:") || block.includes("# Practice Exam")) {
        continue; // Skip silently - these are metadata blocks
      }
      console.warn(`  ⚠️  Skipping question: Could not extract question text`);
      console.warn(`     Preview: ${preview}...`);
      console.warn(
        `     Full block (first 200 chars): ${block.substring(0, 200)}`
      );
      continue;
    }

    // Extract options first (needed for type detection)
    const optionsObj = extractOptions(block);
    const missingOptions: string[] = [];
    if (!optionsObj.A) missingOptions.push("A");
    if (!optionsObj.B) missingOptions.push("B");
    if (!optionsObj.C) missingOptions.push("C");
    if (!optionsObj.D) missingOptions.push("D");

    if (missingOptions.length > 0) {
      const preview = questionText.substring(0, 80);
      console.warn(
        `  ⚠️  Skipping question: Missing required options: ${missingOptions.join(
          ", "
        )}`
      );
      console.warn(`     Question: ${preview}...`);
      console.warn(
        `     Found options: ${Object.keys(optionsObj).join(", ") || "none"}`
      );
      console.warn(
        `     Block preview: ${block.substring(0, 300).replace(/\n/g, " ")}...`
      );
      continue;
    }

    // Build options array
    const options: string[] = [
      optionsObj.A,
      optionsObj.B,
      optionsObj.C,
      optionsObj.D,
    ];
    if (optionsObj.E) options.push(optionsObj.E);
    if (optionsObj.F) options.push(optionsObj.F);

    // Extract correct answer(s)
    const correctAnswers = extractCorrectAnswer(block);
    if (!correctAnswers || correctAnswers.length === 0) {
      const preview = questionText.substring(0, 80);
      console.warn(`  ⚠️  Skipping question: No correct answer found`);
      console.warn(`     Question: ${preview}...`);
      continue;
    }

    // Detect question type based on correct answers count and text patterns
    const type = detectQuestionType(questionText, correctAnswers);

    // Log questions with more than 2 correct answers
    if (correctAnswers.length > 2) {
      const preview = questionText.substring(0, 100);
      console.log(
        `\n  📋 Question with ${correctAnswers.length} correct answers:`
      );
      console.log(`     Question: ${preview}...`);
      console.log(`     Correct answers: ${correctAnswers.join(", ")}`);
      console.log(`     Source: ${sourceName}`);
      console.log(`     Options count: ${options.length}`);
    }

    // Validate multiple-response questions have exactly 2 answers
    if (type === "multiple-response" && correctAnswers.length !== 2) {
      const preview = questionText.substring(0, 80);
      console.warn(
        `  ⚠️  Skipping question: Multiple-response should have exactly 2 correct answers, found ${correctAnswers.length}`
      );
      console.warn(`     Question: ${preview}...`);
      console.warn(`     Correct answers: ${correctAnswers.join(", ")}`);
      continue;
    }

    // Extract explanation
    const explanation = extractExplanation(block);

    questions.push({
      text: questionText,
      type,
      options,
      correctAnswers,
      explanation,
      source: sourceName,
    });
  }

  return questions;
}
