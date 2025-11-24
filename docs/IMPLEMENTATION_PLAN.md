# AWS Certification Practice MiniApp - Implementation Plan

## 📋 Project Overview

A CodeSignal-style assessment MiniApp for AWS certification practice (CLF-C02)
built on Celo blockchain with token rewards for passing assessments.

**Source**: Practice exams from
[AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/tree/master/practice-exam)

---

## 📚 Navigation

**Project Documentation**:

- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection &
  processing ✅
- [Phase 2 Implementation](./PHASE_2_IMPLEMENTATION.md) - Smart contracts

**Technical Specifications**:

- [Question Types](./QUESTION_TYPES.md) - Multiple choice and multiple response
  formats
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment
  results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) -
  Implementation status

**Setup Guides**:

- [Farcaster Setup](./FARCASTER_SETUP.md) - Farcaster MiniApp setup guide

---

## 🎯 Core Requirements

### Assessment System

- **Question Pool**: Fetch all questions from GitHub practice exams
- **Deduplication**: Remove duplicate questions, store unique set
- **Assessment Format**: Random 50 questions per assessment
  - **Domain Distribution**: Every question set must include all 4 CLF-C02
    domains
  - **Domain Proportions**: Match exam weights (Domain 1: 24%, Domain 2: 30%,
    Domain 3: 34%, Domain 4: 12%)
  - **For 50 questions**: ~12 from Domain 1, ~15 from Domain 2, ~17 from Domain
    3, ~6 from Domain 4
  - Ensures exam-ready assessment structure
- **Scoring**: Pass/Fail only (no detailed scores shown)
- **Passing Threshold**: 700/1000 (70% minimum)

### Token Rewards

- **Reward**: 1 token per passing assessment
- **Daily Limit**: Maximum 3 tokens per day
- **Subsequent Attempts**: Same-day attempts after 3 passes = no tokens
- **Blockchain**: Celo network (Sepolia for test, Mainnet for production)

### Design Requirements

- **Style**: Bold, high contrast, raw interface (CodeSignal-inspired)
- **Branding**: Celo + AWS brand palette and typography
- **UI Components**: Celo Composer Kit for wallet features

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Assessment  │  │   Results   │  │   Wallet     │     │
│  │    UI        │  │    Screen   │  │ Integration │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Next.js API Routes)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Question    │  │   Scoring    │  │   Claim     │     │
│  │   Service    │  │   Service    │  │ Validation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (JSON/File Storage)                 │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Questions   │  │  User Stats │                        │
│  │   Database   │  │   (Memory)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Smart Contracts (Celo)                         │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Reward      │  │   Daily      │                        │
│  │   Token      │  │   Limits     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Implementation Components

### 1. Data Layer - Question Management

#### 1.1 Question Fetcher Script

**Location**: `scripts/fetch-questions.ts`

**Purpose**: Fetch and process questions from GitHub repository

**Process**:

1. Fetch practice exam files from GitHub using raw content API (fetch API)
   - Use GitHub raw content URLs (practice-exam-1.md through
     practice-exam-23.md):
     ```
     https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam/practice-exam-{1..23}.md
     ```
   - No authentication needed for public repositories
   - Simple fetch requests, no external API client library

2. Parse markdown files manually (string parsing/regex) to extract questions:

   **Question Detection**:
   - Split content by question numbers: `\n(?=\d+\.)` regex pattern
   - Each block represents one question

   **Question Text Extraction**:
   - Extract text between question number and options:
     `^\d+\.\s+(.*?)(?=\n\s*-\s*A\.)`
   - Clean whitespace and normalize

   **Question Type Detection**:
   - Check for multiple response indicators:
     `$$Choose\s+(TWO|THREE|FOUR|FIVE|[2-9])$$`
   - If pattern found → `multiple-response`
   - Otherwise → `multiple-choice`

   **Options Extraction** (using regex):
   - Option A: `-\s*A\.\s+(.*?)(?=\n\s*-\s*B\.)`
   - Option B: `-\s*B\.\s+(.*?)(?=\n\s*-\s*C\.)`
   - Option C: `-\s*C\.\s+(.*?)(?=\n\s*-\s*D\.)`
   - Option D: `-\s*D\.\s+(.*?)(?=\n|Answer|\n\s*-\s*E\.)`
   - Option E (optional): `-\s*E\.\s+(.*?)(?=\n|Answer|\n\s*-\s*F\.)`
   - Option F (optional): `-\s*F\.\s+(.*?)(?=\n|Answer)`
   - A-D are always present, E-F are optional

   **Correct Answer Extraction**:
   - Pattern: `Correct answer:\s*([A-F](?:,\s*[A-F])*)`
   - Parse single answer: `"A"` → `["A"]`
   - Parse multiple answers: `"A, B, C"` → `["A", "B", "C"]`

   **Explanation Extraction**:
   - Pattern: `(?:Explanation|Answer):\s*(.*?)(?=\n\d+\.|$)`
   - Optional field, may not be present

   **Question Hashing** (for deduplication):
   - Create SHA256 hash from:
     `questionText + optionA + optionB + optionC + optionD + optionE? + optionF?`
   - Use hash as unique question ID

