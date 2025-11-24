# Phase 1: Data Collection & Processing
## Implementation Plan for Review

**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: 2025-11-23  
**Phase**: Data Collection & Processing (Week 1)

---

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview

**Technical Specifications**:
- [Question Types](./QUESTION_TYPES.md) - Multiple choice and multiple response formats
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status

**Setup Guides**:
- [Farcaster Setup](./FARCASTER_SETUP.md) - Farcaster MiniApp setup guide

---

## 📋 Overview

Phase 1 focuses on fetching, parsing, deduplicating, and storing AWS CLF-C02 practice exam questions from GitHub. This phase establishes the foundation for the assessment system by creating a clean, structured question database.

---

## 🎯 Objectives

1. **Fetch** all practice exam markdown files from GitHub (23 files)
2. **Parse** markdown files to extract questions, options, answers, and explanations
3. **Deduplicate** questions using content hashing
4. **Map** questions to CLF-C02 domains (1-4)
5. **Store** structured data as JSON for use in assessments

---

## 📁 File Structure

```
learnaws-miniapp/
├── scripts/
│   ├── fetch-questions.ts          # Main fetcher script
│   ├── parse-question.ts            # Question parsing utilities
│   ├── deduplicate-questions.ts     # Deduplication logic
│   └── map-domains.ts               # Domain mapping logic
├── data/
│   └── questions.json               # Output: Structured question data
└── docs/
    └── PHASE_1_IMPLEMENTATION.md    # This document
```

---

## 🔧 Implementation Details

### 1. Question Fetcher (`scripts/fetch-questions.ts`)

**Purpose**: Fetch all practice exam files from GitHub

**Process**:
1. Generate URLs for practice-exam-1.md through practice-exam-23.md
2. Fetch each file using native `fetch` API
3. Handle errors gracefully (skip failed files, log errors)
4. Return raw markdown content for parsing

**GitHub URLs**:
```
https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam/practice-exam-{1..23}.md
```

**Error Handling**:
- Network errors: Log and continue with next file
- 404 errors: Log missing file and continue
- Rate limiting: Implement retry logic with exponential backoff

**Dependencies**:
- Native `fetch` API (Node.js 18+)
- `fs` (Node.js built-in) for file operations

---

### 2. Question Parser (`scripts/parse-question.ts`)

**Purpose**: Extract structured question data from markdown

**Parsing Logic**:

#### Question Detection
- Split markdown by question numbers: `\n(?=\d+\.)` regex
- Each block = one question

#### Question Text Extraction
- Pattern: `^\d+\.\s+(.*?)(?=\n\s*-\s*A\.)`
- Clean whitespace and normalize
- Remove markdown formatting (if any)

#### Question Type Detection
- Check for pattern: `$$Choose\s+(TWO|THREE|FOUR|FIVE|[2-9])$$`
- **Important**: Based on user requirement, multiple-response questions always have exactly 2 correct answers
- If pattern contains "TWO" → `multiple-response`
- Otherwise → `multiple-choice`

#### Options Extraction
- **Option A**: `-\s*A\.\s+(.*?)(?=\n\s*-\s*B\.)`
- **Option B**: `-\s*B\.\s+(.*?)(?=\n\s*-\s*C\.)`
- **Option C**: `-\s*C\.\s+(.*?)(?=\n\s*-\s*D\.)`
- **Option D**: `-\s*D\.\s+(.*?)(?=\n|Answer|\n\s*-\s*E\.)`
- **Option E** (optional): `-\s*E\.\s+(.*?)(?=\n|Answer|\n\s*-\s*F\.)`
- **Option F** (optional): `-\s*F\.\s+(.*?)(?=\n|Answer)`
- A-D are always present, E-F are optional

#### Correct Answer Extraction
- Pattern: `Correct answer:\s*([A-F](?:,\s*[A-F])*)`
- Parse single answer: `"A"` → `["A"]`
- Parse multiple answers: `"A, B"` → `["A", "B"]`
- **Validation**: For multiple-response, ensure exactly 2 answers

#### Explanation Extraction
- Pattern: `(?:Explanation|Answer):\s*(.*?)(?=\n\d+\.|$)`
- Optional field (may not be present)
- Clean markdown formatting if needed

