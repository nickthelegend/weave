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

// Define Initia Testnet L1 EVM
const minievm = {
  id: 4303131403034904,
  name: 'Minievm',
  nativeCurrency: { name: 'GAS', symbol: 'GAS', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz'],
    },
  },
};

const wagmiConfig = createConfig({
  connectors,
  chains: [minievm as any, mainnet],
  transports: {
    [minievm.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

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
              <InterwovenKitProvider {...TESTNET} defaultChainId="minievm-2">
                {children}
              </InterwovenKitProvider>
            </PrivyProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
