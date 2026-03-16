import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const recordFaucetClaim = mutation({
  args: {
    walletAddress: v.string(),
    token: v.string(), // "mUSDC" | "mINIT"
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("faucetClaims")
      .withIndex("by_wallet_token", (q) => 
        q.eq("wallet", args.walletAddress).eq("token", args.token)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastClaimAt: now,
        totalClaimed: existing.totalClaimed + args.amount,
      });
    } else {
      await ctx.db.insert("faucetClaims", {
        wallet: args.walletAddress,
        token: args.token,
        lastClaimAt: now,
        totalClaimed: args.amount,
      });
    }
  },
});

export const getFaucetClaim = query({
  args: { walletAddress: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("faucetClaims")
      .withIndex("by_wallet_token", (q) => 
        q.eq("wallet", args.walletAddress).eq("token", args.token)
      )
      .first();
  },
});
