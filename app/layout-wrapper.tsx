"use client";

import { Providers } from "./providers";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
