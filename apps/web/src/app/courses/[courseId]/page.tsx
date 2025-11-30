"use client";

import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { getCourseById, isCourseActive } from "@/lib/courses";
import { WalletConnectButton } from "@/components/connect-button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { DOMAIN_INFO } from "@/types/assessment";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  const courseId = params.courseId as string;
  const course = getCourseById(courseId);

  if (!course) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Course Not Found
          </h1>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </main>
    );
  }

  const handleStartAssessment = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Connection Required",
        description:
          "Please connect your wallet to take the assessment and earn rewards.",
        variant: "destructive",
      });
      return;
    }

    if (!isCourseActive(courseId)) {
      toast({
        title: "Course Not Available",
        description: "This course is not yet available.",
        variant: "destructive",
      });
      return;
    }

    router.push(`/courses/${courseId}/assessment`);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="mb-6 border-2 border-black dark:border-white"
        >
          ← Back to Courses
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="text-6xl flex-shrink-0"
              style={{ color: course.color }}
            >
              {course.icon}
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl font-bold text-black dark:text-white mb-2 uppercase">
                {course.name}
              </h1>
              {course.certificationCode && (
                <div className="mb-2">
                  <p className="font-body text-lg text-gray-600 dark:text-gray-400 font-semibold">
                    {course.certificationCode} - Practice Exam
                  </p>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-500 italic">
                    Mock exam for practice purposes only
                  </p>
                </div>
              )}
              {/* Info line */}
              <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-3">
                {course.questionCount} Q •{" "}
                {course.estimatedTime
                  .toUpperCase()
                  .replace("MINUTES", "MIN")
                  .replace("MINUTE", "MIN")}{" "}
                • Pass: {course.passingScore}/1000
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-2 border-black dark:border-white font-bold"
                >
                  {course.difficulty.toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-2 border-black dark:border-white font-bold"
                >
                  {course.estimatedTime}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-2 border-black dark:border-white font-bold"
                >
                  {course.questionCount} Questions
                </Badge>
                <Badge
                  variant="outline"
                  className="border-2 border-black dark:border-white font-bold"
                >
                  Pass: {course.passingScore}/1000
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <p className="font-body text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Practice Exam Notice */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
          <p className="font-body text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This is a <strong>practice/mock exam</strong>{" "}
            to help you prepare for the AWS certification. This is{" "}
            <strong>not</strong> the official AWS certification exam.
          </p>
        </div>

        {/* Domains (if applicable) */}
        {course.domains && course.domains.length > 0 && (
          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-black dark:text-white mb-4 uppercase">
              Practice Exam Domains
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.domains.map((domain) => {
                const domainInfo = DOMAIN_INFO[domain];
                return (
                  <div
                    key={domain}
                    className="p-4 bg-white dark:bg-[var(--celo-purple)] border-2 border-black dark:border-white"
                  >
                    <h3 className="font-body font-bold text-black dark:text-white mb-1">
                      {domainInfo.name}
                    </h3>
                    <p className="font-body text-sm text-gray-600 dark:text-gray-400">
                      {domainInfo.percentage}% of practice exam
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features */}
        {course.features && course.features.length > 0 && (
          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-black dark:text-white mb-4 uppercase">
              What You'll Get
            </h2>
            <ul className="space-y-2">
              {course.features.map((feature, index) => (
                <li
                  key={index}
                  className="font-body text-base text-gray-700 dark:text-gray-300 flex items-center gap-3"
                >
                  <span className="text-green-600 dark:text-green-400 text-xl">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Wallet Connection Notice */}
        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div className="flex-1">
                <h3 className="font-bold text-black dark:text-white mb-1">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  You must connect your wallet to take assessments and earn
                  rewards.
                </p>
                <div className="flex justify-center">
                  <WalletConnectButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Assessment Button */}
        <div className="mt-8">
          {course.isComingSoon ? (
            <Button
              disabled
              className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 border-2 border-gray-400 cursor-not-allowed py-6 text-lg font-bold"
            >
              Coming Soon
            </Button>
          ) : (
            <Button
              onClick={handleStartAssessment}
              disabled={!isConnected}
              className="w-full font-body bg-black dark:bg-[var(--celo-purple)] text-[var(--celo-yellow)] dark:text-white border-[3px] border-black dark:border-white py-6 px-12 text-lg font-bold uppercase tracking-wide shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] hover:bg-[var(--celo-yellow)] hover:text-black dark:hover:bg-[var(--celo-forest-green)] dark:hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnected ? "Start Assessment" : "Connect Wallet to Start"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
