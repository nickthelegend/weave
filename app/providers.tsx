"use client";

import { PropsWithChildren, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectorsForWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { initiaPrivyWallet, injectStyles, InterwovenKitProvider } from "@initia/interwovenkit-react";
// @ts-ignore
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
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
const initiaTestnet = {
  id: 1515,
  name: "Initia Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://json-rpc.testnet.initia.xyz"] },
  },
  blockExplorers: {
    default: { name: "InitiaScan", url: "https://scan.testnet.initia.xyz" },
  },
};

const wagmiConfig = createConfig({
  connectors,
  chains: [initiaTestnet as any, mainnet],
  transports: {
    [initiaTestnet.id]: http(),
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
            <InterwovenKitProvider defaultChainId="initiation-2">
              {children}
            </InterwovenKitProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
