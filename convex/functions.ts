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

export const syncHarvestLog = mutation({
  args: {
    strategyName: v.string(),
    amountReinvested: v.number(),
    apyAtHarvest: v.number(),
    timestamp: v.number(),
    txSignatures: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("harvestEvents", args);
    
    // Update global stats last harvest time
    const stats = await ctx.db.query("globalStats").first();
    if (stats) {
      await ctx.db.patch(stats._id, { lastHarvestAt: args.timestamp });
    }
  },
});

export const getVIPHistory = query({
  handler: async (ctx) => {
    return await ctx.db.query("vipStages").order("desc").collect();
  },
});

export const getPrices = query({
  handler: async (ctx) => {
    return await ctx.db.query("poolSnapshots").order("desc").take(10);
  },
});

// --- Mutations ---

export const saveVIPStage = mutation({
  args: {
    stage: v.number(),
    timestamp: v.number(),
    depositors: v.number(),
    totalScore: v.string(),
    esINITExpected: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vipStages")
      .filter((q) => q.eq(q.field("stage"), args.stage))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("vipStages", args);
    }
  },
});

// --- Actions (for external API syncing) ---

export const syncHarvestLogs = action({
  handler: async (ctx) => {
    const fs = require('fs');
    const path = require('path');
    const logPath = '/Users/jaibajrang/Desktop/Projects/initia/weave-keeper-bot/logs/harvest.json';
    if (!fs.existsSync(logPath)) return "No logs found";

    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = JSON.parse(content);
    
    for (const log of logs) {
      await ctx.runMutation(api.functions.syncHarvestLog, {
        strategyName: "Global Harvest",
        amountReinvested: parseFloat(log.totalReinvested),
        apyAtHarvest: parseFloat(log.sharePriceAfter) * 100,
        timestamp: new Date(log.timestamp).getTime(),
        txSignatures: ["0x_daily_harvest"],
      });
    }
  },
});

export const syncVIPStages = action({
  handler: async (ctx) => {
    const fs = require('fs');
    const path = require('path');
    const logPath = '/Users/jaibajrang/Desktop/Projects/initia/weave-keeper-bot/logs/vip.json';
    if (!fs.existsSync(logPath)) return "No logs found";

    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = JSON.parse(content);
    
    for (const log of logs) {
      await ctx.runMutation(api.functions.saveVIPStage, log);
    }
  },
});

export const getSharePriceAction = action({
  handler: async (ctx) => {
    // This could call the contract directly if we had an EVM provider in Convex
    // For now, we simulate or assume it's updated via the keeper bot.
  },
});

