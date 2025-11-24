# Results Display Specification

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection & processing

**Technical Specifications**:
- [Question Types](./QUESTION_TYPES.md) - Multiple choice and multiple response formats
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status

**Setup Guides**:
- [Farcaster Setup](./FARCASTER_SETUP.md) - Farcaster MiniApp setup guide

---

## Overview

The assessment results screen will display results in the AWS exam results format, showing both the overall score and domain-level performance breakdown.

## Results Screen Components

### 1. Notice of Exam Results

**Layout**: Matches AWS official exam results format

```
┌─────────────────────────────────────────────────┐
│  AWS Certified Cloud Practitioner               │
│  Notice of Exam Results                         │
├─────────────────────────────────────────────────┤
│  Candidate: 0x1234...5678                       │
│  Exam Date: November 23, 2025                    │
│  Candidate Score: 793                           │
│  Pass/Fail: PASS                                │
│                                                 │
│  Congratulations! You have successfully         │
│  completed the AWS Certified Cloud              │
│  Practitioner practice assessment.               │
└─────────────────────────────────────────────────┘
```

**Fields**:
- **Candidate**: User's wallet address (truncated)
- **Exam Date**: Date assessment was completed
- **Candidate Score**: Scaled score (100-1000)
- **Pass/Fail**: Large, bold display (PASS in green, FAIL in red)

**Scoring**:
- Scaled score range: 100-1000
- Passing threshold: 700
- Score calculation: `100 + (percentage_correct * 900)`

### 2. Breakdown of Exam Results

**Layout**: Domain performance table

```
┌─────────────────────────────────────────────────┐
│  Breakdown of Exam Results                      │
├─────────────────────────────────────────────────┤
│  Section              % of    Needs    Meets    │
│                      Scored  Improve  Comp.    │
│                      Items                      │
│  ───────────────────────────────────────────────│
│  Cloud Concepts       24%      [ ]      [█]     │
│  Security &           30%      [ ]      [█]     │
│  Compliance                                    │
│  Cloud Technology     34%      [ ]      [█]     │
│  and Services                                 │
│  Billing, Pricing     12%      [ ]      [█]     │
│  and Support                                  │
└─────────────────────────────────────────────────┘
```

**Domain Details**:

| Domain | Name | % of Exam | Competency Threshold |
|--------|------|-----------|---------------------|
| 1 | Cloud Concepts | 24% | 70% correct |
| 2 | Security and Compliance | 30% | 70% correct |
| 3 | Cloud Technology and Services | 34% | 70% correct |
| 4 | Billing, Pricing, and Support | 12% | 70% correct |

**Visual Indicators**:
- **Meets Competencies**: Orange filled block (█)
- **Needs Improvement**: Empty block ( )
- Color coding: Green for "Meets", Red for "Needs Improvement"

**Competency Calculation**:
- Each domain requires ≥70% correct answers to "Meet Competencies"
- Below 70% = "Needs Improvement"

### 3. Action Buttons

```
┌─────────────────────────────────────────────────┐
│  [Claim Token]          [Take Another]         │
└─────────────────────────────────────────────────┘
```

**Claim Token Button**:
- Only visible if `passFail === 'PASS'`
- Disabled if daily limit reached (3 tokens)
- Shows wallet connection status
- Initiates blockchain transaction

**Take Another Button**:
- Always visible
- Starts new assessment session

## Data Structure

### AssessmentResult Interface

```typescript
interface AssessmentResult {
  // Notice of Exam Results
  candidateAddress: string;        // Wallet address
  examDate: string;                // ISO date
  scaledScore: number;             // 100-1000
  passFail: 'PASS' | 'FAIL';
  passingScore: number;            // Always 700
  
  // Breakdown of Exam Results
  domainPerformance: DomainPerformance[];
  
  // Metadata
  totalQuestions: number;
  correctAnswers: number;
  assessmentId: string;
}

interface DomainPerformance {
  domain: number;                  // 1-4
  domainName: string;
  percentage: number;              // 24, 30, 34, 12
  correct: number;
  total: number;
  competency: 'MEETS' | 'NEEDS_IMPROVEMENT';
}
```

## Design Specifications

### Colors

**Pass State**:
- Score text: `#35D07F` (Celo Green)
- Pass badge: `#35D07F` background, white text
- Meets Competencies: `#FF9900` (AWS Orange)

**Fail State**:
- Score text: `#EF4444` (Red)
- Fail badge: `#EF4444` background, white text
- Needs Improvement: `#EF4444` (Red)

**Neutral**:
- Background: `#FFFFFF` (White)
- Text: `#000000` (Black)
- Borders: `#E5E7EB` (Gray)

### Typography

**Headers**:
- Font: System font, bold
- Size: 24px-32px
- Weight: 700

**Score Display**:
- Font: Monospace
- Size: 48px-64px
- Weight: 700

**Domain Names**:
- Font: System font
- Size: 16px
- Weight: 600

**Table Text**:
- Font: Monospace
- Size: 14px
- Weight: 400

### Layout

- **Max Width**: 800px
- **Padding**: 32px
- **Spacing**: 24px between sections
- **Border**: 1px solid `#E5E7EB`
- **Border Radius**: 0px (sharp edges, CodeSignal style)

## Component Structure

```
ResultsScreen/
├── ScoreDisplay.tsx          # Notice of Exam Results
│   ├── CandidateInfo
│   ├── ScoreValue
│   └── PassFailBadge
├── DomainBreakdown.tsx        # Breakdown table
│   ├── DomainRow (x4)
│   └── CompetencyIndicator
└── ActionButtons.tsx
    ├── ClaimTokenButton
    └── TakeAnotherButton
```

## Implementation Notes

1. **Score Calculation**: Uses AWS scaled scoring formula
2. **Domain Mapping**: Questions must be tagged with domain (1-4)
3. **Competency Threshold**: 70% per domain for "Meets Competencies"
4. **Visual Feedback**: Clear distinction between pass/fail states
5. **Accessibility**: High contrast, readable fonts, clear labels

## Example Output

**Passing Example**:
- Scaled Score: 793
- Pass/Fail: PASS
- All domains: Meets Competencies

**Failing Example**:
- Scaled Score: 650
- Pass/Fail: FAIL
- Domain 1: Meets Competencies
- Domain 2: Needs Improvement
- Domain 3: Needs Improvement
- Domain 4: Meets Competencies

---

**Last Updated**: 2025-11-23  
**Status**: Ready for Implementation

