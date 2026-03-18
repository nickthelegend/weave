import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// --- Queries ---

export const getLatestPools = query({
  handler: async (ctx) => {
    // Real Weavify Strategies on Initia
    const pairs = [
      "USDC-INIT LP + Stake",
      "iUSD-USDC LP",
      "USDC Lending (Echelon)",
      "INIT Lending (Echelon)"
    ];
    const pools = [];
    for (const pair of pairs) {
      const latest = await ctx.db
        .query("poolSnapshots")
        .withIndex("by_pair", (q) => q.eq("pair", pair))
        .order("desc")
        .first();
      if (latest) pools.push(latest);
    }
    return pools;
  },
});

export const getUserPosition = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPositions")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
  },
});

export const getHarvestHistory = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("harvestEvents").order("desc").take(args.limit);
  },
});

export const getGlobalStats = query({
  handler: async (ctx) => {
    return await ctx.db.query("globalStats").order("desc").first();
  },
});

export const getAPYHistory = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("apyHistory").order("desc").take(args.days);
  },
});

// --- Mutations ---

export const savePoolSnapshot = mutation({
  args: {
    pair: v.string(),
    type: v.string(),
    tvl: v.number(),
    feeAPR: v.number(),
    emissionAPR: v.number(),
    totalAPR: v.number(),
    volume24h: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("poolSnapshots", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const upsertUserPosition = mutation({
  args: {
    walletAddress: v.string(),
    token: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPositions")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        principalAmount: existing.principalAmount + args.amount,
        currentValue: existing.currentValue + args.amount,
        lastUpdateAt: now,
      });
    } else {
      await ctx.db.insert("userPositions", {
        walletAddress: args.walletAddress,
        poolId: "initia-dex-usdc-init",
        token: args.token,
        principalAmount: args.amount,
        currentValue: args.amount,
        yieldEarned: 0,
        vestedRewards: 0,
        lastDepositAt: now,
        lastUpdateAt: now,
        metadata: {},
      });
    }
  },
});

export const updateGlobalStats = mutation({
  args: {
    totalTVL: v.number(),
    totalUsers: v.number(),
    totalYieldPaid: v.number(),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db.query("globalStats").first();
    if (stats) {
      await ctx.db.patch(stats._id, args);
    } else {
      await ctx.db.insert("globalStats", {
        ...args,
        lastHarvestAt: Date.now(),
        activeStrategies: 4,
        protocolFeeRate: 0.1,
      });
    }
  },
});

// --- Actions (for external API syncing) ---

export const syncPoolData = action({
  handler: async (ctx) => {
    /** 
     * In a real production scenario, we'd fetch live data here:
     * - Echelon markets (USDC/INIT): Query contract methods
     * - Initia DEX (USDC-INIT, iUSD-USDC): Query LP reserves and emission rates
     */
    
    const vaultData = [
      {
        pair: "USDC-INIT LP + Stake",
        type: "weighted",
        tvl: 45200000 + Math.random() * 500000,
        feeAPR: 24.1 + Math.random(),
        emissionAPR: 138.2 + Math.random(),
        volume24h: 3400000,
      },
      {
        pair: "iUSD-USDC LP",
        type: "stable",
        tvl: 22800000 + Math.random() * 200000,
        feeAPR: 14.5 + Math.random(),
        emissionAPR: 0,
        volume24h: 850000,
      },
      {
        pair: "USDC Lending (Echelon)",
        type: "lending",
        tvl: 18400000 + Math.random() * 100000,
        feeAPR: 8.4 + Math.random(),
        emissionAPR: 0,
        volume24h: 0,
      },
      {
        pair: "INIT Lending (Echelon)",
        type: "lending",
        tvl: 12100000 + Math.random() * 100000,
        feeAPR: 12.8 + Math.random(),
        emissionAPR: 0,
        volume24h: 0,
      }
    ];

    for (const pool of vaultData) {
      await ctx.runMutation(api.functions.savePoolSnapshot, {
        ...pool,
        totalAPR: pool.feeAPR + pool.emissionAPR,
      });
    }

    const totalTVL = vaultData.reduce((acc, p) => acc + p.tvl, 0);
    await ctx.runMutation(api.functions.updateGlobalStats, {
      totalTVL,
      totalUsers: 1564,
      totalYieldPaid: 1245800,
    });
  },
});

