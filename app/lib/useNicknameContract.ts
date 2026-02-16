'use client';

import { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NICKNAMES_CONTRACT_ADDRESS, NICKNAMES_ABI } from './contract';

const NICKNAMES_DEPLOYED = NICKNAMES_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function useNicknameStatus() {
  const { address } = useAccount();
  const { data: hasNick, isLoading, refetch } = useReadContract({
    address: NICKNAMES_DEPLOYED && address ? NICKNAMES_CONTRACT_ADDRESS : undefined,
    abi: NICKNAMES_ABI,
    functionName: 'hasNickname',
    args: address ? [address] : undefined,
  });
  const { data: nickname } = useReadContract({
    address: NICKNAMES_DEPLOYED && address && hasNick ? NICKNAMES_CONTRACT_ADDRESS : undefined,
    abi: NICKNAMES_ABI,
    functionName: 'getNickname',
    args: address ? [address] : undefined,
  });
  return {
    hasNickname: !!hasNick,
    nickname: typeof nickname === 'string' ? nickname : null,
    isLoading,
    refetch,
    contractDeployed: NICKNAMES_DEPLOYED,
  };
}

export function useMintNickname(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      reset();
    }
  }, [isSuccess, onSuccess, reset]);

  const mint = (nick: string) => {
    if (!NICKNAMES_DEPLOYED) return;
    const trimmed = nick.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) return;
    writeContract({
      address: NICKNAMES_CONTRACT_ADDRESS,
      abi: NICKNAMES_ABI,
      functionName: 'mint',
      args: [trimmed],
    });
  };

  return { mint, isPending: isPending || isConfirming, isSuccess, error };
}

export function useNicknameAvailable(nick: string) {
  const trimmed = nick.trim();
  const { data } = useReadContract({
    address: NICKNAMES_DEPLOYED && trimmed.length >= 2 ? NICKNAMES_CONTRACT_ADDRESS : undefined,
    abi: NICKNAMES_ABI,
    functionName: 'isAvailable',
    args: [trimmed],
  });
  return data === true;
}
