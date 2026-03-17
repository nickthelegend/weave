"use client";

import { useChain } from "@cosmos-kit/react";
import { useMemo } from "react";
import { createWalletClient, custom, Address } from "viem";
import { initiaTestnet } from "@/lib/contractConfig";

export function useWeaveWallet(chainName: string = "initiatestnet") {
  const {
    address,
    status,
    connect,
    disconnect,
    openView,
  } = useChain(chainName);

  // Added getWalletClient helper for viem
  const getWalletClient = async () => {
    if (!window.ethereum) throw new Error("No ethereum provider found");
    return createWalletClient({
      account: address as Address,
      chain: initiaTestnet as any,
      transport: custom((window as any).ethereum),
    });
  };

  const balances = { usdc: "0.00", init: "0.00" }; // Placeholder, kept for interface compatibility

  return {
    address,
    isConnected: status === "Connected",
    isConnecting: status === "Connecting",
    balances,
    connect,
    disconnect,
    openView,
    getWalletClient,
  };
}
