# App Redesign Plan: Course-Based Architecture with Certification Codes

**Date**: 2025-11-28\
**Status**: Planning → Implementation

---

## 🎯 Goals

1. **Attach Certification Codes to Rewards**: Each reward token should be linked
   to a specific certification (e.g., CLF-C02)
2. **Course-Based Architecture**: Separate courses/certifications with their own
   pages
3. **Separation of Concerns**: Clear separation between course selection,
   assessment, and rewards
4. **Future-Proof**: Build foundation for adding AWS Basics and other courses
   later
5. **Inspired by Realmind**: Course cards and course page structure

---

## 📐 Architecture Overview

### Current Structure (Flat)

```
/ (landing) → /assessment → /results
```

### New Structure (Course-Based)

```
/ (landing with course cards)
  └── /courses/[courseId] (course page)
       └── /courses/[courseId]/assessment (assessment)
            └── /courses/[courseId]/results (results)
```

---

## 🏗️ New Data Models

### 1. Course/Certification Model

```typescript
// types/course.ts
export interface Course {
    id: string; // "ccp", "aws-basics"
    name: string; // "AWS Certified Cloud Practitioner"
    certificationCode: string; // "CLF-C02"
    description: string;
    icon: string; // Icon/logo URL
    color: string; // Theme color
    difficulty: "foundational" | "associate" | "professional";
    estimatedTime: string; // "90 minutes"
    questionCount: number; // 50
    passingScore: number; // 700
    domains: Domain[]; // CLF-C02 domains
    rewardTokenSymbol: string; // "AWSP-CCP"
    isActive: boolean;
    isComingSoon: boolean;
}
```

### 2. Updated Reward Token Model

```typescript
// types/reward.ts
export interface RewardToken {
    symbol: string; // "AWSP-CCP" (certification-specific)
    name: string; // "AWS Practice Reward - Cloud Practitioner"
    certificationCode: string; // "CLF-C02"
    courseId: string; // "ccp"
    decimals: number; // 18
    contractAddress: string; // Token contract address
}
```

### 3. Updated Assessment Model

```typescript
// types/assessment.ts (updated)
export interface AssessmentResult {
    // ... existing fields
    courseId: string; // NEW: Which course this is for
    certificationCode: string; // NEW: "CLF-C02"
    rewardTokenSymbol: string; // NEW: "AWSP-CCP"
}
```

---

## 📁 New File Structure

```
apps/web/src/
├── app/
│   ├── page.tsx                    # Landing with course cards
│   ├── courses/
│   │   └── [courseId]/
│   │       ├── page.tsx            # Course detail page
│   │       ├── assessment/
│   │       │   └── page.tsx        # Assessment (moved from /assessment)
│   │       └── results/
│   │           └── page.tsx       # Results (moved from /results)
│   └── ...
├── components/
│   ├── courses/
│   │   ├── CourseCard.tsx          # Course card component
│   │   ├── CourseGrid.tsx          # Grid of course cards
│   │   └── CourseHeader.tsx        # Course page header
│   └── ...
├── lib/
│   ├── courses.ts                  # Course data and utilities
│   └── ...
└── types/
    ├── course.ts                   # Course types
    └── reward.ts                   # Reward types
```

---

## 🎨 Course Card Design (Realmind-Inspired)

### Course Card Component

```typescript
// components/courses/CourseCard.tsx
interface CourseCardProps {
    course: Course;
    onClick: () => void;
}

// Features:
// - Course icon/logo
// - Course name and certification code
// - Difficulty badge
// - Progress indicator (if started)
// - "Start" or "Continue" button
// - Coming soon badge (if applicable)
```

### Visual Design

- **Card Style**: Bold borders, high contrast (Celo design system)
- **Hover Effect**: Lift/shadow on hover
- **Status Indicators**: Active, Coming Soon, In Progress
- **Color Coding**: Each course has its own color theme

---

## 🔄 Migration Strategy

### Phase 1: Foundation (Current)

1. ✅ Create course data structure
2. ✅ Create CourseCard component
3. ✅ Update landing page with course cards
4. ✅ Create course detail page

### Phase 2: Route Migration

1. Move `/assessment` → `/courses/ccp/assessment`
2. Move `/results` → `/courses/ccp/results`
3. Update all navigation/routing
4. Add course context throughout app

### Phase 3: Reward System Update

