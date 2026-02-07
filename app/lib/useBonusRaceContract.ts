'use client';

import { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BONUS_RACE_CONTRACT_ADDRESS, BONUS_RACE_ABI } from './contract';

const DEPLOYED = BONUS_RACE_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function useBonusRace(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      reset();
    }
  }, [isSuccess, onSuccess, reset]);

  const triggerBonus = () => {
    if (!DEPLOYED) return;
    writeContract({
      address: BONUS_RACE_CONTRACT_ADDRESS,
      abi: BONUS_RACE_ABI,
      functionName: 'use',
    });
  };

  return {
    triggerBonus,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: DEPLOYED,
  };
}