3. Save structured data as JSON (plain text format)
   - Store in `data/questions.json`
   - Plain text JSON, no markdown or HTML formatting
4. Normalize question format:
   ```typescript
   type QuestionType = "multiple-choice" | "multiple-response";

   interface Question {
     id: string; // Hash of question text
     text: string; // Question text
     type: QuestionType; // Question type
     options: string[]; // Answer options
     correctAnswer: string | string[]; // Single or multiple answers
     explanation?: string; // Optional explanation
     source: string; // Source file name
     domain: Domain; // CLF-C02 domain (1-4)
   }

   // Multiple Choice: One correct answer out of 4 options
   interface MultipleChoiceQuestion extends Question {
     type: "multiple-choice";
     options: [string, string, string, string]; // Exactly 4
     correctAnswer: "A" | "B" | "C" | "D";
   }

   // Multiple Response: Two or more correct answers out of 5+ options
   interface MultipleResponseQuestion extends Question {
     type: "multiple-response";
     options: string[]; // Five or more
     correctAnswer: string[]; // Two or more (e.g., ['A', 'C', 'E'])
   }

   enum Domain {
     CLOUD_CONCEPTS = 1, // 24% of exam
     SECURITY_COMPLIANCE = 2, // 30% of exam
     CLOUD_TECH_SERVICES = 3, // 34% of exam
     BILLING_PRICING_SUPPORT = 4, // 12% of exam
   }
   ```
5. Map questions to CLF-C02 domains based on content/keywords
   - Domain 1: Cloud Concepts (24% of exam)
   - Domain 2: Security & Compliance (30% of exam)
   - Domain 3: Cloud Tech & Services (34% of exam)
   - Domain 4: Billing & Pricing (12% of exam)
   - **Important**: Ensure sufficient questions exist in each domain for
     balanced assessment sets
6. Deduplicate by question text hash
7. Save structured data as JSON (plain text format)
   - Store in `data/questions.json`
   - Plain text JSON, no markdown or HTML formatting

**Dependencies**:

- Native `fetch` API - For GitHub raw content API (no external library needed)
- `RegExp` (JavaScript built-in) - For regex pattern matching
- `crypto` (Node.js built-in) - For SHA256 question ID hashing
- `JSON` (Node.js built-in) - For saving structured data as plain text JSON
- `fs` (Node.js built-in) - For writing JSON file

**Parsing Logic** (based on Python reference implementation):

```typescript
// Pseudo-code structure
function parseExamFile(content: string, sourceName: string): Question[] {
  // 1. Split by question numbers
  const questionBlocks = content.split(/\n(?=\d+\.)/);

  // 2. Process each block
  for (const block of questionBlocks) {
    // Extract question text
    const questionText = extractQuestionText(block);

    // Detect question type
    const isMultipleResponse = /Choose\s+(TWO|THREE|FOUR|FIVE|[2-9])/i.test(
      questionText,
    );
    const type = isMultipleResponse ? "multiple-response" : "multiple-choice";

    // Extract options A-D (required)
    const options = extractOptions(block); // Returns { A, B, C, D, E?, F? }

    // Extract correct answer(s)
    const correctAnswer = extractCorrectAnswer(block); // Returns "A" or "A, B, C"

    // Extract explanation (optional)
    const explanation = extractExplanation(block);

    // Create hash for deduplication
    const hash = createQuestionHash(questionText, options);

    // Build question object
    return {
      id: hash,
      text: questionText,
      type,
      options: [
        options.A,
        options.B,
        options.C,
        options.D,
        ...(options.E ? [options.E] : []),
        ...(options.F ? [options.F] : []),
      ],
      correctAnswers: parseAnswerString(correctAnswer), // ["A"] or ["A", "B", "C"]
      explanation,
      source: sourceName,
    };
  }
}
```

