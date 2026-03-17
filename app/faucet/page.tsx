"use client";

import { motion } from "framer-motion";
import { 
  Droplets, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  Wallet,
  Zap,
  ArrowRight,
  TrendingUp,
  CircleDollarSign
} from "lucide-react";
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet";
import { useFaucet } from "@/app/hooks/useFaucet";
import { LiveBadge } from "@/app/components/LiveBadge";

export default function FaucetPage() {
  const { address, isConnected, connect, balances } = useWeaveWallet();
  const { mintMockUSDC, mintMockINIT, loading, usdcStatus, initStatus } = useFaucet(address || undefined);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 font-sans antialiased">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded border border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-[0.3em] text-primary"
        >
          Institutional Liquidity Layer
        </motion.div>
        <h1 className="text-6xl font-black  uppercase tracking-tighter text-white">Weave Faucet</h1>
        <p className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">Acquire test assets for Initia Strategy Deployment</p>
      </div>

      {/* Section 1: Gas */}
      <section className="terminal-card bg-black p-10 border-dashed relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary border border-primary/20">
                        <Zap size={20} />
                    </div>
                    <h3 className="text-2xl font-black  uppercase tracking-tight">Native INIT Gas</h3>
                </div>
                <p className="text-xs text-white/40 uppercase leading-relaxed max-w-sm">
                    Required for executing all smart contract interactions on Initia Testnet.
                </p>
            </div>
            
            <a 
                href="https://faucet.testnet.initia.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-sm font-black uppercase  text-xs tracking-widest flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(173,70,255,0.2)]"
            >
                Get INIT for Gas
                <ExternalLink size={16} />
            </a>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={150} className="text-primary fill-current" />
        </div>
      </section>

      {/* Section 2: Mock Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Mock USDC */}
        <motion.div whileHover={{ y: -5 }} className="terminal-card bg-[#050505] p-10 space-y-8 border-primary/10">
            <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                    <CircleDollarSign size={32} />
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Your Balance</p>
                    <p className="text-xl font-mono font-bold text-white tabular-nums">{balances.usdc} <span className="text-[10px] opacity-30">mUSDC</span></p>
                </div>
            </div>
            
            <div className="space-y-2">
                <h4 className="text-2xl font-black  uppercase tracking-tight">10,000 mUSDC</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mock Stablecoin for Yield Strategies</p>
            </div>

            {isConnected ? (
                <button 
                    onClick={mintMockUSDC}
                    disabled={loading || !usdcStatus.canClaim}
                    className="w-full py-5 border border-primary/40 rounded-sm font-black uppercase  text-[10px] tracking-[0.2em] text-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-all"
                >
                    {loading ? 'Executing...' : usdcStatus.canClaim ? 'Mint 10,000 mUSDC' : usdcStatus.message}
                </button>
            ) : (
                <button onClick={() => connect()} className="w-full py-5 bg-primary text-white rounded-sm font-black uppercase  text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <Wallet size={14} /> Connect to Mint
                </button>
            )}
        </motion.div>

        {/* Mock INIT */}
        <motion.div whileHover={{ y: -5 }} className="terminal-card bg-[#050505] p-10 space-y-8 border-primary/10">
            <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                    <Zap size={32} />
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Your Balance</p>
                    <p className="text-xl font-mono font-bold text-white tabular-nums">{balances.init} <span className="text-[10px] opacity-30">mINIT</span></p>
                </div>
            </div>
            
            <div className="space-y-2">
                <h4 className="text-2xl font-black  uppercase tracking-tight">1,000 mINIT</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mock Asset for LP Formation</p>
            </div>

            {isConnected ? (
                <button 
                    onClick={mintMockINIT}
                    disabled={loading || !initStatus.canClaim}
                    className="w-full py-5 border border-primary/40 rounded-sm font-black uppercase  text-[10px] tracking-[0.2em] text-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-all"
                >
                    {loading ? 'Executing...' : initStatus.canClaim ? 'Mint 1,000 mINIT' : initStatus.message}
                </button>
            ) : (
                <button onClick={() => connect()} className="w-full py-5 bg-primary text-white rounded-sm font-black uppercase  text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <Wallet size={14} /> Connect to Mint
                </button>
            )}
        </motion.div>
      </div>

      {/* Guide Flow */}
      <div className="space-y-8">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] text-center ">Institutional Onboarding Flow</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            {[
                { step: "01", text: "Get INIT for Gas", desc: "Use external faucet" },
                { step: "02", text: "Mint Mock USDC", desc: "Execute here" },
                { step: "03", text: "Deposit to App", desc: "Launch Strategy" },
                { step: "04", text: "Watch Yield", desc: "169.4% Target APY" }
            ].map((step, i) => (
                <div key={i} className="terminal-card bg-black p-6 text-center space-y-2 relative border-white/5">
                    <span className="text-2xl font-black text-primary  leading-none">{step.step}</span>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{step.text}</p>
                    <p className="text-[8px] font-bold text-white/20 uppercase">{step.desc}</p>
                    {i < 3 && <ArrowRight size={16} className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary z-20" />}
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}
