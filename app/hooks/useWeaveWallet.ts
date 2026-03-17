"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { createWalletClient, custom, Address } from "viem";
import { initiaTestnet } from "@/lib/contractConfig";

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

  // Helper for EVM interactions using viem
  const getWalletClient = async () => {
    const ethereum = (window as any).ethereum;
    if (typeof window === 'undefined' || !ethereum) {
      throw new Error("No ethereum provider found");
    }
    return createWalletClient({
      account: hexAddress as Address,
      chain: initiaTestnet as any,
      transport: custom(ethereum),
    });
  };

  const balances = { usdc: "0.00", init: "0.00" };

  return {
    address: hexAddress || address, // Default to hex for EVM-heavy app
    initiaAddress,
    isConnected,
    isConnecting: false,
    isFetching: false,
    balances,
    connect: openConnect,
    disconnect,
    openView: openWallet,
    getWalletClient,
    requestTxBlock,
  };
}
