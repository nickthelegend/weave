"use client";

import { useState, useCallback, useEffect } from "react";
import { parseUnits, formatUnits, Address } from "viem";
import { useWeaveWallet } from "./useWeaveWallet";
import { publicClient, VAULT_ADDRESS, MOCK_USDC_ADDRESS } from "@/lib/contractConfig";
import { VAULT_ABI, ERC20_ABI } from "@/lib/abis";
import { showTxToast } from "@/app/components/TxToast";
import { toast } from "sonner";

export function useVault() {
  const { address, getWalletClient } = useWeaveWallet();
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({
    totalDeposited: "0",
    totalYieldGenerated: "0",
    totalProtocolFeesAccrued: "0",
    pricePerShare: "1.00",
  });
  
  const [position, setPosition] = useState({
    value: "0",
    shares: "0",
    pricePerShare: "1.00",
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = (await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getVaultStats",
      })) as any;

      setStats({
        totalDeposited: formatUnits(data[0], 6),
        totalShares: formatUnits(data[1], 6),
        totalYieldGenerated: formatUnits(data[2], 6),
        totalProtocolFeesAccrued: formatUnits(data[3], 6),
        pricePerShare: formatUnits(data[4], 6),
      } as any);
    } catch (e) {
      console.error("Failed to fetch vault stats:", e);
    }
  }, []);

  const fetchPosition = useCallback(async () => {
    if (!address) return;
    try {
      const value = (await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getUserValue",
        args: [address as Address],
      })) as bigint;

      const shares = (await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "userShares",
        args: [address as Address],
      })) as bigint;

      const pps = (await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getPricePerShare",
      })) as bigint;

      setPosition({
        value: formatUnits(value, 6),
        shares: formatUnits(shares, 6),
        pricePerShare: formatUnits(pps, 6),
      });
    } catch (e) {
      console.error("Failed to fetch user position:", e);
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
    if (address) fetchPosition();
    const interval = setInterval(() => {
      fetchStats();
      if (address) fetchPosition();
    }, 15000);
    return () => clearInterval(interval);
  }, [address, fetchStats, fetchPosition]);

  const getUSDCBalance = async () => {
    if (!address) return "0";
    const bal = await publicClient.readContract({
      address: MOCK_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as Address]
    });
    return formatUnits(bal as bigint, 6);
  };

  const deposit = async (usdcAmount: string) => {
    if (!address) throw new Error("Wallet not connected");
    
    const walletClient = await getWalletClient();
    const amount = parseUnits(usdcAmount, 6);

    // Step 1: Check allowance
    const allowance = (await publicClient.readContract({
      address: MOCK_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address as Address, VAULT_ADDRESS],
    })) as bigint;

    // Step 2: Approve if needed
    if (allowance < amount) {
      const { request: appReq } = await publicClient.simulateContract({
        account: address as Address,
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amount],
      });
      const approveTx = await walletClient.writeContract(appReq);
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // Step 3: Deposit
    const { request: depReq } = await publicClient.simulateContract({
      account: address as Address,
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [amount],
    });
    const depositTx = await walletClient.writeContract(depReq);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });
    
    await fetchPosition();
    await fetchStats();
    
    return receipt;
  };

  const withdraw = async (shareAmount: string) => {
    if (!address) throw new Error("Wallet not connected");
    
    const walletClient = await getWalletClient();
    const shares = parseUnits(shareAmount, 6);

    const { request } = await publicClient.simulateContract({
      account: address as Address,
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [shares],
    });
    const tx = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    
    await fetchPosition();
    await fetchStats();
    
    return receipt;
  };

  return {
    deposit,
    withdraw,
    getUSDCBalance,
    fetchPosition,
    stats,
    position,
    loading,
    refresh: () => {
      fetchStats();
      fetchPosition();
    },
  };
}
