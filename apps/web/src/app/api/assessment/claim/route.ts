import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canUserClaim,
  getTodayClaimCount,
  getMaxDailyClaims,
  generateAssessmentIdHash,
} from "@/lib/contracts";
import { SCORING_CONFIG } from "@/types/assessment";
import { getCourseCode, isCourseActive } from "@/lib/courses";

const claimSchema = z.object({
  assessmentId: z.string(),
  candidateAddress: z.string(),
  score: z.number().min(0).max(1000),
  courseId: z.string(), // Required: "ccp", "aws-basics", etc.
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log API request
    console.log("[API] POST /api/assessment/claim", {
      timestamp: new Date().toISOString(),
      body: {
        assessmentId: body.assessmentId,
        candidateAddress: body.candidateAddress,
        score: body.score,
        courseId: body.courseId,
      },
    });

    // Validate request body
    const validationResult = claimSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { assessmentId, candidateAddress, score, courseId } =
      validationResult.data;

    // Validate course exists and is active
    if (!isCourseActive(courseId)) {
      console.log(
        "[API] POST /api/assessment/claim - Course validation failed",
        {
          courseId,
          isActive: isCourseActive(courseId),
        }
      );
      return NextResponse.json({
        canClaim: false,
        reason: "Course not found or not active",
        courseId,
      });
    }

    // Validate score meets passing threshold
    if (score < SCORING_CONFIG.PASSING_SCORE) {
      return NextResponse.json({
        canClaim: false,
        reason: "Score is below passing threshold",
        passingScore: SCORING_CONFIG.PASSING_SCORE,
        score,
      });
    }

    // Check on-chain daily limit
    const canClaim = await canUserClaim(candidateAddress);
    const todayCount = await getTodayClaimCount(candidateAddress);
    const maxDailyClaims = await getMaxDailyClaims();

    if (!canClaim) {
      return NextResponse.json({
        canClaim: false,
        reason: "Daily claim limit exceeded",
        dailyCount: todayCount,
        maxDailyClaims,
      });
    }

    // Determine course code for contract (certificationCode for cert courses, courseId for others)
    const courseCode = getCourseCode(courseId);

    // Generate claim data for frontend
    const assessmentIdHash = generateAssessmentIdHash(
      assessmentId,
      candidateAddress,
      score
    );

    console.log("[API] POST /api/assessment/claim - Success", {
      canClaim: true,
      dailyCount: todayCount,
      maxDailyClaims,
      courseId,
      courseCode,
    });

    return NextResponse.json({
      canClaim: true,
      dailyCount: todayCount,
      maxDailyClaims,
      claimData: {
        assessmentId,
        assessmentIdHash,
        score,
        candidateAddress,
        courseId,
        courseCode, // Frontend will send this to contract
      },
    });
  } catch (error) {
    console.error("Error validating claim:", error);
    return NextResponse.json(
      { error: "Failed to validate claim", canClaim: false },
      { status: 500 }
    );
  }
}
