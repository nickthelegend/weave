"use client";

import { useState } from 'react';
import {
  createPublicClient,
  http,
  parseUnits,
  Address,
} from 'viem';
import { minievm } from '@/lib/contractConfig';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { useWeaveWallet } from './useWeaveWallet';
import { showTxToast } from '@/app/components/TxToast';

export function useVault() {
  const { address, getWalletClient, isConnected } = useWeaveWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'approving' | 'depositing' | 'success' | 'error'>('idle');

  const publicClient = createPublicClient({
    chain: minievm as any,
    transport: http()
  });

  const deposit = async (amount: string) => {
    if (!isConnected || !address) {
      showTxToast.error(new Error("Please connect your wallet first"));
      return;
    }

    setLoading(true);
    setStatus('approving');

    try {
      const walletClient = await getWalletClient();
      const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals

      // 1. Check Allowance
      const allowance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.mockUSDC,
        abi: ABIS.mockERC20,
        functionName: 'allowance',
        args: [address as Address, CONTRACT_ADDRESSES.weaveVault]
      }) as bigint;

      if (allowance < parsedAmount) {
        // @ts-ignore
        const approveToastId = showTxToast.pending("Approving USDC...");
        const { request: approveReq } = await publicClient.simulateContract({
          account: address as Address,
          address: CONTRACT_ADDRESSES.mockUSDC,
          abi: ABIS.mockERC20,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.weaveVault, parsedAmount]
        });
        const approveHash = await walletClient.writeContract(approveReq);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 2. Deposit
      setStatus('depositing');
      // @ts-ignore
      const depositToastId = showTxToast.pending("Depositing into Vault...");
      const { request: depositReq } = await publicClient.simulateContract({
        account: address as Address,
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'deposit',
        args: [parsedAmount, address as Address]
      });
      const depositHash = await walletClient.writeContract(depositReq);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });

      setStatus('success');
      // @ts-ignore
      showTxToast.success(depositHash, `Successfully deposited ${amount} USDC!`);
    } catch (error) {
      console.error("Deposit error:", error);
      setStatus('error');
      showTxToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    deposit,
    loading,
    status
  };
}
