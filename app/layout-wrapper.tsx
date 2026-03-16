"use client";

import { useTheme } from "next-themes";
import { Providers } from "./providers";
import { WalletProvider } from "./providers/WalletProvider";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <WalletProvider>
        {children}
      </WalletProvider>
    </Providers>
  );
}
