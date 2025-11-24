import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canUserClaim,
  getTodayClaimCount,
  getMaxDailyClaims,
  generateAssessmentIdHash,
} from "@/lib/contracts";
import { SCORING_CONFIG } from "@/types/assessment";

const claimSchema = z.object({
  assessmentId: z.string(),
  candidateAddress: z.string(),
  score: z.number().min(0).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    const { assessmentId, candidateAddress, score } = validationResult.data;

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

    // Generate claim data for frontend
    const assessmentIdHash = generateAssessmentIdHash(
      assessmentId,
      candidateAddress,
      score
    );

    return NextResponse.json({
      canClaim: true,
      dailyCount: todayCount,
      maxDailyClaims,
      claimData: {
        assessmentId,
        assessmentIdHash,
        score,
        candidateAddress,
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
