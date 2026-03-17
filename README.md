# 🧬 Weave Protocol

**Your Initia Yield. Automated.**

Weave is an institutional-grade DeFi yield aggregator built on the Initia blockchain. It leverages a high-performance terminal interface to provide users with one-click access to optimized yield strategies across the Initia ecosystem, including DEX LPs, lending protocols like Echelon, and VIP emission pools.

---

## 🏗️ Protocol Architecture

Weave is built with a high-fidelity hybrid stack designed for speed, institutional transparency, and extreme UX simplicity.

### 1. The Yield Engine (Initia EVM)
The core protocol logic resides in highly optimized Solidity smart contracts:
- **`WeaveVault.sol`**: Manages user capital using a share-based accounting system (Price-per-share). It features a 10% protocol fee for future WEAVE stakers and a secure Keeper-based harvest mechanism.
- **`WeaveZapIn.sol`**: Our signature UX multiplier. Allows users to enter complex yield positions using a single token (mUSDC), handling all underlying conversions.
- **`MockERC20.sol`**: Standardized testing assets (mUSDC & mINIT) to facilitate frictionless testnet onboarding.

### 2. The Data Layer (Convex + Initia LCD)
We use a hybrid data strategy to ensure the terminal is always "Live":
- **Real-time State**: Direct blockchain reads via `viem` for wallet balances and user positions.
- **Reactive Backend**: Powered by **Convex**, tracking historical APY performance, global TVL snapshots, and protocol harvest events.
- **Protocol Automation**: Convex crons sync Initia on-chain metrics every 60 seconds to maintain a zero-latency UI.

### 3. The Institutional Terminal (Next.js 15)
A "Bloomberg-for-DeFi" aesthetic designed for the modern crypto-native:
- **Ivory Vault Aesthetic**: Pure black (#000000) with signature #ad46ff purple glows.
- **Tabular Precision**: DM Sans for UI clarity and JetBrains Mono for financial data.
- **Live Activity Feed**: A terminal-style log of every protocol harvest and user deposit.

---

## 🚀 Live on Initia Testnet

### 📜 Program IDs
- **WeaveVault**: `0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0`
- **WeaveZapIn**: `0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9`
- **MockUSDC (mUSDC)**: `0x5fbdb2315678afecb367f032d93f642f64180aa3`
- **MockINIT (mINIT)**: `0xe7f1725e7734ce288f8367e1bb143e90bb3f0512`

### 💧 Testnet Faucet
Access the built-in faucet at `/faucet` to mint 10,000 mUSDC and begin testing.

---

## 🛠️ Developer Setup

1. **Install Dependencies**: `npm install`
2. **Convex Backend**: `npx convex dev`
3. **Local Dev**: `npm run dev`

### Contract Deployment (Hardhat)
```bash
cd contracts
# Get your deployer address
npx hardhat run scripts/getAddress.ts --network initiaTestnet
# Deploy to network
npx hardhat run scripts/deploy.ts --network initiaTestnet
```

---

## 📅 Roadmap v2
- **Q3 2025**: WEAVE Token Genesis (Governance & Staking).
- **Q4 2025**: Concentrated Liquidity routing for 300%+ target APYs.
- **Q1 2026**: Cross-Minitia yield aggregation.

## V3 — Cross-Minitia Expansion (Q4 2026)

Weave V3 introduces cross-Minitia vaults, routing capital to DeFi protocols across the entire Initia ecosystem:
- **Blackwing**: Margin trading yield
- **Tucana**: Perpetual funding rates
- **More**: Any Minitia with sustainable yield

Capital allocation is decided by **veWEAVE governance gauge voting**. The community decides where TVL flows, turning Weave into the central yield-steering engine for the Initia network.

---
*Built for the Initia Odyssey Hackathon 2026.*
