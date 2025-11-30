"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletConnectButton } from "@/components/connect-button";
import { useToast } from "@/hooks/use-toast";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { getActiveCourses } from "@/lib/courses";

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [isHowToPlayExpanded, setIsHowToPlayExpanded] = useState(true);

  const activeCourses = getActiveCourses();

  return (
    <section className="min-h-screen p-[clamp(0.8rem,3vw,1.5rem)] pt-[clamp(1rem,4vw,2rem)] max-w-[1400px] mx-auto">
      {/* Hero Section - Yellow Banner */}
      <div className="text-center mb-6 p-6 border-[3px] border-black dark:border-white relative bg-[#FCFF52] shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
        <h1 className="font-headline text-[clamp(2rem,8vw,3.5rem)] mb-2 text-black uppercase leading-none m-0 font-[250]">
          Learn AWS, Earn Rewards
        </h1>

        <p className="font-body text-[clamp(0.75rem,2.5vw,0.9rem)] text-[#1A0329] uppercase tracking-[0.02em] font-bold leading-[1.3] m-0">
          Master AWS Certifications, Compete for the Prize Pool
        </p>
      </div>

      {/* How to Play - Expandable Section */}
      <div className="mb-6">
        <button
          onClick={() => setIsHowToPlayExpanded(!isHowToPlayExpanded)}
          className="w-full bg-white dark:bg-[var(--celo-purple)] border-[3px] border-black dark:border-white p-4 px-6 flex justify-between items-center cursor-pointer transition-all duration-200 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF] hover:bg-[var(--celo-dark-tan)] dark:hover:bg-[var(--celo-forest-green)]"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <h3 className="font-body text-[clamp(1rem,3vw,1.3rem)] m-0 uppercase text-black dark:text-white font-[750]">
              How to Play
            </h3>
          </div>
          <span
            className={`text-2xl transition-transform duration-200 inline-block text-black dark:text-white ${
              isHowToPlayExpanded ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </button>

        {isHowToPlayExpanded && (
          <div className="bg-white dark:bg-[var(--celo-purple)] border-[3px] border-black dark:border-white border-t-0 p-6 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF]">
            <div className="flex flex-col gap-5">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="bg-[#FCFF52] border-[3px] border-black dark:border-white w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="font-body text-xl text-black font-[750]">
                    1
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-body text-[clamp(0.9rem,2.5vw,1.1rem)] m-0 mb-1 uppercase text-black dark:text-white font-[750]">
                    Take AWS Quizzes
                  </h4>
                  <p className="font-body text-sm m-0 text-[#635949] dark:text-[#E6E3D5] leading-[1.4] font-normal">
                    Choose from our curated AWS certification quizzes below and
                    test your cloud knowledge
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="bg-[#FCFF52] border-[3px] border-black dark:border-white w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="font-body text-xl text-black font-[750]">
                    2
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-body text-[clamp(0.9rem,2.5vw,1.1rem)] m-0 mb-1 uppercase text-black dark:text-white font-[750]">
                    Earn Tokens
                  </h4>
                  <p className="font-body text-sm m-0 text-[#635949] dark:text-[#E6E3D5] leading-[1.4] font-normal">
                    Complete quizzes to earn reward tokens (1 token per passing
                    assessment, max 3 per day)
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="bg-[#FCFF52] border-[3px] border-black dark:border-white w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="font-body text-xl text-black font-[750]">
                    3
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-body text-[clamp(0.9rem,2.5vw,1.1rem)] m-0 mb-1 uppercase text-black dark:text-white font-[750]">
                    Claim Real Rewards
                  </h4>
                  <p className="font-body text-sm m-0 text-[#635949] dark:text-[#E6E3D5] leading-[1.4] font-normal">
                    Top players share the prize pool and receive real rewards
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                rewards. Keep your wallet connected throughout the assessment.
              </p>
              <div className="flex justify-center">
                <WalletConnectButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Cards Section - Realmind Style */}
      <div className="mb-8">
        <div className="bg-gray-800 dark:bg-gray-700 p-4 mb-6 border-2 border-black dark:border-white">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-white uppercase tracking-wide">
            AVAILABLE <span className="opacity-60">COURSES</span>
          </h2>
        </div>
        <CourseGrid courses={activeCourses} />
      </div>
    </section>
  );
}