#### 1.2 Question Storage

**Location**: `apps/web/src/data/questions.json`

**Format**:

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
      "correctAnswers": ["A"], // Array format
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
      "correctAnswers": ["A", "C"],
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
    }
  }
}
```

**Parsing Details** (based on Python reference implementation):

- **Question Detection**: Split markdown content by `\n(?=\d+\.)` regex pattern
- **Multiple Response Detection**: Look for `$$Choose TWO$$`,
  `$$Choose THREE$$`, `$$Choose FOUR$$`, etc. patterns in question text
- **Options Extraction**:
  - Required: A-D extracted using regex patterns (`-\s*A\.`, `-\s*B\.`, etc.)
  - Optional: E-F extracted if present
- **Correct Answer Format**: Extracted from `Correct answer: A` or
  `Correct answer: A, B, C` pattern
- **Hash Creation**: SHA256 hash from
  `questionText + optionA + optionB + optionC + optionD + optionE? + optionF?`
- **Source Files**: practice-exam-1.md through practice-exam-23.md (23 files
  total)

#### 1.3 Question Service API

**Location**: `apps/web/src/app/api/questions/route.ts`

**Endpoints**:

- `GET /api/questions/random?count=50` - Get domain-balanced random question set
- `GET /api/questions/stats` - Get question pool statistics

**Domain-Balanced Selection Logic**:

Every question set must include all 4 CLF-C02 domains with proper distribution:

```typescript
const DOMAIN_WEIGHTS = {
  1: 0.24, // Cloud Concepts (24%)
  2: 0.30, // Security & Compliance (30%)
  3: 0.34, // Cloud Tech & Services (34%)
  4: 0.12, // Billing & Pricing (12%)
};

function getDomainBalancedQuestionSet(
  questions: Question[],
  count: number = 50,
): Question[] {
  // Calculate target distribution
  const domainCounts = {
    1: Math.round(count * DOMAIN_WEIGHTS[1]), // ~12 questions
    2: Math.round(count * DOMAIN_WEIGHTS[2]), // ~15 questions
    3: Math.round(count * DOMAIN_WEIGHTS[3]), // ~17 questions
    4: Math.round(count * DOMAIN_WEIGHTS[4]), // ~6 questions
  };

  // Group questions by domain
  const questionsByDomain = {
    1: questions.filter((q) => q.domain === 1),
    2: questions.filter((q) => q.domain === 2),
    3: questions.filter((q) => q.domain === 3),
    4: questions.filter((q) => q.domain === 4),
  };

  // Randomly select from each domain
  const selected: Question[] = [];
  for (const [domain, targetCount] of Object.entries(domainCounts)) {
    const domainQuestions = questionsByDomain[domain];
    const shuffled = shuffleArray([...domainQuestions]);
    selected.push(...shuffled.slice(0, targetCount));
  }

  // Shuffle final set to randomize order
  return shuffleArray(selected);
}
```

**Requirements**:

- Every question set must include questions from all 4 domains
- Distribution must match CLF-C02 exam weights
- Ensures exam-ready assessment structure
- Random selection within each domain

---

### 2. Smart Contracts

#### 2.1 Reward Token Contract

**Location**: `apps/contracts/contracts/AWSRewardToken.sol`

**Features**:

- ERC20 token (using OpenZeppelin)
- Mintable by contract owner
- Transfer restrictions (optional)

**Contract Structure**:

```solidity
contract AWSRewardToken is ERC20, Ownable {
    // Token details
    string public constant name = "AWS Practice Reward";
    string public constant symbol = "AWSP";
    uint8 public constant decimals = 18;
    
    // Minting function for rewards
    function mintReward(address to, uint256 amount) external onlyOwner;
}
```

#### 2.2 Assessment Rewards Contract

**Location**: `apps/contracts/contracts/AssessmentRewards.sol`

**Features**:

- Track daily claims per user
- Validate pass/fail eligibility
- Mint tokens on successful claim
- Enforce daily limits (3 tokens max)

**Contract Structure**:

```solidity
contract AssessmentRewards is Ownable {
    AWSRewardToken public rewardToken;
    
    uint256 public constant TOKENS_PER_PASS = 1e18; // 1 token
    uint256 public constant MAX_DAILY_CLAIMS = 3;
    uint256 public constant PASSING_SCORE = 700; // 700/1000
    
    struct DailyClaim {
        uint256 count;
        uint256 lastClaimTimestamp;
    }
    
    mapping(address => mapping(uint256 => DailyClaim)) public dailyClaims;
    
    // Main claim function
    function claimReward(
        uint256 score,
        bytes32 assessmentId,
        bytes memory signature
    ) external;
    
    // Check if user can claim
    function canClaim(address user) external view returns (bool);
    
    // Get today's claim count
    function getTodayClaimCount(address user) external view returns (uint256);
}
```

**Security Considerations**:

- Signature verification for score validation
- Reentrancy protection
- Daily reset mechanism (UTC day)

---

### 3. Frontend - Assessment UI

#### 3.1 Design System

**Location**: `apps/web/src/styles/celo-design-system.css`

**Official Celo Brand Colors** (from
[Celo Branding Guidelines](https://github.com/orgs/celo-org/discussions/18)):

- **Primary Colors**:
  - Yellow: `#FCFF52` (Bright yellow - Hero sections, CTAs)
  - Forest Green: `#4E632A` (Deep forest green - Alternate backgrounds)
  - Purple: `#1A0329` (Dark purple - High-impact sections)