1. Update smart contracts to include certification code
2. Update token minting to attach certification code
3. Update claim flow to pass certification code
4. Update UI to show certification-specific tokens

### Phase 4: Future Courses

1. Add AWS Basics course (when ready)
2. Add more certifications as needed

---

## 🔧 Smart Contract Updates

### Updated AssessmentRewards Contract

```solidity
// Add certification code to claim function
function claimReward(
    uint256 score,
    bytes32 assessmentId,
    string memory certificationCode  // NEW: "CLF-C02"
) external nonReentrant {
    // ... existing logic
    
    // Store certification code with claim
    userCertifications[user].push(certificationCode);
    
    // Mint certification-specific token
    // Token symbol would be "AWSP-CCP" for CLF-C02
}
```

### Alternative: Separate Token Contracts per Certification

```solidity
// One token contract per certification
mapping(string => address) public certificationTokens;
// "CLF-C02" => tokenContractAddress
```

---

## 📊 Implementation Checklist

### Landing Page

- [ ] Create CourseCard component
- [ ] Create CourseGrid component
- [ ] Update landing page to show course cards
- [ ] Add course filtering/search (future)

### Course Pages

- [ ] Create course detail page (`/courses/[courseId]`)
- [ ] Add course information display
- [ ] Add "Start Assessment" button
- [ ] Add progress tracking (if user has started)

### Assessment Flow

- [ ] Move assessment to `/courses/[courseId]/assessment`
- [ ] Add course context to assessment
- [ ] Update assessment header with course info
- [ ] Pass courseId through assessment flow

### Results & Rewards

- [ ] Move results to `/courses/[courseId]/results`
- [ ] Update claim button with certification code
- [ ] Show certification-specific token balance
- [ ] Display certification code in reward

### Data Layer

- [ ] Create courses.ts with course data
- [ ] Create course utilities
- [ ] Update assessment types
- [ ] Update API routes to accept courseId

### Smart Contracts

- [ ] Update contract to accept certification code
- [ ] Deploy updated contracts (or create new ones)
- [ ] Update contract addresses in constants

---

## 🎯 Course Data Structure

### Initial Courses

```typescript
export const COURSES: Course[] = [
    {
        id: "ccp",
        name: "AWS Certified Cloud Practitioner",
        certificationCode: "CLF-C02",
        description: "Validate your foundational AWS Cloud knowledge",
        icon: "/icons/ccp.svg",
        color: "#FF9900", // AWS Orange
        difficulty: "foundational",
        estimatedTime: "90 minutes",
        questionCount: 50,
        passingScore: 700,
        domains: [/* CLF-C02 domains */],
        rewardTokenSymbol: "AWSP-CCP",
        isActive: true,
        isComingSoon: false,
    },
    {
        id: "aws-basics",
        name: "AWS Basics",
        certificationCode: null, // No certification code
        description: "Learn the fundamentals of AWS",
        icon: "/icons/aws-basics.svg",
        color: "#232F3E", // AWS Dark Blue
        difficulty: "foundational",
        estimatedTime: "60 minutes",
        questionCount: 30,
        passingScore: 700,
        domains: [],
        rewardTokenSymbol: "AWSP-BASICS",
        isActive: false,
        isComingSoon: true,
    },
];
```

---

## 🔐 Separation of Concerns

### Course Selection Layer

- **Responsibility**: Display courses, handle course selection
- **Components**: CourseCard, CourseGrid, CourseHeader
- **Data**: courses.ts

### Assessment Layer

- **Responsibility**: Run assessments, track progress
- **Components**: QuestionCard, ProgressBar, AssessmentPage
- **Data**: assessment.ts, questions.ts

### Reward Layer

- **Responsibility**: Handle token claims, display balances
- **Components**: ClaimTokenButton, TokenBalance
- **Data**: contracts.ts, rewards.ts

### Routing Layer

- **Responsibility**: Handle navigation, URL structure
- **Files**: app router structure
- **Context**: Course context provider

---

## 📝 Next Steps

1. **Create course data structure** (`lib/courses.ts`)
2. **Create CourseCard component** (inspired by realmind)
3. **Update landing page** to show course cards
4. **Create course detail page** (`/courses/[courseId]`)
5. **Migrate assessment routes** to course-based structure
6. **Update reward system** to include certification codes
7. **Update smart contracts** (if needed)

---

**Status**: Ready for implementation\
**Priority**: High - Foundation for future expansion

