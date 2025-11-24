#!/usr/bin/env bun

/**
 * Main script: Fetch, parse, deduplicate, and save questions
 * Phase 1: Data Collection & Processing
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchAllExamFiles } from "./fetch-exam-files";
import { parseQuestions } from "./parse-question";
import { deduplicateQuestions, addQuestionIds } from "./deduplicate-questions";
import { mapQuestionsToDomains, calculateDomainCounts } from "./map-domains";
import type { QuestionsData } from "./types";

const OUTPUT_FILE = path.join(process.cwd(), "data", "questions.json");

/**
 * Save questions to JSON file
 */
async function saveQuestionsToJSON(
  questions: QuestionsData["questions"]
): Promise<void> {
  const domainCounts = calculateDomainCounts(questions);

  const data: QuestionsData = {
    questions,
    metadata: {
      totalQuestions: questions.length,
      lastUpdated: new Date().toISOString().split("T")[0],
      sources: Array.from(new Set(questions.map((q) => q.source))).sort(),
      domainWeights: {
        "1": 0.24,
        "2": 0.3,
        "3": 0.34,
        "4": 0.12,
      },
      domainCounts,
    },
  };

  // Ensure data directory exists
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

  // Write JSON file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✓ Saved ${questions.length} questions to ${OUTPUT_FILE}`);
}

/**
 * Print statistics
 */
function printStatistics(questions: QuestionsData["questions"]): void {
  const domainCounts = calculateDomainCounts(questions);
  const typeCounts = {
    "multiple-choice": questions.filter((q) => q.type === "multiple-choice")
      .length,
    "multiple-response": questions.filter((q) => q.type === "multiple-response")
      .length,
  };

  console.log("\n" + "=".repeat(60));
  console.log("📊 Statistics");
  console.log("=".repeat(60));
  console.log(`Total Questions: ${questions.length}`);
  console.log(`\nQuestion Types:`);
  console.log(`  Multiple Choice: ${typeCounts["multiple-choice"]}`);
  console.log(`  Multiple Response: ${typeCounts["multiple-response"]}`);
  console.log(`\nDomain Distribution:`);
  console.log(
    `  Domain 1 (Cloud Concepts): ${domainCounts["1"]} (${(
      (domainCounts["1"] / questions.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `  Domain 2 (Security & Compliance): ${domainCounts["2"]} (${(
      (domainCounts["2"] / questions.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `  Domain 3 (Cloud Tech & Services): ${domainCounts["3"]} (${(
      (domainCounts["3"] / questions.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `  Domain 4 (Billing & Pricing): ${domainCounts["4"]} (${(
      (domainCounts["4"] / questions.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log("=".repeat(60) + "\n");
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Phase 1: Data Collection & Processing\n");
  console.log("=".repeat(60) + "\n");

  try {
    // Step 1: Fetch all exam files
    console.log("Step 1: Fetching exam files from GitHub...");
    const examFiles = await fetchAllExamFiles();
    if (examFiles.length === 0) {
      console.error("❌ No exam files fetched. Exiting.");
      process.exit(1);
    }

    // Step 2: Parse questions from each file
    console.log("Step 2: Parsing questions...");
    const allQuestions: ReturnType<typeof parseQuestions> = [];
    for (const file of examFiles) {
      const questions = parseQuestions(file.content, file.name);
      console.log(`  ✓ Parsed ${questions.length} questions from ${file.name}`);
      allQuestions.push(...questions);
    }
    console.log(`\n✓ Total parsed: ${allQuestions.length} questions\n`);

    // Step 3: Deduplicate
    console.log("Step 3: Deduplicating questions...");
    const uniqueQuestions = deduplicateQuestions(allQuestions);
    console.log(
      `✓ Removed ${allQuestions.length - uniqueQuestions.length} duplicate(s)`
    );
    console.log(`✓ ${uniqueQuestions.length} unique questions\n`);

    // Step 4: Add IDs
    console.log("Step 4: Adding question IDs...");
    const questionsWithIds = addQuestionIds(uniqueQuestions);
    console.log(`✓ Added IDs to all questions\n`);

    // Step 5: Map domains
    console.log("Step 5: Mapping questions to domains...");
    const questionsWithDomains = mapQuestionsToDomains(questionsWithIds);
    console.log(`✓ Mapped all questions to domains\n`);

    // Step 6: Save to JSON
    console.log("Step 6: Saving to JSON...");
    await saveQuestionsToJSON(questionsWithDomains);

    // Step 7: Print statistics
    printStatistics(questionsWithDomains);

    console.log("✅ Phase 1 complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
