# Phase 3: Frontend - Assessment UI
## Implementation Plan

**Version**: 1.0  
**Status**: In Progress  
**Last Updated**: 2025-11-24  
**Phase**: Frontend - Assessment UI (Week 2)

---

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection & processing ✅
- [Phase 2 Implementation](./PHASE_2_IMPLEMENTATION.md) - Smart contracts ✅

**Technical Specifications**:
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System](./DESIGN_SYSTEM.md) - Celo brand design system reference
- [Question Types](./QUESTION_TYPES.md) - Multiple choice and multiple response formats

---

## 📋 Overview

Phase 3 focuses on building the frontend assessment UI. This includes the question display, answer selection, progress tracking, and results screen with AWS-style formatting.

---

## 🎯 Objectives

1. **Design System**: Set up Celo + AWS design system
2. **Assessment Page**: Create assessment page layout and routing
3. **Question Components**: Build question display and answer selection
4. **Progress Tracking**: Implement progress indicator
5. **Results Screen**: Build AWS-style results display with score and domain breakdown

---

## 📁 File Structure

```
apps/web/src/
├── app/
│   ├── assessment/
│   │   └── page.tsx              # Assessment page
│   └── results/
│       └── page.tsx              # Results page
├── components/
│   └── assessment/
│       ├── QuestionCard.tsx      # Question display
│       ├── QuestionTypeIndicator.tsx  # Question type badge
│       ├── OptionButton.tsx      # Answer option button
│       ├── ProgressBar.tsx       # Progress indicator
│       ├── ResultsScreen.tsx     # Complete results display
│       ├── ScoreDisplay.tsx      # Score and Pass/Fail
│       ├── DomainBreakdown.tsx   # Domain performance table
│       └── ClaimTokenButton.tsx  # Token claim button
└── lib/
    ├── questions.ts              # Question loading and selection
    └── scoring.ts                # Already exists ✅
```

---

## 🔧 Implementation Details

### 1. Design System Setup

**Location**: `apps/web/src/styles/celo-design-system.css`

**Colors**:
- Celo Green: `#35D07F` (success, pass states)
- AWS Orange: `#FF9900` (meets competencies)
- Red: `#EF4444` (fail, needs improvement)
- High contrast black/white for text

**Typography**:
- Headers: Bold, large (24px-32px)
- Score: Monospace, 48px-64px
- Body: System font, 16px

---

### 2. Assessment Page

**Location**: `apps/web/src/app/assessment/page.tsx`

**Features**:
- Load 50 domain-balanced questions
- Question navigation (Previous/Next)
- Answer selection state management
- Progress tracking
- Submit assessment

**State Management**:
- Questions array
- Current question index
- Answers map (questionId -> selected answers)
- Assessment session ID

---

### 3. Question Components

#### QuestionCard.tsx
- Displays question text
- Shows question number (X/50)
- Renders answer options
- Handles answer selection

#### OptionButton.tsx
- Radio button for multiple-choice
- Checkbox for multiple-response
- Shows option letter (A, B, C, D, E+)
- Visual feedback for selected state

#### QuestionTypeIndicator.tsx
- Badge showing "Multiple Choice" or "Multiple Response"
- Instructions: "Select one" or "Choose TWO"

---

### 4. Progress Bar

**Location**: `apps/web/src/components/assessment/ProgressBar.tsx`

**Features**:
- Shows current question number / total
- Visual progress bar
- Percentage complete

---

### 5. Results Screen

**Location**: `apps/web/src/app/results/page.tsx`

**Components**:
- ScoreDisplay: Scaled score (100-1000), Pass/Fail badge
- DomainBreakdown: Table showing domain performance
- ClaimTokenButton: Claim tokens if passed
- TakeAnotherButton: Start new assessment

**AWS-Style Format**:
- Notice of Exam Results section
- Breakdown of Exam Results table
- Domain competency indicators

---

## 🚀 Execution Flow

### Assessment Flow

1. User clicks "Start Assessment" on home page
2. Navigate to `/assessment`
3. Load 50 domain-balanced questions
4. Display first question
5. User selects answers and navigates
6. Submit assessment
7. Calculate score and domain performance
8. Navigate to `/results` with assessment data
9. Display results in AWS format
10. Show claim button if passed

---

## 📊 Success Criteria

- [ ] Design system implemented (Celo + AWS colors)
- [ ] Assessment page loads 50 questions
- [ ] Question navigation works (Previous/Next)
- [ ] Answer selection works for both question types
- [ ] Progress bar updates correctly
- [ ] Results screen displays AWS-style format
- [ ] Score calculation matches backend logic
- [ ] Domain breakdown shows all 4 domains
- [ ] Claim button appears only for passing scores

---

## 🧪 Testing Strategy

### Component Tests
- QuestionCard renders correctly
- OptionButton handles selection
- ProgressBar calculates correctly
- ResultsScreen displays all data

### Integration Tests
- Full assessment flow
- Answer persistence
- Score calculation
- Navigation between questions

---

## ⏭️ Next Steps After Phase 3

Once Phase 3 is complete and validated:
1. Test assessment flow end-to-end
2. Verify design matches specifications
3. Proceed to Phase 4: Scoring & Validation (API routes)

---

**Status**: In Progress  
**Next Action**: Implement assessment UI components

