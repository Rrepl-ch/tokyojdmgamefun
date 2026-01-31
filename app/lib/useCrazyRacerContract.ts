'use client';

import { useEffect } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CRAZY_RACER_CARS_ADDRESS, CRAZY_RACER_CARS_ABI } from './contract';
import { CARS } from '@/app/types/cars';

const CONTRACT_DEPLOYED = CRAZY_RACER_CARS_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function useOwnedCars(): { owned: Set<number>; isLoading: boolean; refetch: () => void } {
  const { address } = useAccount();
  const contracts = CARS.map((_, i) => ({
    address: CRAZY_RACER_CARS_ADDRESS,
    abi: CRAZY_RACER_CARS_ABI,
    functionName: 'ownsCarType' as const,
    args: [address!, i] as const,
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts: CONTRACT_DEPLOYED && address ? contracts : [],
  });

  if (!CONTRACT_DEPLOYED || !address) {
    return { owned: new Set(), isLoading: false, refetch: () => {} };
  }

  const owned = new Set<number>();
  data?.forEach((r, i) => {
    if (r.status === 'success' && r.result === true) owned.add(i);
  });
  return { owned, isLoading, refetch };
}

export function useMintCar(carId: number, onSuccess?: () => void | Promise<void>) {
  const car = CARS[carId];
  const value = car ? BigInt(Math.floor(parseFloat(car.priceEth || '0') * 1e18)) : BigInt(0);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      reset();
    }
  }, [isSuccess, onSuccess, reset]);

  const mint = () => {
    if (!CONTRACT_DEPLOYED) return;
    writeContract({
      address: CRAZY_RACER_CARS_ADDRESS,
      abi: CRAZY_RACER_CARS_ABI,
      functionName: 'mint',
      args: [carId],
      value,
    });
  };

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: CONTRACT_DEPLOYED,
  };
}
