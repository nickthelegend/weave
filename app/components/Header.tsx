"use client";

import Link from "next/link";
import { Zap, LayoutDashboard, Layers, Droplets, Gavel, TrendingUp } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  // Weave always targets testnet for this hackathon
  const isTestnet = true;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-border-accent">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-[0_0_15px_rgba(173,70,255,0.5)]">
            <Zap size={18} className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic text-glow">Weave</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/app" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
            <LayoutDashboard size={14} /> App
          </Link>
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
            <Zap size={14} /> Activity
          </Link>
          <Link href="/vip" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
            <TrendingUp size={14} /> VIP
          </Link>
          <Link href="/strategies" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
            <Layers size={14} /> Strategies
          </Link>
          {isTestnet && (
            <Link href="/faucet" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary transition-colors flex items-center gap-2">
              <Droplets size={14} className="text-primary" /> Faucet
            </Link>
          )}
        </div>

        <div className="flex items-center">
          <ConnectButton
            accountStatus="address"
            showBalance={false}
            chainStatus="icon"
          />
        </div>
      </nav>
    </header>
  );
}
