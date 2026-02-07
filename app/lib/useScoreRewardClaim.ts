'use client';

import { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SCORE_REWARD_CONTRACT_ADDRESS, SCORE_REWARD_ABI } from './contract';

const DEPLOYED = SCORE_REWARD_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function useScoreRewardClaim(onSuccess?: () => void) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      reset();
    }
  }, [isSuccess, onSuccess, reset]);

  const withdraw = (amount: bigint, nonce: `0x${string}`, v: number, r: `0x${string}`, s: `0x${string}`) => {
    if (!DEPLOYED || !address) return;
    writeContract({
      address: SCORE_REWARD_CONTRACT_ADDRESS,
      abi: SCORE_REWARD_ABI,
      functionName: 'claim',
      args: [address, amount, nonce, v, r, s],
    });
  };

  return {
    withdraw,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: DEPLOYED,
  };
}
