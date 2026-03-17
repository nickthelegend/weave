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
        totalShares: formatUnits(data[1], 6), // Not strictly needed for UI but good to have
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
    }, 30000);
    return () => clearInterval(interval);
  }, [address, fetchStats, fetchPosition]);

  const deposit = async (usdcAmount: string) => {
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    const toastId = showTxToast.pending("Initiating Deposit...");

    try {
      const walletClient = await getWalletClient();
      const amount = parseUnits(usdcAmount, 6);

      // Step 1: Check allowance
      const allowance = (await publicClient.readContract({
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address as Address, VAULT_ADDRESS],
      })) as bigint;

      if (allowance < amount) {
        toast.loading("Approving USDC...", { id: toastId });
        const { request: appReq } = await publicClient.simulateContract({
          account: address as Address,
          address: MOCK_USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, amount],
        });
        const appHash = await walletClient.writeContract(appReq);
        await publicClient.waitForTransactionReceipt({ hash: appHash });
      }

      // Step 2: Deposit
      toast.loading("Confirming deposit...", { id: toastId });
      const { request: depReq } = await publicClient.simulateContract({
        account: address as Address,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amount],
      });
      const depHash = await walletClient.writeContract(depReq);
      await publicClient.waitForTransactionReceipt({ hash: depHash });

      toast.dismiss(toastId);
      showTxToast.success(depHash, "Deposit confirmed!");
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
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    const toastId = showTxToast.pending("Initiating Withdrawal...");

    try {
      const walletClient = await getWalletClient();
      const shares = parseUnits(shareAmount, 6);

      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [shares],
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    deposit,
    withdraw,
    stats,
    position,
    loading,
    refresh: () => {
      fetchStats();
      fetchPosition();
    },
  };
}
