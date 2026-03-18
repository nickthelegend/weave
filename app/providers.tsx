"use client";

import { PropsWithChildren, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectorsForWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { initiaPrivyWallet, injectStyles, InterwovenKitProvider, TESTNET, PRIVY_APP_ID } from "@initia/interwovenkit-react";
// @ts-ignore
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "next-themes";
import { defineChain } from "viem";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [initiaPrivyWallet],
    },
  ],
  {
    appName: "Weave",
    projectId: "YOUR_PROJECT_ID",
  }
);

// Define local EVM chain for Wagmi (Now pointing to VPS weave-3)
const minievm = defineChain({
  id: 1072375175819285, // eth_chainId of weave-3 on VPS
  name: 'Minievm',
  nativeCurrency: { name: 'GAS', symbol: 'GAS', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://140.245.243.150:8545'] },
    public: { http: ['http://140.245.243.150:8545'] },
  },
});

const wagmiConfig = createConfig({
  connectors,
  chains: [minievm as any, mainnet],
  transports: {
    [minievm.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// Skill-mandated local chain metadata
const weaveLocal: any = {
  chain_id: "weave-3",
  chain_name: "weave",
  bech32_prefix: "init",
  pretty_name: "Weave VPS (weave-3)",
  network_type: "testnet", // MANDATORY
  status: "live",
  apis: {
    rpc: [{ address: "http://140.245.243.150:26657" }],
    rest: [{ address: "http://140.245.243.150:1317" }],
    indexer: [{ address: "http://140.245.243.150:1317" }], // Use REST as placeholder to avoid URL not found
    "json-rpc": [{ address: "http://140.245.243.150:8545" }]
  },
  fees: {
    fee_tokens: [{
      denom: "GAS",
      fixed_min_gas_price: 0,
      low_gas_price: 0,
      average_gas_price: 0,
      high_gas_price: 0
    }]
  },
  staking: { staking_tokens: [{ denom: "GAS" }] },
  native_assets: [{
    denom: "GAS",
    name: "GAS",
    symbol: "GAS",
    decimals: 18 // Standard EVM precision
  }],
  metadata: {
    is_l1: false,
    minitia: {
      type: "minievm"
    }
  }
};

export function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    // Inject styles into the shadow DOM used by Initia Wallet
    if (interwovenKitStyles) {
      injectStyles(interwovenKitStyles);
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider theme={darkTheme()}>
            <PrivyProvider
              appId={PRIVY_APP_ID}
              config={{
                loginMethodsAndOrder: {
                  primary: [`privy:${PRIVY_APP_ID}`, 'detected_ethereum_wallets'],
                },
              }}
            >
              <InterwovenKitProvider
                customChain={weaveLocal}
                // @ts-ignore
                customChains={[weaveLocal]}
                defaultChainId="weave-3"
                theme="dark"
              >
                {children}
              </InterwovenKitProvider>
            </PrivyProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
