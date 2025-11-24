import { NextRequest, NextResponse } from "next/server";
import { getRandomQuestionSet, generateAssessmentId } from "@/lib/questions";
import { Question } from "@/types/assessment";

export async function POST(request: NextRequest) {
  try {
    // Generate unique assessment ID
    const assessmentId = generateAssessmentId();

    // Get domain-balanced question set (50 questions)
    const questions = await getRandomQuestionSet(50);

    return NextResponse.json({
      assessmentId,
      questions,
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    return NextResponse.json(
      { error: "Failed to start assessment" },
      { status: 500 }
    );
  }
}

