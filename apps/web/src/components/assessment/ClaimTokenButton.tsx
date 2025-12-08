"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AssessmentResult } from "@/types/assessment";
import {
  ASSESSMENT_REWARDS_ADDRESS,
  ASSESSMENT_REWARDS_ABI,
  stringToBytes32,
  generateAssessmentIdHash,
  getBlockExplorerUrl,
} from "@/lib/contracts";
import { selectedChain } from "@/lib/chain";
import { useMiniPay } from "@/hooks/use-minipay";
import { useChain } from "@/hooks/use-chain";
import { useContractCall } from "@/hooks/use-contract-call";
import { useCUSDBalance } from "@/hooks/use-cusd-balance";

interface ClaimTokenButtonProps {
  result: AssessmentResult;
}

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { toast } = useToast();
  const isInMiniPay = useMiniPay();
  const { isTestnet, chain: currentChain } = useChain();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Check cUSD balance for MiniPay users
  const {
    balance: cusdBalance,
    hasBalance: hasCUSDBalance,
    isLoading: cusdBalanceLoading,
    symbol,
  } = useCUSDBalance();

  // Unified contract call hook (works for all platforms)
  const {
    callContract,
    isPending: isPendingWrite,
    isConfirming,
    isSuccess,
    error: writeError,
    receiptError,
    transactionHash,
  } = useContractCall();

  // Show toast notifications for transaction status
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log("[ClaimTokenButton] Transaction successful", {
        hash: transactionHash,
        timestamp: new Date().toISOString(),
      });
      setIsClaiming(false);
      toast({
        title: "Tokens Claimed! 🎉",
        description: "Your reward tokens have been minted successfully.",
      });
      setSuccessMessage("Your tokens have been successfully claimed!");
      setShowSuccessDialog(true);
    }
  }, [isSuccess, transactionHash, toast]);

  // Log when transaction hash is received (wallet confirmed)
  useEffect(() => {
    if (transactionHash) {
      console.log(
        "[ClaimTokenButton] Transaction hash received (wallet confirmed)",
        {
          hash: transactionHash,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }, [transactionHash]);

  useEffect(() => {
    if (writeError) {
      // Log detailed error information
      console.error("[ClaimTokenButton] Write error:", {
        error: writeError,
        message: writeError.message,
      });

      // Check if user rejected the transaction
      // Common rejection messages from different wallets
      const errorMessageLower = writeError.message?.toLowerCase() || "";
      const isUserRejection =
        errorMessageLower.includes("rejected") ||
        errorMessageLower.includes("denied") ||
        errorMessageLower.includes("user rejected") ||
        errorMessageLower.includes("user denied") ||
        errorMessageLower.includes("user cancelled") ||
        errorMessageLower.includes("user canceled") ||
        errorMessageLower.includes("action rejected");

      // Reset claiming state when user cancels
      if (isUserRejection) {
        console.log("[ClaimTokenButton] User rejected transaction", {
          timestamp: new Date().toISOString(),
          errorMessage: writeError.message,
        });
        setIsClaiming(false);
        setError(null); // Don't show error for user cancellation
        return; // Don't show toast for user cancellation
      }

      const errorMessage =
        writeError.message || "Transaction failed. Please try again.";
      setError(errorMessage);
      setIsClaiming(false);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  useEffect(() => {
    if (receiptError) {
      const errorMessage =
        receiptError.message || "Transaction confirmation failed.";
      setError(errorMessage);
      setIsClaiming(false);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [receiptError, toast]);

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (result.passFail !== "PASS") {
      setError("You must pass the assessment to claim tokens");
      return;
    }

    // Check if user is on the correct chain
    // For MiniPay: Skip chain validation - automatically adapt to whatever chain MiniPay is connected to
    // MiniPay users must manually switch chains in the MiniPay app, so we just use whatever chain they're on
    if (!isInMiniPay) {
      const expectedChainId = selectedChain.id;
      if (chainId !== expectedChainId) {
        setShowChainDialog(true);
        setError(`Please switch to ${selectedChain.name} to claim tokens`);
        return;
      }
    }

    setError(null);
    setIsClaiming(true);

    try {
      // Validate claim eligibility via API first
      const validationResponse = await fetch("/api/assessment/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: result.assessmentId,
          candidateAddress: address,
          score: result.scaledScore,
          courseId: result.courseId || "", // Pass courseId to API
        }),
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json();
        throw new Error(errorData.error || "Failed to validate claim");
      }

      const validationData = await validationResponse.json();

      if (!validationData.canClaim) {
        setIsClaiming(false);
        setError(validationData.reason || "Cannot claim tokens at this time");
        toast({
          title: "Cannot Claim",
          description:
            validationData.reason || "Cannot claim tokens at this time",
          variant: "destructive",
        });
        return;
      }

      // Generate assessment ID hash
      const assessmentIdHash = generateAssessmentIdHash(
        result.assessmentId,
        address,
        result.scaledScore
      );
      const assessmentIdBytes32 = stringToBytes32(assessmentIdHash);

      // Get courseCode from API response (determined by backend based on course type)
      const courseCode = validationData.claimData?.courseCode || "";

      // Log contract call details for debugging
      console.log("[ClaimTokenButton] Calling claimReward", {
        address: ASSESSMENT_REWARDS_ADDRESS,
        score: result.scaledScore,
        assessmentIdBytes32,
        courseCode,
        candidateAddress: address,
        isMiniPay: isInMiniPay,
        timestamp: new Date().toISOString(),
      });

      // Warn if no cUSD balance for MiniPay users (but don't block)
      if (isInMiniPay && !cusdBalanceLoading && !hasCUSDBalance) {
        console.warn(
          `[ClaimTokenButton] Warning: User has no ${symbol} balance. Transaction may fail.`
        );
        toast({
          title: `Low ${symbol} Balance`,
          description: `You have ${parseFloat(cusdBalance).toFixed(
            4
          )} ${symbol}. You may need ${symbol} for gas fees.`,
          variant: "default",
          duration: 5000,
        });
      }

      // Use unified contract call hook (handles both MiniPay and regular wallets)
      console.log("[ClaimTokenButton] Calling contract via unified hook", {
        contractAddress: ASSESSMENT_REWARDS_ADDRESS,
        functionName: "claimReward",
        args: [result.scaledScore, assessmentIdBytes32, courseCode],
        isMiniPay: isInMiniPay,
      });

      toast({
        title: "Transaction Submitted",
        description: isInMiniPay
          ? `Please confirm the transaction in your wallet (gas fees will be paid in ${symbol}).`
          : "Please confirm the transaction in your wallet.",
      });

      // Call contract using unified hook (works for all platforms)
      await callContract(
        ASSESSMENT_REWARDS_ADDRESS,
        ASSESSMENT_REWARDS_ABI,
        "claimReward",
        [BigInt(result.scaledScore), assessmentIdBytes32, courseCode]
      );
    } catch (err) {
      setIsClaiming(false);

      // Log full error details for debugging
      console.error("[ClaimTokenButton] Claim error:", err);
      console.error("[ClaimTokenButton] Error details:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      });

      // Extract detailed error message with proper serialization
      let errorMessage = "Failed to claim tokens";
      let errorDetails: string | null = null;

      // Helper function to safely stringify error objects - always returns a string
      const stringifyError = (obj: any): string => {
        // If it's already a string and not "[object Object]", return it
        if (typeof obj === "string" && obj !== "[object Object]") {
          return obj;
        }

        try {
          // Handle Error objects specially
          if (obj instanceof Error) {
            const errorData: any = {
              type: "Error",
              name: obj.name,
              message: obj.message,
            };
            if (obj.stack) errorData.stack = obj.stack;
            // Check for cause property (ES2022+) - use type assertion to avoid TS error
            const errorWithCause = obj as any;
            if (errorWithCause.cause) {
              errorData.cause = stringifyError(errorWithCause.cause);
            }
            return JSON.stringify(errorData, null, 2);
          }

          // Handle null or undefined
          if (obj === null) return "null";
          if (obj === undefined) return "undefined";

          // Handle primitives
          if (typeof obj !== "object") {
            return JSON.stringify(obj, null, 2);
          }

          // Handle objects with circular references
          const seen = new WeakSet();
          const errorInfo: any = {};

          // First pass: extract all enumerable properties
          for (const key in obj) {
            try {
              const val = (obj as any)[key];
              if (val === null || val === undefined) {
                errorInfo[key] = val;
              } else if (typeof val === "function") {
                errorInfo[key] = `[Function: ${val.name || "anonymous"}]`;
              } else if (typeof val === "object") {
                if (seen.has(val)) {
                  errorInfo[key] = "[Circular Reference]";
                } else {
                  seen.add(val);
                  // Try to stringify nested objects
                  try {
                    errorInfo[key] = JSON.parse(
                      JSON.stringify(val, (k, v) => {
                        if (typeof v === "function") return `[Function]`;
                        if (v === undefined) return "[undefined]";
                        return v;
                      })
                    );
                  } catch {
                    // If nested object can't be stringified, get its keys
                    errorInfo[key] = Array.isArray(val)
                      ? `[Array(${val.length})]`
                      : `[Object with keys: ${Object.keys(val).join(", ")}]`;
                  }
                }
              } else {
                errorInfo[key] = val;
              }
            } catch (e) {
              errorInfo[key] = `[Error accessing property: ${String(e)}]`;
            }
          }

          // Also try to get non-enumerable properties from Error objects
          if (obj instanceof Error) {
            const errorProps = ["name", "message", "stack", "cause", "code"];
            for (const prop of errorProps) {
              if (!(prop in errorInfo) && prop in obj) {
                try {
                  const val = (obj as any)[prop];
                  if (val !== undefined) {
                    errorInfo[prop] =
                      typeof val === "object" ? stringifyError(val) : val;
                  }
                } catch {
                  // Ignore
                }
              }
            }
          }

          // Stringify the error info
          return JSON.stringify(errorInfo, null, 2);
        } catch (e) {
          // Ultimate fallback: try to get any useful info
          try {
            const fallback: any = {
              errorType: typeof obj,
              stringValue: String(obj),
            };

            // Try to get constructor name
            if (obj && obj.constructor) {
              fallback.constructorName = obj.constructor.name;
            }

            // Try to get some properties
            if (obj && typeof obj === "object") {
              const props: any = {};
              let count = 0;
              for (const key in obj) {
                if (count++ > 10) {
                  props["..."] = "more properties";
                  break;
                }
                try {
                  props[key] = String((obj as any)[key]).substring(0, 100);
                } catch {
                  props[key] = "[Unable to access]";
                }
              }
              fallback.properties = props;
            }

            return JSON.stringify(fallback, null, 2);
          } catch (finalError) {
            return JSON.stringify(
              {
                error: "Failed to serialize error object",
                originalError: String(obj),
                serializationError: String(finalError),
              },
              null,
              2
            );
          }
        }
      };

      // Always stringify the full error first
      const fullErrorString = stringifyError(err);

      // Extract a user-friendly message
      if (err instanceof Error) {
        errorMessage = err.message || "Failed to claim tokens";
      } else if (typeof err === "object" && err !== null) {
        const errorObj = err as any;

        // Try to extract meaningful error message from various paths
        if (errorObj.message) {
          errorMessage = String(errorObj.message);
        } else if (errorObj.error?.message) {
          errorMessage = String(errorObj.error.message);
        } else if (errorObj.data?.message) {
          errorMessage = String(errorObj.data.message);
        } else if (errorObj.reason) {
          errorMessage = String(errorObj.reason);
        } else if (errorObj.code) {
          errorMessage = `Error code: ${errorObj.code}`;
        } else {
          // Try to parse the stringified version to get a message
          try {
            const parsed = JSON.parse(fullErrorString);
            if (parsed.message) {
              errorMessage = String(parsed.message);
            } else if (parsed.error?.message) {
              errorMessage = String(parsed.error.message);
            }
          } catch {
            // If parsing fails, use a default message
          }
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = String(err);
      }

      // Always set errorDetails to the stringified version
      // This ensures we always have valid JSON to display
      errorDetails = fullErrorString;

      // Log for debugging (especially useful for MiniPay where console isn't accessible)
      console.error("[ClaimTokenButton] Full error JSON:", errorDetails);

      setError(errorMessage);
      setErrorDetails(errorDetails);

      // Show error in toast
      toast({
        title: "Error Claiming Tokens",
        description: `${errorMessage}${
          errorDetails ? " (Tap details below)" : ""
        }`,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds
      });
    }
  };

  const handleSwitchChain = () => {
    // MiniPay doesn't support programmatic chain switching
    if (isInMiniPay) {
      setShowChainDialog(false);
      return;
    }
    if (switchChain) {
      switchChain({ chainId: selectedChain.id });
      setShowChainDialog(false);
    }
  };

  // Combine all loading states - include isClaiming for immediate feedback
  const isPending =
    isClaiming || isPendingWrite || isConfirming || isSwitchingChain;

  if (result.passFail !== "PASS") {
    return null;
  }

  // Determine if we're on testnet to show faucet info
  // Celo Sepolia is the testnet, Celo is mainnet
  const faucetUrl = isTestnet ? "https://faucet.celo.org/celo-sepolia" : null;

  // Show different message for MiniPay (cUSD for gas) vs regular wallets (CELO for gas)
  const gasCurrency = isInMiniPay ? "cUSD" : "CELO";

  return (
    <>
      <div>
        {isTestnet && isConnected && !isSuccess && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Note:</strong> {"You'll"} need{" "}
              <strong>{gasCurrency}</strong> tokens on{" "}
              {isInMiniPay ? currentChain.name : selectedChain.name} to pay for
              gas fees.
              {isInMiniPay && (
                <span className="block mt-1 text-xs">
                  MiniPay will use cUSD for gas fees automatically.
                </span>
              )}
            </p>
            {faucetUrl && !isInMiniPay && (
              <div className="space-y-1">
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium block"
                >
                  Get free testnet CELO tokens from faucet →
                </a>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {`If your wallet shows "missing token" in the faucet link, you
                  can still use the faucet directly or copy your wallet address
                  to receive tokens.`}
                </p>
              </div>
            )}
          </div>
        )}
        <Button
          onClick={handleClaim}
          disabled={isPending || !isConnected || isSuccess}
          className="w-full bg-[#35D07F] hover:bg-[#2db86a] text-white font-bold py-3 px-6 disabled:opacity-50"
        >
          {isSwitchingChain
            ? "Switching Network..."
            : isClaiming && !isPendingWrite
            ? "Preparing..."
            : isPendingWrite
            ? "Confirming..."
            : isConfirming
            ? "Processing..."
            : isSuccess
            ? "Claimed ✓"
            : "Claim Token"}
        </Button>
        {error && (
          <div className="mt-2 space-y-2">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                ⚠️ Error: {error}
              </p>
              {errorDetails && (
                <details className="text-xs" open>
                  <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium mb-2">
                    Tap to see error details
                  </summary>
                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-red-300 dark:border-red-700 max-h-64 overflow-auto">
                    <pre className="text-xs text-red-900 dark:text-red-100 break-all whitespace-pre-wrap font-mono">
                      {errorDetails}
                    </pre>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                      💡 Common issues: Check if you have cUSD balance, correct
                      network, or if transaction was rejected.
                    </p>
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
        {transactionHash && (
          <div className="mt-2 text-center space-y-2">
            {isConfirming && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Transaction submitted. Waiting for confirmation...
              </p>
            )}
            <a
              href={getBlockExplorerUrl(transactionHash, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              View transaction on block explorer
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tokens Claimed! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              {successMessage}
              {transactionHash && (
                <div className="mt-3 pt-3 border-t">
                  <a
                    href={getBlockExplorerUrl(transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    View transaction on block explorer
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wrong Network</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be connected to{" "}
              <strong>
                {isInMiniPay ? currentChain.name : selectedChain.name}
              </strong>{" "}
              to claim tokens. Please switch your network to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleSwitchChain}
              disabled={isSwitchingChain}
              className="bg-[#35D07F] hover:bg-[#2db86a] text-white"
            >
              {isSwitchingChain
                ? "Switching..."
                : `Switch to ${
                    isInMiniPay ? currentChain.name : selectedChain.name
                  }`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
