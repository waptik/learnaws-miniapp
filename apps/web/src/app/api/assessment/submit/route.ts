import { NextRequest, NextResponse } from "next/server";
import { calculateAssessmentResult } from "@/lib/scoring";
import { Question, Answer } from "@/types/assessment";
import { z } from "zod";

const submitSchema = z.object({
  assessmentId: z.string(),
  candidateAddress: z.string(),
  questions: z.array(z.any()), // Question type
  answers: z.array(z.any()), // Answer type
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log API request
    console.log("[API] POST /api/assessment/submit", {
      timestamp: new Date().toISOString(),
      body: {
        assessmentId: body.assessmentId,
        candidateAddress: body.candidateAddress,
        questionsCount: body.questions?.length || 0,
        answersCount: body.answers?.length || 0,
      },
    });
    
    // Validate request body
    const validationResult = submitSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { assessmentId, candidateAddress, questions, answers } = validationResult.data;

    // Validate questions and answers arrays match
    if (questions.length !== answers.length) {
      return NextResponse.json(
        { error: "Questions and answers arrays must have the same length" },
        { status: 400 }
      );
    }

    // Calculate assessment result
    const result = calculateAssessmentResult(
      questions as Question[],
      answers as Answer[],
      candidateAddress,
      assessmentId
    );

    console.log("[API] POST /api/assessment/submit - Success", {
      assessmentId: result.assessmentId,
      scaledScore: result.scaledScore,
      passFail: result.passFail,
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}

