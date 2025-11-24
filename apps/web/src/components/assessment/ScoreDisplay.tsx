"use client";

import { AssessmentResult } from "@/types/assessment";

interface ScoreDisplayProps {
  result: AssessmentResult;
}

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const isPass = result.passFail === "PASS";

  return (
    <div className="border-2 border-black dark:border-white p-8 mb-8 bg-white dark:bg-gray-900">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
          AWS Certified Cloud Practitioner
        </h2>
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Notice of Exam Results
        </h3>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="font-semibold text-black dark:text-white">
            Candidate:
          </span>
          <span className="font-mono text-sm text-black dark:text-white">
            {result.candidateAddress.slice(0, 6)}...
            {result.candidateAddress.slice(-4)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-black dark:text-white">
            Exam Date:
          </span>
          <span className="text-black dark:text-white">
            {new Date(result.examDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-black dark:text-white">
            Candidate Score:
          </span>
          <span
            className={`font-mono text-4xl font-bold ${
              isPass ? "text-[#35D07F]" : "text-[#EF4444]"
            }`}
          >
            {result.scaledScore}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-black dark:text-white">
            Pass/Fail:
          </span>
          <span
            className={`px-4 py-2 font-bold text-lg ${
              isPass ? "bg-[#35D07F] text-white" : "bg-[#EF4444] text-white"
            }`}
          >
            {result.passFail}
          </span>
        </div>
      </div>

      {isPass && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
          <p className="text-center font-semibold text-black dark:text-white">
            Congratulations! You have successfully completed the AWS Certified
            Cloud Practitioner practice assessment.
          </p>
        </div>
      )}
    </div>
  );
}
