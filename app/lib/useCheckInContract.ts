'use client';

import { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CHECK_IN_CONTRACT_ADDRESS, CHECK_IN_ABI } from './contract';

const DEPLOYED = CHECK_IN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function useCheckInStatus() {
  const { address } = useAccount();
  const { data: canCheckIn, isLoading: canLoading, refetch } = useReadContract({
    address: DEPLOYED && address ? CHECK_IN_CONTRACT_ADDRESS : undefined,
    abi: CHECK_IN_ABI,
    functionName: 'canCheckInToday',
    args: address ? [address] : undefined,
  });
  const { data: streak, refetch: refetchStreak } = useReadContract({
    address: DEPLOYED && address ? CHECK_IN_CONTRACT_ADDRESS : undefined,
    abi: CHECK_IN_ABI,
    functionName: 'getStreak',
    args: address ? [address] : undefined,
  });
  const { data: totalCheckIns, refetch: refetchTotal } = useReadContract({
    address: DEPLOYED && address ? CHECK_IN_CONTRACT_ADDRESS : undefined,
    abi: CHECK_IN_ABI,
    functionName: 'getTotalCheckIns',
    args: address ? [address] : undefined,
  });
  const refetchAll = () => {
    refetch?.();
    refetchStreak?.();
    refetchTotal?.();
  };
  return {
    canCheckInToday: !!canCheckIn,
    streak: streak != null ? Number(streak) : 0,
    totalCheckIns: totalCheckIns != null ? Number(totalCheckIns) : 0,
    isLoading: canLoading,
    contractDeployed: DEPLOYED,
    refetch: refetchAll,
  };
}

export function useCheckIn(refetch?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && refetch) {
      refetch();
      reset();
    }
  }, [isSuccess, refetch, reset]);

  const checkIn = () => {
    if (!DEPLOYED) return;
    writeContract({
      address: CHECK_IN_CONTRACT_ADDRESS,
      abi: CHECK_IN_ABI,
      functionName: 'checkIn',
    });
  };

  return {
    checkIn,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: DEPLOYED,
  };
}