- **Base Colors**:
  - Light Tan: `#FBF6F1` (Main canvas - Light mode background)
  - Dark Tan: `#E6E3D5` (Secondary blocks - Dark mode background)
  - Brown: `#635949` (Text accents)
  - Black: `#000000` (Core text)
  - White: `#FFFFFF` (Inverse surfaces)

- **Functional Colors**:
  - Inactive: `#9B9B9B` (Disabled elements)
  - Body Copy: `#666666` (Paragraph text)
  - Success: `#329F3B` (Success states)
  - Error: `#E70532` (Error states)

- **Accent Pops** (Use sparingly):
  - Pink: `#F2A9E7`
  - Orange: `#F29E5F`
  - Lime: `#B2EBA1`
  - Light Blue: `#8AC0F9`

**Typography**:

- **Headlines**: GT Alpina (250 weight, tight letter-spacing -0.01em)
  - H1: 72px (clamp 48px-72px mobile-first)
  - H2: 54px (clamp 40px-54px)
  - H3: 48px (clamp 36px-48px)
  - H4: 40px (clamp 32px-40px)
  - Use italic for emphasis

- **Body Text**: Inter (400 weight, clean geometric)
  - Large: 20px (clamp 18px-20px)
  - Medium: 16px (clamp 14px-16px)
  - Small: 14px (clamp 12px-14px)

- **Links/Tags**: Inter 750 weight, uppercase, 12px

**Dark Mode**:

- Light mode: Light tan background (`#FBF6F1`)
- Dark mode: Purple background (`#1A0329`)
- Theme toggle component included
- System preference detection
- Persistent storage via localStorage

**Design Principles**:

- **Raw & Structural**: Sharp rectangles, visible outlines, no rounded corners
- **High Contrast**: Bold color blocks, stark inversions
- **Asymmetrical Layout**: Break grid norms, unexpected spacing
- **Mobile-First**: Responsive typography and spacing using clamp()
- **Poster-Like**: Color, type, and negative space as interface

**Component Library**:

- Celo Composer Kit components for wallet
- Custom Celo-branded components (rectangular, sharp edges)
- Theme provider and toggle
- Mobile-first responsive utilities

#### 3.2 Assessment Flow

**Page**: `apps/web/src/app/assessment/page.tsx`

**Flow**:

1. **Start Screen**
   - Welcome message
   - Rules explanation
   - "Start Assessment" button
   - Wallet connection check

