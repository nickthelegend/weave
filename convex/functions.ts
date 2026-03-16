import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// --- Queries ---

export const getLatestPools = query({
  handler: async (ctx) => {
    // Get unique pairs and their latest snapshot
    const pairs = ["USDC-INIT", "INIT Supply"];
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
        activeStrategies: 2,
        protocolFeeRate: 0.1,
      });
    }
  },
});

// --- Actions (for external API syncing) ---

export const syncPoolData = action({
  handler: async (ctx) => {
    // In a real scenario, this fetches from Initia LCD
    // For the demo, we simulate the fetch and update the DB
    const mockData = [
      {
        pair: "USDC-INIT",
        type: "weighted",
        tvl: 14200000 + Math.random() * 100000,
        feeAPR: 12.4 + Math.random(),
        emissionAPR: 157.0 + Math.random(),
        volume24h: 1200000 + Math.random() * 50000,
      },
      {
        pair: "INIT Supply",
        type: "stable",
        tvl: 28500000 + Math.random() * 100000,
        feeAPR: 8.1 + Math.random(),
        emissionAPR: 6.1 + Math.random(),
        volume24h: 0,
      }
    ];

    for (const pool of mockData) {
      await ctx.runMutation(api.functions.savePoolSnapshot, {
        ...pool,
        totalAPR: pool.feeAPR + pool.emissionAPR,
      });
    }

    const totalTVL = mockData.reduce((acc, p) => acc + p.tvl, 0);
    await ctx.runMutation(api.functions.updateGlobalStats, {
      totalTVL,
      totalUsers: 1242,
      totalYieldPaid: 842100,
    });
  },
});
