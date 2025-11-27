/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/app-utils";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export default function Home() {
  const router = useRouter();

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();

  // Extract user data from context
  // Use connected wallet address if available, otherwise fall back to user custody/verification
  const walletAddress = address || "0x1e4B...605B";
  const displayName = "User";
  const username = "@user";

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          {/* Welcome Header */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome
          </h1>

          {/* Status Message */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            You are signed in!
          </p>

          {/* User Wallet Address */}
          <div className="mb-8">
            <div className="bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/30 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Wallet Status
                </span>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    isConnected
                      ? "text-green-600 dark:text-green-400"
                      : isConnecting
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected
                        ? "bg-green-500 dark:bg-green-400"
                        : isConnecting
                        ? "bg-yellow-500 dark:bg-yellow-400"
                        : "bg-gray-400 dark:bg-gray-500"
                    }`}
                  ></div>
                  {isConnected
                    ? "Connected"
                    : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {truncateAddress(walletAddress)}
              </p>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="mb-8">
            {/* Profile Avatar */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>

            {/* Profile Info */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {displayName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {username.startsWith("@") ? username : `@${username}`}
              </p>
            </div>
          </div>

          {/* Start Assessment Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.push("/assessment")}
              className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-bold py-4 px-6 text-lg"
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
