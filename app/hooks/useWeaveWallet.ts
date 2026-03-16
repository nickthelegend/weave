"use client";

import { useChain } from "@cosmos-kit/react";
import { useState, useEffect, useCallback } from "react";
import BigNumber from "bignumber.js";

export function useWeaveWallet(chainName: string = "initiatestnet") {
  const {
    address,
    status,
    connect,
    disconnect,
    openView,
  } = useChain(chainName);

  const [balances, setBalances] = useState({ usdc: "0.00", init: "0.00" });
  const [isFetching, setIsFetching] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    setIsFetching(true);
    try {
      const restEndpoint = chainName === "initia" ? "https://lcd.initia.xyz" : "https://lcd-testnet.initia.xyz";
      const response = await fetch(`${restEndpoint}/cosmos/bank/v1beta1/balances/${address}`);
      const data = await response.json();
      
      const balanceList = data.balances || [];
      const initBal = balanceList.find((b: any) => b.denom === "uinit");
      const usdcBal = balanceList.find((b: any) => b.denom === "uusdc" || b.denom.includes("usdc"));

      setBalances({
        init: initBal ? new BigNumber(initBal.amount).dividedBy(10**6).toFixed(2) : "0.00",
        usdc: usdcBal ? new BigNumber(usdcBal.amount).dividedBy(10**6).toFixed(2) : "0.00",
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsFetching(false);
    }
  }, [address, chainName]);

  useEffect(() => {
    if (address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [address, fetchBalances]);

  return {
    address,
    isConnected: status === "Connected",
    isConnecting: status === "Connecting",
    balances,
    connect,
    disconnect,
    openView,
    fetchBalances,
    isFetching,
  };
}