2. **Question Screen**
   - Question number (X/50)
   - Question type indicator (Multiple Choice / Multiple Response)
   - Question text (large, bold)
   - Answer options:
     - **Multiple Choice**: Radio buttons (select one: A, B, C, D)
     - **Multiple Response**: Checkboxes (select two or more: A, B, C, D, E+)
   - Instructions: "Select one" or "Select all that apply"
   - Navigation: Previous/Next
   - Progress indicator

3. **Results Screen** (AWS-style format)
   - **Notice of Exam Results Section**:
     - Candidate name/wallet address
     - Exam date
     - Scaled score (e.g., "793" out of 1000)
     - Pass/Fail status (large, bold)
     - "Congratulations!" message if pass
   - **Breakdown of Exam Results Section**:
     - Domain performance table (shows performance for all 4 domains since every
       assessment includes all domains):
       - Domain 1: Cloud Concepts (24%)
       - Domain 2: Security and Compliance (30%)
       - Domain 3: Cloud Technology and Services (34%)
       - Domain 4: Billing, Pricing, and Support (12%)
     - Each domain shows: "Meets Competencies" or "Needs Improvement"
     - Visual indicators (colored blocks) for performance
   - **Actions**:
     - Claim token button (if pass)
     - "Take Another Assessment" button

#### 3.3 Components

**Location**: `apps/web/src/components/assessment/`

- `QuestionCard.tsx` - Individual question display
- `QuestionTypeIndicator.tsx` - Shows question type (Multiple Choice / Multiple
  Response)
- `OptionButton.tsx` - Answer option button (radio for multiple-choice, checkbox
  for multiple-response)
- `ProgressBar.tsx` - Assessment progress
- `ResultsScreen.tsx` - Complete results with score and breakdown
- `ScoreDisplay.tsx` - Scaled score and Pass/Fail display
- `DomainBreakdown.tsx` - Domain performance table
- `ClaimTokenButton.tsx` - Token claiming with wallet integration (uses Composer
  Kit Transaction component)
- `WalletConnect.tsx` - Wallet connection using Composer Kit
  Wallet/ConnectButton components
- `TokenBalance.tsx` - Display reward token balance using Composer Kit Balance
  component

---

### 4. Backend API Routes

#### 4.1 Assessment API

**Location**: `apps/web/src/app/api/assessment/route.ts`

**Endpoints**:

- `POST /api/assessment/start` - Start new assessment, return domain-balanced
  question set (50 questions)
- `POST /api/assessment/submit` - Submit answers, calculate score
- `POST /api/assessment/claim` - Validate and prepare token claim

**Assessment Start Logic**:

When starting an assessment, the API must:

1. Load all questions from `data/questions.json`
2. Apply domain-balanced selection (ensures all 4 domains are represented)
3. Return 50 questions with proper domain distribution:
   - Domain 1 (Cloud Concepts): ~12 questions (24%)
   - Domain 2 (Security & Compliance): ~15 questions (30%)
   - Domain 3 (Cloud Tech & Services): ~17 questions (34%)
   - Domain 4 (Billing & Pricing): ~6 questions (12%)
4. Generate unique assessment ID
5. Store assessment session (optional, for analytics)

**Scoring Logic**:

