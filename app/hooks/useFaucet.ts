"use client";

import { useState, useCallback } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  parseUnits,
  Address
} from 'viem';
import { minievm } from '@/lib/contractConfig';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { showTxToast } from '@/app/components/TxToast';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useFaucet(address: string | undefined) {
  const [loading, setLoading] = useState(false);
  const recordClaim = useMutation(api.faucet.recordFaucetClaim);

  const lastUSDCClaim = useQuery(api.faucet.getFaucetClaim,
    address ? { walletAddress: address, token: "mUSDC" } : "skip"
  );
  const lastINITClaim = useQuery(api.faucet.getFaucetClaim,
    address ? { walletAddress: address, token: "mINIT" } : "skip"
  );

  const publicClient = createPublicClient({
    chain: minievm as any,
    transport: custom((window as any).ethereum)
  });

  const mintToken = async (tokenType: 'mUSDC' | 'mINIT') => {
    if (!address) return;
    setLoading(true);

    const amount = tokenType === 'mUSDC' ? BigInt(10000) : BigInt(1000);
    const tokenAddress = tokenType === 'mUSDC' ? CONTRACT_ADDRESSES.mockUSDC : CONTRACT_ADDRESSES.mockINIT;

    // @ts-ignore
    const toastId = showTxToast.pending(`Minting ${tokenType}...`);

    try {
      const walletClient = createWalletClient({
        account: address as Address,
        chain: minievm as any,
        transport: custom((window as any).ethereum)
      });

      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: tokenAddress,
        abi: ABIS.mockERC20,
        functionName: 'mint',
        args: [address as Address, parseUnits(amount.toString(), 6)]
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      // Save to Convex
      await recordClaim({
        walletAddress: address,
        token: tokenType,
        amount: Number(amount)
      });

      // @ts-ignore
      showTxToast.success(hash, `${amount.toLocaleString()} ${tokenType} added to wallet!`);
    } catch (error) {
      showTxToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCooldown = (lastClaimAt: number | undefined) => {
    if (!lastClaimAt) return { canClaim: true };
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeLeft = (lastClaimAt + dayInMs) - Date.now();

    if (timeLeft <= 0) return { canClaim: true };

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    return { canClaim: false, message: `Available in ${hours}h ${mins}m` };
  };

  return {
    loading,
    mintMockUSDC: () => mintToken('mUSDC'),
    mintMockINIT: () => mintToken('mINIT'),
    usdcStatus: getCooldown(lastUSDCClaim?.lastClaimAt),
    initStatus: getCooldown(lastINITClaim?.lastClaimAt)
  };
}
