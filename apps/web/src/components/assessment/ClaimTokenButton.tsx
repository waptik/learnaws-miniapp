"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { AssessmentResult } from '@/types/assessment';

interface ClaimTokenButtonProps {
  result: AssessmentResult;
}

export function ClaimTokenButton({ result }: ClaimTokenButtonProps) {
  const { address, isConnected } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implement actual claim logic with smart contract
  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    if (result.passFail !== 'PASS') {
      setError('You must pass the assessment to claim tokens');
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      // TODO: Call smart contract to claim tokens
      // This will be implemented in Phase 4/5
      console.log('Claiming tokens for assessment:', result.assessmentId);
      alert('Token claiming will be implemented in Phase 4/5');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim tokens');
    } finally {
      setIsClaiming(false);
    }
  };

  if (result.passFail !== 'PASS') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleClaim}
        disabled={isClaiming || !isConnected}
        className="w-full bg-[#35D07F] hover:bg-[#2db86a] text-white font-bold py-3 px-6"
      >
        {isClaiming ? 'Claiming...' : 'Claim Token'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}

