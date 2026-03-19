"use client";

import { useState } from 'react';
import {
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
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
        args: [parsedAmount]
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

  const withdraw = async (shares: string, minOut = "0") => {
    if (!isConnected || !address) return;
    setLoading(true);
    try {
      const walletClient = await getWalletClient();
      const parsedShares = parseUnits(shares, 6);
      const parsedMinOut = parseUnits(minOut, 6);

      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'withdraw',
        args: [parsedShares, parsedMinOut]
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      showTxToast.success(hash, `Successfully withdrawn ${shares} shares!`);
    } catch (error) {
      console.error("Withdraw error:", error);
      showTxToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [position, setPosition] = useState({
    shares: "0",
    valueUSD: "0",
    yield: "0",
    pricePerShare: "1.0",
    totalDeposited: "0",
    totalYieldGenerated: "0",
    totalProtocolFees: "0"
  });

  const refreshPosition = async () => {
    if (!address) return;
    try {
      const pps = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'getPricePerShare',
      }) as bigint;

      const shares = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'balanceOf',
        args: [address as Address]
      }) as bigint;

      const stats = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'getVaultStats',
      }) as any[];

      const val = (Number(shares) * Number(pps)) / 1e12;
      
      setPosition({
        shares: formatUnits(shares, 6),
        valueUSD: val.toFixed(2),
        yield: (val - Number(formatUnits(shares, 6))).toFixed(2),
        pricePerShare: formatUnits(pps, 6),
        totalDeposited: formatUnits(stats[0], 6),
        totalYieldGenerated: formatUnits(stats[2], 6),
        totalProtocolFees: (Number(formatUnits(stats[2], 6)) * 0.1).toFixed(2) // 10% fee estimation
      });
    } catch (e) {
      console.error("Refresh Error:", e);
    }
  };

  const getUSDCBalance = async () => {
    if (!address) return "0";
    const bal = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.mockUSDC,
      abi: ABIS.mockERC20,
      functionName: 'balanceOf',
      args: [address as Address]
    }) as bigint;
    return formatUnits(bal, 6);
  };

  return {
    deposit,
    withdraw,
    position,
    refreshPosition,
    getUSDCBalance,
    loading,
    status
  };
}
