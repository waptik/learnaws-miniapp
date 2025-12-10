"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ClaimTokenButton } from "@/components/assessment/ClaimTokenButton";
import { TokenBalance } from "@/components/wallet/TokenBalance";
import { Button } from "@/components/ui/button";
import {
  AssessmentResult,
  Domain,
  DomainPerformance,
} from "@/types/assessment";
import { ScoreDisplay } from "@/components/assessment/ScoreDisplay";
import { DomainBreakdown } from "@/components/assessment/DomainBreakdown";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { isMiniPay } from "@/lib/wagmi";
import { useChain } from "@/hooks/use-chain";
import { Badge } from "@/components/ui/badge";

/**
 * Demo page for testing token claim functionality
 * Creates a mock passing assessment result for testing
 * Restricted to authorized wallet address only
 */
export default function DemoClaimPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [mockResult, setMockResult] = useState<AssessmentResult | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const isInMiniPay = isMiniPay();
  const { chain, chainId, isTestnet } = useChain();

  // Check if connected wallet is authorized
  useEffect(() => {
    // Always allow access in development mode
    const isDevelopment =
      env.NEXT_PUBLIC_APP_ENV === "development" ||
      env.NEXT_PUBLIC_VERCEL_ENV === "development";

    if (isDevelopment) {
      setIsAuthorized(true);
      return;
    }

    const allowedWallet = env.NEXT_PUBLIC_ALLOWED_DEMO_WALLET?.toLowerCase();

    if (!allowedWallet || allowedWallet === "") {
      // If no wallet is configured, allow access (for development)
      setIsAuthorized(true);
      return;
    }

    if (isConnected && address) {
      const isAllowed = address.toLowerCase() === allowedWallet;
      setIsAuthorized(isAllowed);

      if (!isAllowed) {
        // Redirect to home if wallet doesn't match
        router.push("/");
      }
    } else {
      setIsAuthorized(null);
    }
  }, [address, isConnected, router]);

  // Create a mock passing assessment result
  const createMockResult = (score: number = 750): AssessmentResult => {
    const mockDomainPerformance: DomainPerformance[] = [
      {
        domain: Domain.CLOUD_CONCEPTS,
        domainName: "Cloud Concepts",
        percentage: 24,
        correct: 12,
        total: 15,
        competency: "MEETS",
      },
      {
        domain: Domain.SECURITY_COMPLIANCE,
        domainName: "Security and Compliance",
        percentage: 30,
        correct: 15,
        total: 18,
        competency: "MEETS",
      },
      {
        domain: Domain.CLOUD_TECH_SERVICES,
        domainName: "Cloud Technology and Services",
        percentage: 34,
        correct: 17,
        total: 20,
        competency: "MEETS",
      },
      {
        domain: Domain.BILLING_PRICING_SUPPORT,
        domainName: "Billing, Pricing, and Support",
        percentage: 12,
        correct: 6,
        total: 7,
        competency: "MEETS",
      },
    ];

    return {
      candidateAddress: address || "0x0000000000000000000000000000000000000000",
      examDate: new Date().toISOString(),
      scaledScore: score,
      passFail: score >= 700 ? "PASS" : "FAIL",
      passingScore: 700,
      domainPerformance: mockDomainPerformance,
      totalQuestions: 60,
      correctAnswers: 50,
      assessmentId: `demo-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      courseId: "ccp", // Use active course for demo
    };
  };

  const handleCreateMockPass = () => {
    setMockResult(createMockResult(750));
  };

  const handleCreateMockFail = () => {
    setMockResult(createMockResult(650));
  };

  const handleCreateMockHighScore = () => {
    setMockResult(createMockResult(950));
  };

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Checking authorization...
          </p>
        </div>
      </main>
    );
  }

  // Show unauthorized message if wallet doesn't match
  if (isAuthorized === false) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Access Restricted
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            This demo page is only accessible to authorized wallets.
          </p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Go Home
          </Button>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Wallet Connection Required
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to test the claim functionality.
          </p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Go Home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Token Claim Demo
            </h1>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Go Home
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Test token claim functionality with mock assessment results
          </p>
        </div>

        {/* Network Info and Token Balance */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Network:
              </span>
              <Badge variant={isTestnet ? "secondary" : "default"}>
                {chain.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                (Chain ID: {chainId})
              </span>
            </div>
            {isInMiniPay && (
              <div className="text-xs text-muted-foreground">
                MiniPay: Gas fees paid in cUSD
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <TokenBalance />
          </div>
        </div>

        {/* Mock Result Controls */}
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4">
            Create Mock Assessment Result
          </h2>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={handleCreateMockPass}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Passing Result (750)
            </Button>
            <Button
              onClick={handleCreateMockHighScore}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create High Score (950)
            </Button>
            <Button
              onClick={handleCreateMockFail}
              variant="outline"
              className="border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
            >
              Create Failing Result (650)
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Note: Only passing results (score ≥ 700) are eligible for token
            claims. The claim button will validate eligibility on-chain before
            allowing the transaction.
          </p>
        </div>

        {/* Mock Result Display */}
        {mockResult && (
          <div className="space-y-6">
            {/* Score Display */}
            <ScoreDisplay result={mockResult} />

            {/* Domain Breakdown */}
            <DomainBreakdown domainPerformance={mockResult.domainPerformance} />

            {/* Claim Button */}
            <div className="mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-700 mb-4">
                <h3 className="font-bold text-black dark:text-white mb-2">
                  Test Claim Functionality
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Click the button below to test the token claim process. The
                  system will:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Validate your claim eligibility via API</li>
                  <li>Check daily claim limits on-chain</li>
                  <li>Submit a transaction to the smart contract</li>
                  <li>Mint reward tokens to your wallet</li>
                </ul>
              </div>
              <ClaimTokenButton result={mockResult} />
            </div>

            {/* Result Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-black dark:text-white mb-2">
                Mock Result Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Assessment ID:
                  </span>
                  <p className="text-black dark:text-white font-mono text-xs break-all">
                    {mockResult.assessmentId}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Wallet Address:
                  </span>
                  <p className="text-black dark:text-white font-mono text-xs break-all">
                    {mockResult.candidateAddress}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Scaled Score:
                  </span>
                  <p className="text-black dark:text-white">
                    {mockResult.scaledScore}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <p
                    className={`font-bold ${
                      mockResult.passFail === "PASS"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {mockResult.passFail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!mockResult && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">
              Click a button above to create a mock assessment result
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