**Output Format**:
```typescript
interface ParsedQuestion {
  text: string;
  type: "multiple-choice" | "multiple-response";
  options: string[]; // Array of option texts
  correctAnswers: string[]; // ["A"] or ["A", "B"] (always 2 for multiple-response)
  explanation?: string;
  source: string; // e.g., "practice-exam-1.md"
}
```

---

### 3. Question Deduplication (`scripts/deduplicate-questions.ts`)

**Purpose**: Remove duplicate questions using content hashing

**Hashing Algorithm**:
- Create SHA256 hash from: `questionText + optionA + optionB + optionC + optionD + optionE? + optionF?`
- Use hash as unique question ID

**Process**:
1. Group questions by hash
2. Keep first occurrence of each unique hash
3. Log duplicate count for reporting
4. Return deduplicated array

**Example**:
```typescript
function createQuestionHash(question: ParsedQuestion): string {
  const content = [
    question.text,
    ...question.options
  ].join("|");
  
  return crypto.createHash("sha256")
    .update(content)
    .digest("hex");
}
```

---

### 4. Domain Mapping (`scripts/map-domains.ts`)

**Purpose**: Map questions to CLF-C02 domains based on content/keywords

**CLF-C02 Domain Structure**:
- **Domain 1**: Cloud Concepts (24% of exam)
- **Domain 2**: Security & Compliance (30% of exam)
- **Domain 3**: Cloud Technology & Services (34% of exam)
- **Domain 4**: Billing, Pricing, and Support (12% of exam)

**Mapping Strategy**:
1. **Keyword-based**: Match question text and options against domain keywords
2. **Fallback**: If unclear, assign to Domain 3 (largest domain)
3. **Manual Review**: Flag ambiguous questions for manual review

**Domain Keywords** (examples):
- **Domain 1**: cloud concepts, cloud models, shared responsibility, cloud economics
- **Domain 2**: security, compliance, IAM, encryption, access control
- **Domain 3**: compute, storage, database, networking, AWS services
- **Domain 4**: billing, pricing, cost optimization, support plans

**Output**:
```typescript
interface QuestionWithDomain extends ParsedQuestion {
  domain: 1 | 2 | 3 | 4;
}
```

---

### 5. Data Storage (`scripts/fetch-questions.ts` - final step)

**Purpose**: Save structured questions as JSON

**Output Format**:
```json
{
  "questions": [
    {
      "id": "abc123...", // SHA256 hash (64 chars)
      "text": "What is the primary purpose of Amazon S3?",
      "type": "multiple-choice",
      "options": [
        "Object storage",
        "Block storage",
        "File storage",
        "Database storage"
      ],
      "correctAnswers": ["A"],
      "explanation": "Amazon S3 is designed for object storage...",
      "source": "practice-exam-1.md",
      "domain": 3
    },
    {
      "id": "def456...",
      "text": "Which of the following are AWS compute services? $$Choose TWO$$",
      "type": "multiple-response",
      "options": [
        "Amazon EC2",
        "Amazon S3",
        "AWS Lambda",
        "Amazon RDS",
        "Amazon ECS"
      ],
      "correctAnswers": ["A", "C"], // Always exactly 2
      "explanation": "EC2 and Lambda are compute services...",
      "source": "practice-exam-2.md",
      "domain": 3
    }
  ],
  "metadata": {
    "totalQuestions": 250,
    "lastUpdated": "2025-11-23",
    "sources": [
      "practice-exam-1.md",
      "practice-exam-2.md",
      "...",
      "practice-exam-23.md"
    ],
    "domainWeights": {
      "1": 0.24,
      "2": 0.30,
      "3": 0.34,
      "4": 0.12
    },
    "domainCounts": {
      "1": 60,  // Example counts
      "2": 75,
      "3": 85,
      "4": 30
    }
  }
}
```

**File Location**: `data/questions.json`

---

## 🚀 Execution Flow

