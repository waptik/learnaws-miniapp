/**
 * Fetch all practice exam files from GitHub
 */

import type { ExamFile } from "./types";

const BASE_URL =
  "https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam";

const EXAM_COUNT = 23;

/**
 * Fetch a single exam file from GitHub
 */
async function fetchExamFile(number: number): Promise<ExamFile | null> {
  const url = `${BASE_URL}/practice-exam-${number}.md`;
  const name = `practice-exam-${number}.md`;

  try {
    console.log(`  Fetching ${name}...`);
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠️  ${name} not found (404)`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    console.log(`  ✓ Fetched ${name} (${content.length} chars)`);
    return { name, content };
  } catch (error) {
    console.error(`  ✗ Error fetching ${name}:`, error);
    return null;
  }
}

/**
 * Fetch all exam files with retry logic
 */
async function fetchWithRetry(
  number: number,
  maxRetries = 3,
  delay = 1000
): Promise<ExamFile | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await fetchExamFile(number);
    if (result) return result;

    if (attempt < maxRetries) {
      const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
      const name = `practice-exam-${number}.md`;
      console.log(`  Retrying ${name} in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  return null;
}

/**
 * Fetch all practice exam files
 */
export async function fetchAllExamFiles(): Promise<ExamFile[]> {
  console.log(`Fetching ${EXAM_COUNT} exam files from GitHub...\n`);

  const files: ExamFile[] = [];
  const promises: Promise<ExamFile | null>[] = [];

  // Fetch files in parallel (with reasonable concurrency)
  for (let i = 1; i <= EXAM_COUNT; i++) {
    promises.push(fetchWithRetry(i));
  }

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result) {
      files.push(result);
    }
  }

  console.log(`\n✓ Successfully fetched ${files.length}/${EXAM_COUNT} files\n`);
  return files;
}

