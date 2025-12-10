"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useChain } from "@/hooks/use-chain";
import { useCUSDBalance } from "@/hooks/use-cusd-balance";
import { useMiniPay, useMiniPayAddress } from "@/hooks/use-minipay";
import { usePayment } from "@/hooks/use-payment";
import { getBlockExplorerUrl } from "@/lib/contracts";
import {
  CheckCircle2,
  Coins,
  Loader2,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";

/**
 * Test page for MiniPay hooks
 * Tests Phase 2 implementation: use-minipay, use-cusd-balance, use-payment
 */
export default function TestMiniPayPage() {
  const { address, isConnected } = useAccount();
  const isInMiniPay = useMiniPay();
  const minipayAddress = useMiniPayAddress();
  const { chain, isTestnet } = useChain();

  // Get network name and native currency (reactive to chain changes)
  // Note: For MiniPay, gas fees are paid in cUSD, but payment amounts are still in CELO
  // Use chain object from useChain hook for reactivity
  const networkInfo = useMemo(() => {
    return {
      name: chain.name,
      currency: chain.nativeCurrency.symbol, // Payment currency (CELO)
      gasCurrency: isInMiniPay ? "cUSD" : chain.nativeCurrency.symbol, // Gas currency (cUSD for MiniPay)
      chainId: chain.id,
    };
  }, [chain, isInMiniPay]);

  const {
    balance,
    isLoading: balanceLoading,
    hasBalance,
    cusdAddress,
    strBalance,
    error: balanceError,
  } = useCUSDBalance();

  const {
    sendPayment,
    isPending,
    error: paymentError,
    transactionHash,
    isMiniPay: paymentIsMiniPay,
  } = usePayment();

  const [testAddress, setTestAddress] = useState("");
  const [testAmount, setTestAmount] = useState("0.001");

  const handleTestPayment = async () => {
    if (!testAddress || !testAmount) {
      alert("Please enter a valid recipient address and amount");
      return;
    }

    // Validate address format
    if (!testAddress.startsWith("0x") || testAddress.length !== 42) {
      alert(
        "Please enter a valid Ethereum address (0x followed by 40 characters)"
      );
      return;
    }

    try {
      await sendPayment(testAddress as `0x${string}`, testAmount);
    } catch (error) {
      // Error is already handled in the hook and displayed via paymentError
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="w-full min-h-screen py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            MiniPay Hooks Test Page
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Test page for Phase 2 implementation: MiniPay detection, cUSD
            balance, and payment hooks
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* MiniPay Detection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                MiniPay Detection
              </CardTitle>
              <CardDescription>
                Test useMiniPay and useMiniPayAddress hooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium">
                  Is MiniPay Environment:
                </span>
                <Badge
                  variant={isInMiniPay ? "default" : "secondary"}
                  className="w-fit"
                >
                  {isInMiniPay ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      No
                    </span>
                  )}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">Wagmi Connection:</span>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Connected: {isConnected ? "Yes" : "No"}</div>
                  <div className="break-all">
                    Address: {address || "Not connected"}
                  </div>
                  <div>
                    Network: {networkInfo.name} (Chain ID: {chain.id})
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  MiniPay Address (Direct):
                </span>
                <div className="text-sm text-muted-foreground">
                  {minipayAddress ? (
                    <code className="bg-muted px-2 py-1 rounded break-all block">
                      {minipayAddress}
                    </code>
                  ) : (
                    <span>Not available (not in MiniPay or not connected)</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* cUSD Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                cUSD Balance
              </CardTitle>
              <CardDescription>Test useCUSDBalance hook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {balanceLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading balance...</span>
                </div>
              ) : balanceError ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {balanceError.message || "Failed to load cUSD balance"}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium">cUSD Balance:</span>
                    <Badge
                      variant={hasBalance ? "default" : "secondary"}
                      className="text-base sm:text-lg w-fit"
                    >
                      {strBalance}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Has Balance:</span>{" "}
                      {hasBalance ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">
                        cUSD Contract Address:
                      </span>
                      <div className="mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-xs break-all block overflow-x-auto">
                          {cusdAddress}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Hook Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Payment Hook
              </CardTitle>
              <CardDescription>
                Test usePayment hook (MiniPay-aware)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium">
                    Is MiniPay (from hook):
                  </span>
                  <Badge
                    variant={paymentIsMiniPay ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {paymentIsMiniPay ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recipient Address:
                  </label>
                  <input
                    type="text"
                    value={testAddress}
                    onChange={(e) => setTestAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                    placeholder="0x1234...5678 (Enter recipient address)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a valid Ethereum address to send test payment
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Test Amount ({networkInfo.currency}):
                  </label>
                  <input
                    type="text"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="0.001"
                  />
                </div>

                <Button
                  onClick={handleTestPayment}
                  disabled={isPending || !isConnected}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test Payment
                    </>
                  )}
                </Button>
              </div>

              {paymentError && (
                <Alert variant="destructive">
                  <AlertTitle>Payment Error</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium break-words">
                        {paymentError instanceof Error
                          ? paymentError.message
                          : typeof paymentError === "object" &&
                            paymentError !== null
                          ? (() => {
                              try {
                                const errorObj = paymentError as any;
                                return (
                                  errorObj.message ||
                                  errorObj.error?.message ||
                                  errorObj.data?.message ||
                                  JSON.stringify(paymentError, null, 2)
                                );
                              } catch {
                                return String(paymentError);
                              }
                            })()
                          : String(paymentError)}
                      </div>
                      {paymentError instanceof Error &&
                        (paymentError as any).originalError && (
                          <details className="text-xs mt-2">
                            <summary className="cursor-pointer text-muted-foreground">
                              Show full error details
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
                              {JSON.stringify(
                                (paymentError as any).originalError,
                                null,
                                2
                              )}
                            </pre>
                          </details>
                        )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {transactionHash && (
                <Alert>
                  <AlertTitle>Transaction Sent</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="break-all">
                        Hash:{" "}
                        <code className="bg-muted px-2 py-1 rounded text-xs break-all block mt-1">
                          {transactionHash}
                        </code>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        <a
                          href={getBlockExplorerUrl(transactionHash, chain.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          View on Block Explorer →
                        </a>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>
                Overall status of MiniPay integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>MiniPay Detection:</span>
                  <Badge
                    variant={isInMiniPay ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {isInMiniPay ? "Working" : "Not in MiniPay"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>Wallet Connection:</span>
                  <Badge
                    variant={isConnected ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {isConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>cUSD Balance Hook:</span>
                  <Badge
                    variant={
                      balanceLoading
                        ? "secondary"
                        : balanceError
                        ? "destructive"
                        : "default"
                    }
                    className="w-fit"
                  >
                    {balanceLoading
                      ? "Loading..."
                      : balanceError
                      ? "Error"
                      : "Working"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>Payment Hook:</span>
                  <Badge
                    variant={paymentError ? "destructive" : "default"}
                    className="w-fit"
                  >
                    {paymentError ? "Error" : "Ready"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
