import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/jetbrains-mono";
import "@fontsource-variable/dm-sans";
import RootLayoutWrapper from "./layout-wrapper";
import { Header } from "./components/Header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weave | Your Initia yield. Automated.",
  description: "DeFi yield aggregator on Initia blockchain.",
};

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
          <main className="flex-grow pt-24 pb-12">
            {children}
          </main>
          <footer className="border-t border-border-accent bg-black p-10 text-center">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
                    &copy; 2026 Weave Protocol // Initia Yield layer
                </p>
                <div className="flex gap-8">
                    <Link href="/governance" className="text-[9px] font-black uppercase text-white/40 hover:text-primary transition-colors tracking-widest">Governance</Link>
                    <Link href="/strategies" className="text-[9px] font-black uppercase text-white/40 hover:text-primary transition-colors tracking-widest">Strategies</Link>
                    <Link href="/faucet" className="text-[9px] font-black uppercase text-white/40 hover:text-primary transition-colors tracking-widest">Faucet</Link>
                </div>
            </div>
          </footer>
        </RootLayoutWrapper>
      </body>
    </html>
  );
}
