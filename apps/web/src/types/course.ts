/**
 * Course and Certification Types
 * Defines the structure for courses/certifications in the app
 */

import { Domain } from "./assessment";

export type CourseDifficulty = "foundational" | "associate" | "professional" | "specialty";

export interface Course {
  id: string; // Unique identifier: "ccp", "aws-basics"
  name: string; // Display name: "AWS Certified Cloud Practitioner"
  certificationCode: string | null; // "CLF-C02" or null for non-certification courses
  description: string; // Course description
  icon: string; // Icon/logo URL or emoji
  color: string; // Theme color (hex)
  difficulty: CourseDifficulty;
  estimatedTime: string; // "90 minutes"
  questionCount: number; // Number of questions per assessment
  passingScore: number; // Passing score (e.g., 700)
  domains: Domain[]; // Certification domains (if applicable)
  rewardTokenSymbol: string; // Token symbol: "AWSP-CCP"
  isActive: boolean; // Whether course is available
  isComingSoon: boolean; // Whether course is coming soon
  features?: string[]; // Additional features/benefits
}

export interface CourseProgress {
  courseId: string;
  hasStarted: boolean;
  hasCompleted: boolean;
  bestScore?: number;
  attemptsCount: number;
  lastAttemptDate?: string;
}


