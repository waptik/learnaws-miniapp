# Product Requirements Document (PRD)

## AWS Certification Practice MiniApp

**Version**: 1.0\
**Status**: Planning Phase\
**Last Updated**: 2025-11-23

---

## 📚 Navigation

**Project Documentation**:

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and
  implementation guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection &
  processing

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

## 📋 Product Overview

A CodeSignal-style assessment MiniApp for AWS certification practice (CLF-C02)
built on Celo blockchain with token rewards for passing assessments.

### Problem Statement

Learners preparing for AWS certifications need:

- Access to quality practice questions
- Realistic exam simulation
- Motivation to practice regularly
- Blockchain-based rewards for achievement

### Solution

A Farcaster MiniApp that provides:

- Randomized 50-question assessments
- AWS exam format (multiple-choice and multiple-response questions)
- Scaled scoring with domain breakdown
- Celo token rewards for passing (1 token per pass, max 3/day)
- Bold, high-contrast Celo-branded UI

---

## 🎯 Core Requirements

### Assessment System

1. **Question Pool**
   - Source:
     [AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/tree/master/practice-exam)
   - Fetch via GitHub raw content API (simple fetch, no external libraries)
   - Parse markdown files to extract questions
   - Deduplicate questions by content hash
   - Store unique questions in JSON format

2. **Question Types**
   - **Multiple Choice**: One correct answer out of 4 options (A, B, C, D)
   - **Multiple Response**: Two or more correct answers out of 5+ options
   - Support both types in question pool

3. **Assessment Format**
   - Random selection of 50 questions per assessment
   - **Domain-Balanced**: Every question set must include all 4 CLF-C02 domains
   - **Domain Distribution**: Matches exam weights (Domain 1: 24%, Domain 2:
     30%, Domain 3: 34%, Domain 4: 12%)
   - **For 50 questions**: ~12 from Domain 1, ~15 from Domain 2, ~17 from Domain
     3, ~6 from Domain 4
   - Mix of multiple-choice and multiple-response questions
   - Ensures exam-ready assessment structure

4. **Scoring**
   - Scaled score: 100-1000 (AWS format)
   - Passing threshold: 700/1000
   - Domain-level performance breakdown
   - Pass/Fail display only (no detailed score breakdown shown)

### Token Rewards

1. **Reward Structure**
   - 1 token per passing assessment
   - Maximum 3 tokens per day per user
   - Subsequent attempts same day = no tokens (after 3 passes)

2. **Blockchain Integration**
   - Celo network (Sepolia testnet, Mainnet production)
   - ERC20 reward token contract
   - Daily limit enforcement on-chain
   - Wallet integration via
     [@composer-kit/ui](https://docs.celo.org/tooling/libraries-sdks/composer-kit#composer-kit-ui)
     (Composer Kit UI)
   - Components: Wallet, Transaction, Balance, Address

### User Experience

1. **Assessment Flow**
   - Start screen with rules
   - Question screen (50 questions)
   - Results screen (scaled score + domain breakdown)
   - Token claim (if pass)

2. **Design**
   - Celo brand palette and typography
   - Bold, high-contrast, raw interface
   - CodeSignal-inspired aesthetic
   - Dark mode support with toggle
   - Mobile-first responsive design

---

## 🏗️ Technical Architecture

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Celo Design System
- **Wallet**: Wagmi + Celo Composer Kit
- **State**: React Context

### Backend

- **Runtime**: Next.js API Routes
- **Storage**: JSON files (questions, user stats)
- **Validation**: Zod schemas

### Smart Contracts

- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Network**: Celo (Sepolia testnet, Mainnet)

### Data Processing

- **Method**: Native fetch API (no external dependencies)
- **Source**: GitHub raw content URLs (markdown files)
- **Parsing**: Simple string parsing/regex (no markdown libraries needed)
- **Storage**: JSON format (plain text, no markdown/HTML)

---

## 📊 Question Data Structure

### Multiple Choice Question

```json
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
   "domain": 3,
   "source": "practice-exam-1.md"
}
```

### Multiple Response Question

```json
{
   "id": "def456...", // SHA256 hash (64 chars)
   "text": "Which of the following are AWS compute services? $$Choose TWO$$",
   "type": "multiple-response",
   "options": [
      "Amazon EC2",
      "Amazon S3",
      "AWS Lambda",
      "Amazon RDS",
      "Amazon ECS"
   ],
   "correctAnswers": ["A", "C"], // Array format
   "explanation": "EC2 and Lambda are compute services...",
   "domain": 3,
   "source": "practice-exam-2.md"
}
```

**Note**: Questions are parsed from markdown files using regex patterns:

- Question detection: Split by `\n(?=\d+\.)` pattern
- Multiple response detection: Look for `$$Choose TWO$$` or similar patterns
- Options extraction: Regex patterns for `- A.`, `- B.`, etc. (A-D required, E-F
  optional)
- Correct answer: Extracted from `Correct answer: A` or `Correct answer: A, B`
  format

---

## 🎨 Design Requirements

### Celo Brand System

- **Colors**: Yellow (#FCFF52), Forest Green (#4E632A), Purple (#1A0329)
- **Typography**: GT Alpina (headlines), Inter (body)
- **Style**: Raw, structural, high-contrast
- **Components**: Rectangular, sharp edges, no rounded corners

### Dark Mode

- Light mode: Light tan background
- Dark mode: Purple background
- Theme toggle in navbar
- System preference detection

### Mobile-First

- Responsive typography (clamp)
- Touch-friendly interactions
- Optimized for MiniApp viewport
- Fluid layouts

---

## 🔐 Security & Validation

1. **Question Integrity**
   - Hash questions to prevent tampering
   - Validate question format

2. **Score Validation**
   - Cryptographic signatures for on-chain verification
   - Backend validation before claim

3. **Daily Limits**
   - On-chain enforcement (3 tokens/day)
   - UTC day boundary

4. **Access Control**
   - Owner-only functions in contracts
   - Rate limiting on API endpoints

---

## 📈 Success Metrics

- **Question Pool**: 200+ unique questions
- **Assessment Completion**: Track completion rates
- **Token Claims**: Monitor daily claim patterns
- **User Engagement**: Track repeat assessments
- **Performance**: <2s question load time

---

## 🚀 Implementation Phases

### Phase 1: Data Collection & Processing

- Fetch questions from GitHub (fetch API)
- Parse and deduplicate
- Store in JSON format

### Phase 2: Smart Contracts

- ERC20 token contract
- Assessment rewards contract
- Tests and deployment

### Phase 3: Frontend - Assessment UI

- Design system implementation
- Question display components
- Results screen

### Phase 4: Scoring & Validation

- Scoring logic
- API routes
- Claim validation

### Phase 5: Wallet Integration

- Celo Composer Kit integration
- Token claim flow
- Transaction handling

### Phase 6: Testing & Polish

- End-to-end testing
- UI refinements
- Performance optimization

---

## 📝 Notes

- **No Code Implementation Yet**: Currently in PRD/planning phase
- **Simple Fetch API**: Using native fetch instead of external GitHub libraries
- **Question Types**: Support both multiple-choice and multiple-response
- **Mobile-First**: Optimized for MiniApp experience
- **Celo Branding**: Official brand guidelines from GitHub discussion

---

**Status**: PRD Phase - Planning & Documentation\
**Next Steps**: Review and approval before implementation