```typescript
async function main() {
  console.log("Starting Phase 1: Data Collection & Processing\n");
  
  // Step 1: Fetch all exam files
  console.log("Step 1: Fetching exam files from GitHub...");
  const examFiles = await fetchAllExamFiles();
  console.log(`✓ Fetched ${examFiles.length} files\n`);
  
  // Step 2: Parse questions from each file
  console.log("Step 2: Parsing questions...");
  const allQuestions: ParsedQuestion[] = [];
  for (const file of examFiles) {
    const questions = parseQuestions(file.content, file.name);
    allQuestions.push(...questions);
  }
  console.log(`✓ Parsed ${allQuestions.length} questions\n`);
  
  // Step 3: Deduplicate
  console.log("Step 3: Deduplicating questions...");
  const uniqueQuestions = deduplicateQuestions(allQuestions);
  console.log(`✓ Removed ${allQuestions.length - uniqueQuestions.length} duplicates`);
  console.log(`✓ ${uniqueQuestions.length} unique questions\n`);
  
  // Step 4: Map domains
  console.log("Step 4: Mapping questions to domains...");
  const questionsWithDomains = mapQuestionsToDomains(uniqueQuestions);
  console.log(`✓ Mapped all questions to domains\n`);
  
  // Step 5: Save to JSON
  console.log("Step 5: Saving to JSON...");
  await saveQuestionsToJSON(questionsWithDomains);
  console.log(`✓ Saved to data/questions.json\n`);
  
  // Step 6: Report statistics
  printStatistics(questionsWithDomains);
}
```

---

## 📊 Success Criteria

- [x] Successfully fetch all 23 practice exam files
- [x] Parse at least 200+ unique questions (1,119 questions parsed)
- [x] Deduplication removes duplicates correctly
- [x] All questions mapped to domains (1-4)
- [x] JSON file created with valid structure
- [x] Domain distribution sufficient for balanced assessments:
  - Domain 1: 74 questions (exceeds 50 requirement)
  - Domain 2: 302 questions (exceeds 60 requirement)
  - Domain 3: 499 questions (exceeds 70 requirement)
  - Domain 4: 244 questions (exceeds 25 requirement)

---

## 🧪 Testing Strategy

### Unit Tests
- Test question parsing with various markdown formats
- Test deduplication with known duplicates
- Test domain mapping with sample questions
- Test hash generation consistency

### Integration Tests
- Test full pipeline with sample exam file
- Test error handling (network errors, malformed files)
- Test JSON output format validation

### Manual Validation
- Spot-check parsed questions against source files
- Verify domain assignments make sense
- Check for parsing edge cases

---

## 📝 Implementation Checklist

### Setup
- [x] Create `scripts/` directory
- [x] Create `data/` directory
- [x] Set up TypeScript configuration for scripts
- [x] Install dependencies (if any)

### Core Functions
- [x] Implement `fetchAllExamFiles()`
- [x] Implement `parseQuestions()`
- [x] Implement `deduplicateQuestions()`
- [x] Implement `mapQuestionsToDomains()`
- [x] Implement `saveQuestionsToJSON()`

### Error Handling
- [x] Handle network errors
- [x] Handle parsing errors
- [x] Handle file write errors
- [x] Log errors appropriately

### Validation
- [x] Validate question structure
- [x] Validate domain assignments
- [x] Validate JSON output
- [x] Check for sufficient questions per domain

### Documentation
- [x] Add code comments
- [x] Document edge cases
- [x] Update README with script usage

---

## 🔍 Review Points

Before implementation, please review:

1. **Question Type Detection**: Confirm logic for detecting multiple-response (exactly 2 correct answers)
2. **Domain Mapping**: Review keyword strategy - is it sufficient or need manual mapping?
3. **Error Handling**: Are error handling strategies appropriate?
4. **Output Format**: Confirm JSON structure matches requirements
5. **Deduplication**: Is hash-based deduplication sufficient?
6. **Performance**: Will fetching 23 files sequentially be acceptable, or need parallel fetching?

---

## 📚 References

**Project Documentation**:
- [PRD](./PRD.md) - Product requirements
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Full project architecture
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview

**Technical Specifications**:
- [Question Types](./QUESTION_TYPES.md) - Question format specifications
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status

**External Resources**:
- [GitHub Source](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/tree/master/practice-exam) - Practice exam files

---

## ⏭️ Next Steps After Phase 1

Once Phase 1 is complete and validated:
1. Review question quality and domain distribution
2. Proceed to Phase 2: Smart Contracts
3. Use `data/questions.json` as input for assessment system

---

**Status**: ✅ Complete  
**Next Action**: Phase 1 complete. Proceeded to Phase 2: Smart Contracts

