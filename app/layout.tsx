import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/jetbrains-mono";
import "@fontsource-variable/dm-sans";
import Link from "next/link";
import { Zap, LayoutDashboard, Layers, Wallet } from "lucide-react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Weave | Your Initia yield. Automated.",
  description: "DeFi yield aggregator on Initia blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans grid-texture min-h-screen flex flex-col relative">
        <Providers>
          <div className="scanline" />
          
          <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-border-accent">
            <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-[0_0_15px_rgba(173,70,255,0.5)]">
                  <Zap size={18} className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 text-white fill-current" />
                </div>
                <span className="text-xl font-bold tracking-tighter uppercase italic">Weave</span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <Link href="/app" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
                  <LayoutDashboard size={14} /> Terminal
                </Link>
                <Link href="/strategies" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
                  <Layers size={14} /> Strategies
                </Link>
              </div>

              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(173,70,255,0.2)]">
                <Wallet size={14} /> Connect Wallet
              </button>
            </nav>
          </header>

          <main className="flex-grow pt-16">
            {children}
          </main>

          <footer className="border-t border-border-accent bg-black p-8 text-center">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
              &copy; 2026 Weave Protocol // Initia Yield layer
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
