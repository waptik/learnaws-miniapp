# Question Types - AWS Exam Format

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection & processing

**Technical Specifications**:
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status

**Setup Guides**:
- [Farcaster Setup](./FARCASTER_SETUP.md) - Farcaster MiniApp setup guide

---

## Overview

AWS Certified Cloud Practitioner (CLF-C02) exam includes two types of questions:

1. **Multiple Choice** - One correct answer out of 4 options
2. **Multiple Response** - Two or more correct answers out of 5+ options

## Question Type Details

### Multiple Choice Questions

**Format**:
- Exactly 4 answer options (A, B, C, D)
- One correct answer
- Three incorrect answers (distractors)

**Example**:
```
What is the primary purpose of Amazon S3?
A. Object storage
B. Block storage
C. File storage
D. Database storage

Correct Answer: A
```

**UI Implementation**:
- Radio buttons (single selection)
- Instruction: "Select one"
- Visual indicator: "Multiple Choice" badge

### Multiple Response Questions

**Format**:
- Five or more answer options (A, B, C, D, E, ...)
- **Exactly 2 correct answers** (always)
- Must select exactly 2 answers (no more, no less)
- Must select all correct answers (no partial credit)

**Example**:
```
Which of the following are AWS compute services? (Select all that apply)
A. Amazon EC2
B. Amazon S3
C. AWS Lambda
D. Amazon RDS
E. Amazon ECS

Correct Answers: A, C, E
```

**UI Implementation**:
- Checkboxes (multiple selection)
- Instruction: "Choose TWO" or "Select TWO"
- Visual indicator: "Multiple Response" badge
- **Exactly 2 selections required** (cannot select more than 2)
- Disable checkboxes when 2 are selected (prevent more selections)

## Scoring Logic

### Multiple Choice
- **Correct**: Selected answer matches correct answer exactly
- **Incorrect**: Any other selection or no selection

### Multiple Response
- **Correct**: Exactly 2 answers selected, and both are correct
- **Incorrect**: 
  - Less than 2 answers selected
  - More than 2 answers selected (should be prevented by UI)
  - Exactly 2 selected but one or both are incorrect
- **No Partial Credit**: Must select exactly the 2 correct answers

## Data Structure

```typescript
// Multiple Choice Question
{
  id: "q_123",
  text: "What is the primary purpose of Amazon S3?",
  type: "multiple-choice",
  options: [
    "Object storage",
    "Block storage", 
    "File storage",
    "Database storage"
  ],
  correctAnswer: "A",
  domain: 3
}

// Multiple Response Question (always exactly 2 correct answers)
{
  id: "q_456",
  text: "Which of the following are AWS compute services? $$Choose TWO$$",
  type: "multiple-response",
  options: [
    "Amazon EC2",
    "Amazon S3",
    "AWS Lambda",
    "Amazon RDS",
    "Amazon ECS"
  ],
  correctAnswers: ["A", "C"], // Always exactly 2
  domain: 3
}
```

## Answer Format

```typescript
// Multiple Choice Answer
{
  questionId: "q_123",
  selected: "A"  // Single string
}

// Multiple Response Answer
{
  questionId: "q_456",
  selected: ["A", "C", "E"]  // Array of strings
}
```

## UI Components

### QuestionTypeIndicator
- Displays question type badge
- Color coding: Yellow for Multiple Choice, Purple for Multiple Response
- Text: "Multiple Choice" or "Multiple Response"

### OptionButton
- **Multiple Choice**: Radio button group (single selection)
- **Multiple Response**: Checkbox group (multiple selection)
- Celo-branded styling (rectangular, sharp edges)

## Validation

### Multiple Choice
- Must select exactly one option
- Cannot proceed without selection

### Multiple Response
- Must select exactly 2 options (no more, no less)
- UI prevents selecting more than 2 (disable checkboxes when 2 selected)
- Validation on submit: checks if exactly 2 answers selected and both are correct

---

**Reference**: AWS Exam Content Guide  
**Last Updated**: 2025-11-23

