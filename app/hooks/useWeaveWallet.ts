"use client";

import { useState, useEffect } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { createWalletClient, createPublicClient, http, custom, Address, formatUnits } from "viem";
import { minievm } from "@/lib/contractConfig";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";

export function useWeaveWallet() {
  const {
    address,
    initiaAddress,
    hexAddress,
    isConnected,
    openConnect,
    disconnect,
    openWallet,
    requestTxBlock,
  } = useInterwovenKit();

  const [balances, setBalances] = useState({ usdc: "0.00", init: "0.00", vault: "0.00" });
  const [isFetching, setIsFetching] = useState(false);

  const publicClient = createPublicClient({
    chain: minievm as any,
    transport: http(),
  });

  const fetchBalances = async () => {
    if (!isConnected || !hexAddress) return;
    setIsFetching(true);
    try {
      const [usdcBal, initBal, vaultBal] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.mockUSDC,
          abi: ABIS.mockERC20,
          functionName: "balanceOf",
          args: [hexAddress as Address],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.mockINIT,
          abi: ABIS.mockERC20,
          functionName: "balanceOf",
          args: [hexAddress as Address],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.weaveVault,
          abi: ABIS.weaveVault,
          functionName: "balanceOf",
          args: [hexAddress as Address],
        }),
      ]);

      setBalances({
        usdc: formatUnits(usdcBal as bigint, 6),
        init: formatUnits(initBal as bigint, 18),
        vault: formatUnits(vaultBal as bigint, 6),
      });
    } catch (error) {
      console.error("Balance fetch error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isConnected && hexAddress) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [isConnected, hexAddress]);

  // Helper for EVM interactions using viem
  const getWalletClient = async () => {
    const ethereum = (window as any).ethereum;
    if (typeof window === "undefined" || !ethereum) {
      throw new Error("No ethereum provider found");
    }
    return createWalletClient({
      account: hexAddress as Address,
      chain: minievm as any,
      transport: custom(ethereum),
    });
  };

  return {
    address: hexAddress || address,
    initiaAddress,
    isConnected,
    isConnecting: false,
    isFetching,
    balances,
    connect: openConnect,
    disconnect,
    openView: openWallet,
    getWalletClient,
    requestTxBlock,
    refreshBalances: fetchBalances,
  };
}
