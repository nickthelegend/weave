"use client";

import { ChainProvider } from "@cosmos-kit/react";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { assetLists as registryAssetLists, chains as registryChains } from "chain-registry";

// Ensure we have arrays to avoid runtime errors during SSR/Hydration
const chains = Array.isArray(registryChains) ? registryChains : [];
const assetLists = Array.isArray(registryAssetLists) ? registryAssetLists : [];

// Mock Initia chain if not in registry
const initiaChain = {
  chain_name: "initia",
  chainName: "initia",
  status: "live",
  network_type: "mainnet",
  pretty_name: "Initia",
  chain_id: "initiation-1",
  bech32_prefix: "init",
  daemon_name: "initiad",
  node_home: "$HOME/.initia",
  key_algos: ["secp256k1"],
  slip44: 118,
  chain_type: "cosmos",
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15, low_gas_price: 0.15, average_gas_price: 0.15, high_gas_price: 0.15 }]
  },
  staking: {
    staking_tokens: [{ denom: "uinit" }]
  },
  apis: {
    rpc: [{ address: "https://rpc.initia.xyz" }],
    rest: [{ address: "https://lcd.initia.xyz" }]
  },
  keywords: ["initia", "cosmos"]
};

const initiaTestnetChain = {
  chain_name: "initiatestnet",
  chainName: "initiatestnet",
  status: "live",
  network_type: "testnet",
  pretty_name: "Initia Testnet",
  chain_id: "initiation-2",
  bech32_prefix: "init",
  daemon_name: "initiad",
  node_home: "$HOME/.initia",
  key_algos: ["secp256k1"],
  slip44: 118,
  chain_type: "cosmos",
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15, low_gas_price: 0.15, average_gas_price: 0.15, high_gas_price: 0.15 }]
  },
  staking: {
    staking_tokens: [{ denom: "uinit" }]
  },
  apis: {
    rpc: [{ address: "https://rpc-testnet.initia.xyz" }],
    rest: [{ address: "https://lcd-testnet.initia.xyz" }]
  },
  logo_URIs: {
    png: "https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/initiatestnet/images/initia.png"
  },
  keywords: ["initia", "testnet", "cosmos"]
};

// Filter out actual chains or add our mocks
const allChains = [
  ...chains.filter(c => (c as any).chain_name !== 'initia' && (c as any).chainName !== 'initia'),
  initiaChain as any,
  initiaTestnetChain as any
];

const allWallets = [
  ...(Array.isArray(keplrWallets) ? keplrWallets : []),
  ...(Array.isArray(leapWallets) ? leapWallets : []),
  ...(Array.isArray(cosmostationWallets) ? cosmostationWallets : [])
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  if (!allChains.length || !allWallets.length) {
    return <>{children}</>;
  }

  return (
    <ChainProvider
      chains={allChains}
      assetLists={assetLists as any}
      wallets={allWallets}
      throwErrors={false}
    >
      {children}
    </ChainProvider>
  );
}
