"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAllPools, PoolData } from "@/lib/initia-api";

export function usePoolData() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchAllPools();
      setPools(data);
      setLastUpdated(new Date());
      setError(false);
    } catch (e) {
      console.error("Hook Error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const weightedPool = pools.find(p => p.pair === "USDC-INIT") || pools[0];
  const lendingPool = pools.find(p => p.pair === "INIT Supply") || pools[1];

  return {
    pools,
    weightedPool,
    lendingPool,
    loading,
    lastUpdated,
    error,
    refreshData
  };
}
