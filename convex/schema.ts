import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  poolSnapshots: defineTable({
    pair: v.string(),
    type: v.string(), // "weighted" | "concentrated" | "stable"
    tvl: v.number(),
    feeAPR: v.number(),
    emissionAPR: v.number(),
    totalAPR: v.number(),
    volume24h: v.number(),
    timestamp: v.number(),
  }).index("by_pair", ["pair"]),

  userPositions: defineTable({
    walletAddress: v.string(),
    poolId: v.string(),
    token: v.string(), // "USDC" | "INIT"
    principalAmount: v.number(),
    currentValue: v.number(),
    yieldEarned: v.number(),
    vestedRewards: v.number(),
    lastDepositAt: v.number(),
    lastUpdateAt: v.number(),
    metadata: v.any(),
  }).index("by_wallet", ["walletAddress"]),

  harvestEvents: defineTable({
    strategyName: v.string(),
    amountReinvested: v.number(),
    apyAtHarvest: v.number(),
    timestamp: v.number(),
    txSignatures: v.array(v.string()),
  }),

  globalStats: defineTable({
    totalTVL: v.number(),
    totalUsers: v.number(),
    totalYieldPaid: v.number(),
    lastHarvestAt: v.number(),
    activeStrategies: v.number(),
    protocolFeeRate: v.number(),
  }),

  apyHistory: defineTable({
    date: v.string(), // YYYY-MM-DD
    avgAPR: v.number(),
    minAPR: v.number(),
    maxAPR: v.number(),
    totalTVL: v.number(),
  }).index("by_date", ["date"]),

  faucetClaims: defineTable({
    wallet: v.string(),
    token: v.string(), // "mUSDC" | "mINIT"
    lastClaimAt: v.number(),
    totalClaimed: v.number(),
  }).index("by_wallet_token", ["wallet", "token"]),
});