```typescript
interface AssessmentResult {
  scaledScore: number; // 100-1000
  passFail: "PASS" | "FAIL";
  domainPerformance: DomainPerformance[];
}

interface DomainPerformance {
  domain: number;
  domainName: string;
  percentage: number; // % of exam
  correct: number;
  total: number;
  competency: "MEETS" | "NEEDS_IMPROVEMENT";
}

function calculateScore(
  answers: Answer[],
  questions: Question[],
): AssessmentResult {
  // Calculate overall score
  // Handles both multiple-choice (single answer) and multiple-response (multiple answers)
  let correct = 0;
  answers.forEach((answer, index) => {
    const question = questions[index];
    if (question.type === "multiple-choice") {
      // Single answer must match exactly
      if (answer.selected === question.correctAnswer) {
        correct++;
      }
    } else {
      // Multiple response: all correct answers must be selected exactly
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.sort()
        : [question.correctAnswer].sort();
      const selectedAnswers = Array.isArray(answer.selected)
        ? answer.selected.sort()
        : [answer.selected].sort();
      if (
        JSON.stringify(correctAnswers) ===
          JSON.stringify(selectedAnswers)
      ) {
        correct++;
      }
    }
  });

  // Scaled score (100-1000, AWS uses scaled scoring)
  const rawPercentage = correct / questions.length;
  const scaledScore = Math.round(100 + (rawPercentage * 900)); // Scale to 100-1000

  // Calculate domain-level performance
  const domainStats = new Map<number, { correct: number; total: number }>();

  questions.forEach((question, index) => {
    const domain = question.domain;
    if (!domainStats.has(domain)) {
      domainStats.set(domain, { correct: 0, total: 0 });
    }
    const stats = domainStats.get(domain)!;
    stats.total++;
    if (answers[index]?.selected === question.correctAnswer) {
      stats.correct++;
    }
  });

  // Determine competency for each domain
  const domainPerformance: DomainPerformance[] = [
    {
      domain: 1,
      domainName: "Cloud Concepts",
      percentage: 24,
      ...domainStats.get(1) || { correct: 0, total: 0 },
      competency: calculateDomainCompetency(domainStats.get(1), 0.7),
    },
    {
      domain: 2,
      domainName: "Security and Compliance",
      percentage: 30,
      ...domainStats.get(2) || { correct: 0, total: 0 },
      competency: calculateDomainCompetency(domainStats.get(2), 0.7),
    },
    {
      domain: 3,
      domainName: "Cloud Technology and Services",
      percentage: 34,
      ...domainStats.get(3) || { correct: 0, total: 0 },
      competency: calculateDomainCompetency(domainStats.get(3), 0.7),
    },
    {
      domain: 4,
      domainName: "Billing, Pricing, and Support",
      percentage: 12,
      ...domainStats.get(4) || { correct: 0, total: 0 },
      competency: calculateDomainCompetency(domainStats.get(4), 0.7),
    },
  ];

  return {
    scaledScore,
    passFail: scaledScore >= 700 ? "PASS" : "FAIL",
    domainPerformance,
  };
}

function calculateDomainCompetency(
  stats: { correct: number; total: number } | undefined,
  threshold: number,
): "MEETS" | "NEEDS_IMPROVEMENT" {
  if (!stats || stats.total === 0) return "NEEDS_IMPROVEMENT";
  const percentage = stats.correct / stats.total;
  return percentage >= threshold ? "MEETS" : "NEEDS_IMPROVEMENT";
}
```

#### 4.2 Claim Validation API

**Location**: `apps/web/src/app/api/claim/route.ts`

**Process**:

1. Verify user passed assessment (score >= 700)
2. Check daily claim count from contract
3. Verify not exceeded daily limit (3 tokens)
4. Generate signature for on-chain claim
5. Return claim data to frontend

---

### 5. Wallet Integration

#### 5.1 Celo Composer Kit UI Setup

