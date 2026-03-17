"use client";

import { useState, useCallback, useEffect } from "react";
import { parseUnits, formatUnits, Address } from "viem";
import { useWeaveWallet } from "./useWeaveWallet";
import { publicClient, VAULT_ADDRESS, MOCK_USDC_ADDRESS, MOCK_INIT_ADDRESS } from "@/lib/contractConfig";
import { VAULT_ABI, ERC20_ABI } from "@/lib/abis";
import { showTxToast } from "@/app/components/TxToast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useVault() {
  const { address, getWalletClient, isConnected } = useWeaveWallet();
  const recordClaim = useMutation(api.faucet.recordFaucetClaim);
  
  const [stats, setStats] = useState({
    totalDeposited: "0",
    totalYieldGenerated: "0",
    totalProtocolFeesAccrued: "0",
    pricePerShare: "1.00",
  });
  
  const [position, setPosition] = useState({
    valueUSD: "0.00",
    shares: "0.00",
    pricePerShare: "1.0000",
    totalDeposited: "0.00",
    totalYieldGenerated: "0.00",
    totalProtocolFees: "0.00"
  });

  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = (await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getVaultStats",
      })) as any;

      setStats({
        totalDeposited: formatUnits(data[0], 6),
        totalYieldGenerated: formatUnits(data[2], 6),
        totalProtocolFeesAccrued: formatUnits(data[3], 6),
        pricePerShare: formatUnits(data[4], 6),
      } as any);
    } catch (e) {
      console.error("Failed to fetch vault stats:", e);
    }
  }, []);

  const fetchPosition = useCallback(async () => {
    if (!address) {
      setPosition({
        valueUSD: "0.00",
        shares: "0.00",
        pricePerShare: "1.0000",
        totalDeposited: "0.00",
        totalYieldGenerated: "0.00",
        totalProtocolFees: "0.00"
      });
      return;
    }
    
    setLoading(true);
    try {
      const [value, shares, vaultStats] = (await Promise.all([
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "getUserValue",
          args: [address as Address],
        }),
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "userShares",
          args: [address as Address],
        }),
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "getVaultStats",
        })
      ])) as any;

      setPosition({
        valueUSD: Number(formatUnits(value, 6)).toFixed(2),
        shares: Number(formatUnits(shares, 6)).toFixed(2),
        pricePerShare: Number(formatUnits(vaultStats[4], 6)).toFixed(4),
        totalDeposited: Number(formatUnits(vaultStats[0], 6)).toFixed(2),
        totalYieldGenerated: Number(formatUnits(vaultStats[2], 6)).toFixed(2),
        totalProtocolFees: Number(formatUnits(vaultStats[3], 6)).toFixed(2)
      });
    } catch (e) {
      console.error("Failed to fetch user position:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
    if (isConnected) fetchPosition();
    
    const interval = setInterval(() => {
      fetchStats();
      if (isConnected) fetchPosition();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [address, isConnected, fetchStats, fetchPosition]);

  const getUSDCBalance = async () => {
    if (!address) return "0.00";
    const bal = await publicClient.readContract({
      address: MOCK_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as Address]
    });
    return Number(formatUnits(bal as bigint, 6)).toFixed(2);
  };

  const mintMockToken = async (type: 'mUSDC' | 'mINIT') => {
    if (!address) return;
    showTxToast.pending();
    try {
      const walletClient = await getWalletClient();
      const tokenAddr = type === 'mUSDC' ? MOCK_USDC_ADDRESS : MOCK_INIT_ADDRESS;
      const amount = type === 'mUSDC' ? parseUnits("10000", 6) : parseUnits("1000", 6);
      
      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address as Address, amount]
      });
      
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      
      await recordClaim({
        walletAddress: address,
        token: type,
        amount: type === 'mUSDC' ? 10000 : 1000
      });

      showTxToast.success(hash);
    } catch (e) {
      showTxToast.error(e);
    }
  };

  const deposit = async (usdcAmount: string) => {
    if (!address) throw new Error("Wallet not connected");
    const walletClient = await getWalletClient();
    const amount = parseUnits(usdcAmount, 6);

    try {
      const allowance = (await publicClient.readContract({
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address as Address, VAULT_ADDRESS],
      })) as bigint;

      if (allowance < amount) {
        showTxToast.approve();
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

      showTxToast.pending();
      const { request: depReq } = await publicClient.simulateContract({
        account: address as Address,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amount],
      });
      const depositTx = await walletClient.writeContract(depReq);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });
      
      showTxToast.success(receipt.transactionHash);
      fetchPosition();
      fetchStats();
      return receipt;
    } catch (error) {
      showTxToast.error(error);
      throw error;
    }
  };

  const withdraw = async (shareAmount: string) => {
    if (!address) throw new Error("Wallet not connected");
    const walletClient = await getWalletClient();
    const shares = parseUnits(shareAmount, 6);

    try {
      showTxToast.pending();
      const { request } = await publicClient.simulateContract({
        account: address as Address,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [shares],
      });
      const tx = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      showTxToast.success(receipt.transactionHash);
      fetchPosition();
      fetchStats();
      return receipt;
    } catch (error) {
      showTxToast.error(error);
      throw error;
    }
  };

  return {
    deposit,
    withdraw,
    getUSDCBalance,
    mintMockToken,
    stats,
    position,
    loading,
    refresh: () => {
      fetchStats();
      fetchPosition();
    },
  };
}
