"use client";

import Link from "next/link";
import { Zap, LayoutDashboard, Layers, Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const { address, isConnected, connect, disconnect, openView } = useWeaveWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsDropdownOpen(false);
    }
  };

  return (
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

        <div className="relative" ref={dropdownRef}>
          {isConnected ? (
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-black border border-primary/30 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-3 transition-all hover:glow-active shadow-[0_0_20px_rgba(173,70,255,0.2)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {truncatedAddress}
              <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button 
              onClick={() => connect()}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(173,70,255,0.2)]"
            >
              <Wallet size={14} /> Connect Wallet
            </button>
          )}

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-56 terminal-card bg-black p-2 z-[100] shadow-2xl"
              >
                <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-primary hover:bg-primary/5 rounded transition-all flex items-center gap-3">
                    <Copy size={14} /> Copy Address
                </button>
                <a 
                  href={`https://initia.scan.id/address/${address}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-primary hover:bg-primary/5 rounded transition-all flex items-center gap-3"
                >
                    <ExternalLink size={14} /> View on InitiaScan
                </a>
                <div className="h-[1px] bg-white/5 my-1" />
                <button onClick={() => { disconnect(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/5 rounded transition-all flex items-center gap-3">
                    <LogOut size={14} /> Disconnect
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
}
