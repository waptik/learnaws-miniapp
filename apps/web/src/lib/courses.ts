/**
 * Course Data and Utilities
 * Manages course/certification information
 */

import { Course } from "@/types/course";
import { Domain } from "@/types/assessment";

/**
 * Available courses in the app
 */
export const COURSES: Course[] = [
  {
    id: "ccp",
    name: "AWS Certified Cloud Practitioner",
    certificationCode: "CLF-C02",
    description:
      "Practice for the AWS Certified Cloud Practitioner (CLF-C02) exam with mock assessments. This is a practice exam to help you prepare - not the official AWS certification exam.",
    icon: "☁️",
    color: "#FF9900", // AWS Orange
    difficulty: "foundational",
    estimatedTime: "90 minutes",
    questionCount: 50,
    passingScore: 700,
    domains: [
      Domain.CLOUD_CONCEPTS,
      Domain.SECURITY_COMPLIANCE,
      Domain.CLOUD_TECH_SERVICES,
      Domain.BILLING_PRICING_SUPPORT,
    ],
    rewardTokenSymbol: "AWSP-CCP",
    isActive: true,
    isComingSoon: false,
    features: [
      "4 Domain Coverage",
      "50 Practice Questions",
      "Mock Exam Format",
      "Token Rewards",
    ],
  },
  {
    id: "aws-basics",
    name: "AWS Basics",
    certificationCode: null,
    description:
      "Learn the fundamentals of AWS Cloud. Perfect for beginners who want to understand core AWS concepts before pursuing certifications.",
    icon: "📚",
    color: "#232F3E", // AWS Dark Blue
    difficulty: "foundational",
    estimatedTime: "60 minutes",
    questionCount: 30,
    passingScore: 700,
    domains: [],
    rewardTokenSymbol: "AWSP-BASICS",
    isActive: false,
    isComingSoon: true,
    features: [
      "Beginner Friendly",
      "Core Concepts",
      "No Prerequisites",
      "Token Rewards",
    ],
  },
];

/**
 * Get a course by ID
 */
export function getCourseById(courseId: string): Course | undefined {
  return COURSES.find((course) => course.id === courseId);
}

/**
 * Get active courses (not coming soon)
 */
export function getActiveCourses(): Course[] {
  return COURSES.filter((course) => course.isActive && !course.isComingSoon);
}

/**
 * Get course by certification code
 */
export function getCourseByCertificationCode(
  certificationCode: string
): Course | undefined {
  return COURSES.find(
    (course) => course.certificationCode === certificationCode
  );
}

/**
 * Get course reward token symbol
 */
export function getCourseTokenSymbol(courseId: string): string {
  const course = getCourseById(courseId);
  return course?.rewardTokenSymbol || "AWSP";
}

/**
 * Check if course exists and is active
 */
export function isCourseActive(courseId: string): boolean {
  const course = getCourseById(courseId);
  return course?.isActive === true && course?.isComingSoon === false;
}