**Package**:
[@composer-kit/ui](https://docs.celo.org/tooling/libraries-sdks/composer-kit#composer-kit-ui)

**Installation**:

```bash
pnpm add @composer-kit/ui
```

**Dependencies**:

```json
{
  "@composer-kit/ui": "^latest",
  "wagmi": "^2.0.0",
  "viem": "^2.0.0"
}
```

**Provider Setup**:

```typescript
// apps/web/src/app/layout.tsx or providers.tsx
import { ComposerKitProvider } from "@composer-kit/ui";

export default function RootLayout({ children }) {
  return (
    <ComposerKitProvider>
      {children}
    </ComposerKitProvider>
  );
}
```

**Components to Use**:

- **Wallet**: Connect and display wallet information
- **Connect Button**: Simplified wallet connection
- **Balance**: Display token balances (for reward token)
- **Transaction**: Execute token claim transactions with status tracking
- **Address**: Display wallet addresses with copy functionality

**Key Features**:

- 🔧 Plug-and-play React components for Celo dApps
- 💼 Wallet connection, payment, and transaction modules
- ⚡ Simple installation and configuration
- ♿ Optimized for accessibility and responsive design
- 📚 Comprehensive documentation at
  [composerkit.xyz](https://www.composerkit.xyz/)

#### 5.2 Claim Flow

1. User clicks "Claim Token" after passing
2. Frontend calls `/api/claim` to validate
3. Backend returns claim signature
4. Frontend initiates blockchain transaction
5. Smart contract validates and mints token
6. UI updates with success message

---

## 🎨 Design Specifications

### CodeSignal-Inspired UI

**Characteristics**:

- **Bold Typography**: Large, heavy fonts
- **High Contrast**: Black/white with accent colors
- **Minimal UI**: Focus on content
- **Raw Feel**: No rounded corners, sharp edges
- **Monospace**: Code-like appearance

**Question Screen Layout**:

```
┌─────────────────────────────────────────┐
│  AWS PRACTICE ASSESSMENT                │
├─────────────────────────────────────────┤
│                                         │
│  Question 15/50                         │
│                                         │
│  What is the primary purpose of        │
│  Amazon S3?                             │
│                                         │
│  [A] Object storage                     │
│  [B] Block storage                      │
│  [C] File storage                       │
│  [D] Database storage                   │
│                                         │
│  [Previous]              [Next]         │
│                                         │
└─────────────────────────────────────────┘
```

**Results Screen Layout** (AWS-style):

```
┌─────────────────────────────────────────┐
│  AWS Certified Cloud Practitioner      │
│  Notice of Exam Results                 │
├─────────────────────────────────────────┤
│  Candidate: 0x1234...5678              │
│  Exam Date: 11/23/2025                 │
│  Candidate Score: 793                  │
│  Pass/Fail: PASS                       │
│                                         │
│  Congratulations! You have successfully │
│  completed the AWS Certified Cloud      │
│  Practitioner practice assessment.      │
├─────────────────────────────────────────┤
│  Breakdown of Exam Results              │
├─────────────────────────────────────────┤
│  Section              %    Needs    Meets│
│                      Items Improve  Comp.│
│  ───────────────────────────────────────│
│  Cloud Concepts       24%     [█]        │
│  Security & Compliance 30%     [█]       │
│  Cloud Tech & Services 34%     [█]       │
│  Billing & Pricing    12%     [█]       │
├─────────────────────────────────────────┤
│  [Claim Token]  [Take Another]         │
└─────────────────────────────────────────┘
```

### Brand Integration

**Celo Elements** (using Composer Kit UI):

- Wallet connection UI (Composer Kit Wallet/ConnectButton)
- Token balance display (Composer Kit Balance)
- Transaction handling (Composer Kit Transaction)
- Address display (Composer Kit Address)
- Transaction notifications
- Token balance display
- Celo green accent for success states

**AWS Elements**:

- AWS orange for primary actions
- AWS dark blue for headers
- AWS typography where applicable

---

## 📁 File Structure

```
learnaws-miniapp/
├── apps/
│   ├── contracts/
│   │   ├── contracts/
│   │   │   ├── AWSRewardToken.sol
│   │   │   └── AssessmentRewards.sol
│   │   ├── test/
│   │   │   ├── AWSRewardToken.test.ts
│   │   │   └── AssessmentRewards.test.ts
│   │   └── ignition/
│   │       └── modules/
│   │           ├── AWSRewardToken.ts
│   │           └── AssessmentRewards.ts
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/
│       │   │   │   ├── questions/
│       │   │   │   │   └── route.ts
│       │   │   │   ├── assessment/
│       │   │   │   │   └── route.ts
│       │   │   │   └── claim/
│       │   │   │       └── route.ts
│       │   │   ├── assessment/
│       │   │   │   └── page.tsx
│       │   │   └── results/
│       │   │       └── page.tsx
│       │   ├── components/
│       │   │   ├── assessment/
│       │   │   │   ├── QuestionCard.tsx
│       │   │   │   ├── QuestionTypeIndicator.tsx
│       │   │   │   ├── OptionButton.tsx
│       │   │   │   ├── ProgressBar.tsx
│       │   │   │   ├── ResultsScreen.tsx
│       │   │   │   ├── ScoreDisplay.tsx
│       │   │   │   ├── DomainBreakdown.tsx
│       │   │   │   └── ClaimTokenButton.tsx
│       │   │   └── wallet/
│       │   │       └── WalletConnect.tsx
│       │   ├── data/
│       │   │   └── questions.json
│       │   ├── lib/
│       │   │   ├── questions.ts
│       │   │   ├── scoring.ts
│       │   │   ├── domains.ts
│       │   │   └── contract.ts
│       │   └── styles/
│       │       └── design-system.css
│       └── public/
│           └── fonts/ (AWS fonts if needed)
├── scripts/
│   ├── fetch-questions.ts
│   └── deduplicate-questions.ts
└── IMPLEMENTATION_PLAN.md (this file)
```

---

## 🚀 Implementation Phases

### Phase 1: Data Collection & Processing (Week 1) ✅

- [x] Set up GitHub raw content fetching (using fetch API)
- [x] Create question fetcher script
- [x] Parse practice exam files
- [x] Implement deduplication logic
- [x] Store questions in JSON format (1,119 questions in data/questions.json)
- [x] Create question service API (ready for Phase 3)

### Phase 2: Smart Contracts (Week 1-2)

- [ ] Create AWSRewardToken contract
- [ ] Create AssessmentRewards contract
- [ ] Write comprehensive tests
- [ ] Deploy to Sepolia testnet
- [ ] Verify contracts on explorer

### Phase 3: Frontend - Assessment UI (Week 2)

- [ ] Set up design system (Celo + AWS)
- [ ] Create assessment page layout
- [ ] Build question display component
- [ ] Implement answer selection
- [ ] Create progress indicator
- [ ] Build results screen

### Phase 4: Scoring & Validation (Week 2-3)

- [ ] Implement scoring logic
- [ ] Create assessment API routes
- [ ] Add claim validation
- [ ] Integrate with smart contracts
- [ ] Add error handling

### Phase 5: Wallet Integration (Week 3)

- [ ] Integrate Celo Composer Kit
- [ ] Add wallet connect functionality
- [ ] Implement token claim flow
- [ ] Add transaction status tracking
- [ ] Display token balance

### Phase 6: Testing & Polish (Week 3-4)

- [ ] End-to-end testing
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## 🔧 Technical Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Wallet**: Wagmi +
  [@composer-kit/ui](https://docs.celo.org/tooling/libraries-sdks/composer-kit#composer-kit-ui)
- **State**: React Context + Zustand (if needed)

### Backend

- **Runtime**: Next.js API Routes
- **Storage**: JSON files (can migrate to DB later)
- **Validation**: Zod schemas

### Smart Contracts

- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Network**: Celo (Sepolia testnet, Mainnet)

### Data Processing

- **Language**: TypeScript/Node.js
- **GitHub Access**: Native fetch API (no external dependencies)
- **Parsing**: Simple string parsing/regex (no markdown libraries needed)
- **Storage**: JSON format (plain text, no markdown/HTML)
- **Hashing**: Node.js crypto module (for question deduplication)

---

## 🔐 Security Considerations

1. **Question Integrity**: Hash questions to prevent tampering
2. **Score Validation**: Use cryptographic signatures for score verification
3. **Rate Limiting**: Prevent abuse of claim endpoints
4. **Reentrancy**: Protect smart contracts from reentrancy attacks
5. **Daily Limits**: Enforce on-chain to prevent manipulation
6. **Access Control**: Owner-only functions in contracts

---

## 📊 Success Metrics

- **Question Pool**: Target 200+ unique questions
- **Assessment Completion**: Track completion rate
- **Token Claims**: Monitor daily claim patterns
- **User Engagement**: Track repeat assessments
- **Performance**: <2s question load time

---

## 📝 Next Steps

1. **Review & Approve Plan**: Get stakeholder approval
2. **Set Up Repository**: Create necessary file structure
3. **Start Phase 1**: Begin question fetching script
4. **Design Mockups**: Create UI mockups for approval
5. **Contract Design Review**: Review smart contract architecture

---

## 📚 References

- [Celo Composer Kit UI Documentation](https://docs.celo.org/tooling/libraries-sdks/composer-kit#composer-kit-ui)
- [Composer Kit Website](https://www.composerkit.xyz/) - Interactive examples
  and documentation
- [Composer Kit GitHub](https://github.com/celo-org/composer-kit) - Source code
  and detailed README
- [AWS Brand Guidelines](https://aws.amazon.com/architecture/icons/)
- [CodeSignal Design Inspiration](https://codesignal.com)
- [GitHub Repository](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

**Document Version**: 1.2\
**Last Updated**: 2025-11-23\
**Status**: Phase 1 Complete ✅ | Phase 2 In Progress
