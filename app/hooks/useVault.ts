"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  parseUnits, 
  formatUnits,
  Address
} from 'viem';
import { initiaTestnet } from '@/lib/contractConfig';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { showTxToast } from '@/app/components/TxToast';
import { toast } from 'sonner';

export function useVault(address: string | undefined) {
  const [stats, setStats] = useState({
    totalDeposited: "0",
    totalYieldGenerated: "0",
    totalProtocolFeesAccrued: "0",
    pricePerShare: "1.00"
  });
  const [position, setPosition] = useState({
    value: "0",
    shares: "0",
    pricePerShare: "1.00"
  });
  const [loading, setLoading] = useState(false);

  const publicClient = createPublicClient({
    chain: initiaTestnet,
    transport: custom((window as any).ethereum)
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'getVaultStats',
      }) as any;

      setStats({
        totalDeposited: formatUnits(data[0], 6),
        totalShares: formatUnits(data[1], 6),
        totalYieldGenerated: formatUnits(data[2], 6),
        totalProtocolFeesAccrued: formatUnits(data[3], 6),
        pricePerShare: formatUnits(data[4], 6)
      } as any);
    } catch (e) {
      console.error("Failed to fetch vault stats:", e);
    }
  }, []);

  const fetchPosition = useCallback(async () => {
    if (!address) return;
    try {
      const value = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'getUserValue',
        args: [address as Address]
      }) as bigint;

      const shares = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'userShares',
        args: [address as Address]
      }) as bigint;

      const pps = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'getPricePerShare',
      }) as bigint;

      setPosition({
        value: formatUnits(value, 6),
        shares: formatUnits(shares, 6),
        pricePerShare: formatUnits(pps, 6)
      });
    } catch (e) {
      console.error("Failed to fetch user position:", e);
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
    fetchPosition();
    const interval = setInterval(() => {
      fetchStats();
      fetchPosition();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchPosition]);

  const deposit = async (amount: string, useZap: boolean) => {
    if (!address) return;
    setLoading(true);
    const toastId = showTxToast.pending(useZap ? "Zapping into Weave..." : "Initiating Deposit...");
    
    try {
      const walletClient = createWalletClient({
        account: address as Address,
        chain: initiaTestnet,
        transport: custom((window as any).ethereum)
      });

      const parsedAmount = parseUnits(amount, 6);

      if (useZap) {
        // ZapIn Flow
        const { request } = await publicClient.simulateContract({
          account: address as Address,
          address: CONTRACT_ADDRESSES.weaveZapIn,
          abi: ABIS.weaveZapIn,
          functionName: 'deposit',
          args: [parsedAmount, CONTRACT_ADDRESSES.weaveVault]
        });
        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        showTxToast.success(hash, "Zap completed successfully!");
      } else {
        // Standard Vault Flow
        // 1. Approve
        toast.loading("Approving USDC...", { id: toastId });
        const { request: appReq } = await publicClient.simulateContract({
          account: address as Address,
          address: CONTRACT_ADDRESSES.mockUSDC,
          abi: ABIS.mockERC20,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.weaveVault, parsedAmount]
        });
        const appHash = await walletClient.writeContract(appReq);
        await publicClient.waitForTransactionReceipt({ hash: appHash });

        // 2. Deposit
        toast.loading("Confirming deposit...", { id: toastId });
        const { request: depReq } = await publicClient.simulateContract({
          account: address as Address,
          address: CONTRACT_ADDRESSES.weaveVault,
          abi: ABIS.weaveVault,
          functionName: 'deposit',
          args: [parsedAmount]
        });
        const depHash = await walletClient.writeContract(depReq);
        await publicClient.waitForTransactionReceipt({ hash: depHash });
        
        toast.dismiss(toastId);
        showTxToast.success(depHash, "Deposit confirmed!");
      }
      
      fetchPosition();
      fetchStats();
    } catch (error) {
      toast.dismiss(toastId);
      showTxToast.error(error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (shareAmount: string) => {
    if (!address) return;
    setLoading(true);
    const toastId = showTxToast.pending("Initiating Withdrawal...");
    
    try {
      const walletClient = createWalletClient({
        account: address as Address,
        chain: initiaTestnet,
        transport: custom((window as any).ethereum)
      });

      const parsedShares = parseUnits(shareAmount, 6);
      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: CONTRACT_ADDRESSES.weaveVault,
        abi: ABIS.weaveVault,
        functionName: 'withdraw',
        args: [parsedShares]
      });
      
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast.dismiss(toastId);
      showTxToast.success(hash, "Withdrawal successful!");
      
      fetchPosition();
      fetchStats();
    } catch (error) {
      toast.dismiss(toastId);
      showTxToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    position,
    loading,
    deposit,
    withdraw,
    refresh: () => { fetchStats(); fetchPosition(); }
  };
}
