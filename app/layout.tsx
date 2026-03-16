"use client";

import RootLayoutWrapper from "./layout-wrapper";
import { Header } from "./components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans grid-texture min-h-screen flex flex-col relative">
        <RootLayoutWrapper>
          <div className="scanline" />
          <Header />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <footer className="border-t border-border-accent bg-black p-8 text-center">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
              &copy; 2026 Weave Protocol // Initia Yield layer
            </p>
          </footer>
        </RootLayoutWrapper>
      </body>
    </html>
  );
}
