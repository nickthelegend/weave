"use client";

import { ChainProvider } from "@cosmos-kit/react";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { assets, chains } from "chain-registry";

// Mock Initia chain if not in registry
const initiaChain = {
  chain_name: "initia",
  status: "live",
  network_type: "mainnet",
  pretty_name: "Initia",
  chain_id: "initiation-1",
  bech32_prefix: "init",
  daemon_name: "initiad",
  node_home: "$HOME/.initia",
  key_algos: ["secp256k1"],
  slip44: 118,
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15, low_gas_price: 0.15, average_gas_price: 0.15, high_gas_price: 0.15 }]
  },
  staking: {
    staking_tokens: [{ denom: "uinit" }]
  },
  apis: {
    rpc: [{ address: "https://rpc.initia.xyz" }],
    rest: [{ address: "https://lcd.initia.xyz" }]
  }
};

const initiaTestnetChain = {
  chain_name: "initiatestnet",
  status: "live",
  network_type: "testnet",
  pretty_name: "Initia Testnet",
  chain_id: "initiation-2",
  bech32_prefix: "init",
  daemon_name: "initiad",
  node_home: "$HOME/.initia",
  key_algos: ["secp256k1"],
  slip44: 118,
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15, low_gas_price: 0.15, average_gas_price: 0.15, high_gas_price: 0.15 }]
  },
  staking: {
    staking_tokens: [{ denom: "uinit" }]
  },
  apis: {
    rpc: [{ address: "https://rpc-testnet.initia.xyz" }],
    rest: [{ address: "https://lcd-testnet.initia.xyz" }]
  }
};

// Filter out actual chains or add our mocks
const allChains = [...chains.filter(c => c.chain_name !== 'initia'), initiaChain, initiaTestnetChain];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChainProvider
      chains={allChains}
      assetLists={assets}
      wallets={[...keplrWallets, ...leapWallets, ...cosmostationWallets]}
      walletModalOptions={{
        modalClassName: "weave-wallet-modal",
      }}
    >
      {children}
    </ChainProvider>
  );
}
