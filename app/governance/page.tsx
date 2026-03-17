"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowDownCircle, 
  ChevronDown, 
  Zap, 
  Lock, 
  TrendingUp,
  History,
  Wallet,
  Activity,
  Mail,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Target,
  Gavel,
  Clock,
  Coins,
  ShieldCheck,
  Percent
} from "lucide-react"
import Link from "next/link"
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet"
import { usePoolData } from "@/app/hooks/usePoolData"
import { useVault } from "@/app/hooks/useVault"
import { LiveBadge } from "@/app/components/LiveBadge"

export default function GovernancePage() {
  const [lockAmount, setLockAmount] = useState("")
  const [lockDuration, setLockDuration] = useState(2) // 1 year default
  const { isConnected, connect, address, balances } = useWeaveWallet()
  const { position, stats } = useVault()

  const durations = [
    { label: "3M", multiplier: 0.25 },
    { label: "6M", multiplier: 0.5 },
    { label: "1Y", multiplier: 1 },
    { label: "2Y", multiplier: 2 },
    { label: "4Y", multiplier: 4 },
  ]

  const projectedVe = useMemo(() => {
    const amt = parseFloat(lockAmount || "0")
    return (amt * durations[lockDuration].multiplier).toFixed(2)
  }, [lockAmount, lockDuration])

  const strategies = [
    { name: "Initia DEX", alloc: 65, votes: "12.4M" },
    { name: "Echelon", alloc: 35, votes: "6.7M" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-sans selection:bg-primary/20 space-y-12">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Governance Terminal</h1>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">veWEAVE Staking & Capital Allocation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Section 1 & 2: Locking and Position */}
        <div className="lg:col-span-7 space-y-8">
            
            {/* Lock WEAVE */}
            <div className="terminal-card bg-black p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Lock className="text-primary" />
                        Lock WEAVE
                    </h2>
                    <div className="text-[10px] font-black uppercase text-white/40 italic">
                        Multiplier: {durations[lockDuration].multiplier}x
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#050505] border border-white/5 p-6 rounded-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Amount to lock</p>
                            <p className="text-[9px] font-bold text-white/40 uppercase">Balance: 0.00 WEAVE</p>
                        </div>
                        <input 
                            type="number" 
                            value={lockAmount}
                            onChange={(e) => setLockAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent border-none outline-none text-4xl font-mono font-bold w-full text-white placeholder:text-white/5 tabular-nums"
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {durations.map((d, i) => (
                            <button 
                                key={i}
                                onClick={() => setLockDuration(i)}
                                className={`py-3 rounded-sm text-[10px] font-black uppercase italic border transition-all
                                    ${lockDuration === i ? "bg-primary border-primary text-white glow-primary" : "bg-secondary border-white/5 text-white/40 hover:border-primary/40"}
                                `}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 border border-white/5 rounded-sm space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">veWEAVE Power</p>
                        <p className="text-2xl font-mono font-black italic text-primary tabular-nums">{projectedVe}</p>
                    </div>
                    <div className="bg-secondary p-4 border border-white/5 rounded-sm space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Fee Share (Est)</p>
                        <p className="text-2xl font-mono font-black italic text-white tabular-nums">0.0%</p>
                    </div>
                </div>

                <button className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_0_30px_rgba(173,70,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
                    Execute Lock_
                </button>
            </div>

            {/* Protocol Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="terminal-card p-6 bg-white/[0.01] space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Locked</p>
                    <p className="text-xl font-mono font-bold italic text-white">12.4M WEAVE</p>
                </div>
                <div className="terminal-card p-6 bg-white/[0.01] space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total veWEAVE</p>
                    <p className="text-xl font-mono font-bold italic text-primary">48.2M</p>
                </div>
                <div className="terminal-card p-6 bg-white/[0.01] space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Avg Lock</p>
                    <p className="text-xl font-mono font-bold italic text-white">2.4 Years</p>
                </div>
            </div>
        </div>

        {/* Right Col: Your Lock & Voting */}
        <div className="lg:col-span-5 space-y-8">
            
            {/* Your Position */}
            <div className="terminal-card bg-[#0A0A0A] p-8 space-y-8 border-primary/20">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Target size={20} className="text-primary" />
                        My Governance
                    </h2>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ad46ff]" />
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase">veWEAVE Balance</p>
                            <p className="text-4xl font-mono font-black italic text-white tracking-tighter">0.00</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase">Staked</p>
                            <p className="text-sm font-bold text-white/60">0.00 WEAVE</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase">
                                <Coins size={12} />
                                Pending Rewards
                            </div>
                            <span className="text-sm font-mono font-bold text-[#22c55e]">$0.00 USDC</span>
                        </div>
                        <button className="w-full border border-white/10 py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest hover:bg-white/5 transition-all opacity-30 cursor-not-allowed">
                            Claim Rewards
                        </button>
                    </div>
                </div>
            </div>

            {/* Gauge Voting */}
            <div className="terminal-card bg-black p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Gavel className="text-primary" />
                        Gauge Voting
                    </h2>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#ad46ff] uppercase bg-primary/10 px-2 py-1 rounded">
                        <Clock size={10} />
                        Ends in 4d 12h
                    </div>
                </div>

                <div className="space-y-6">
                    {strategies.map((s, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-black uppercase text-white tracking-tight">{s.name}</p>
                                    <p className="text-[9px] font-bold text-white/20 uppercase">Current Allocation: {s.alloc}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-mono font-bold text-primary">{s.votes} Votes</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/20" style={{ width: `${s.alloc}%` }} />
                            </div>
                            <input type="range" className="w-full accent-primary bg-transparent h-1.5" />
                        </div>
                    ))}

                    <button className="w-full border border-primary/40 py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
                        Submit Votes_
                    </button>
                    <p className="text-[8px] font-bold text-white/20 uppercase text-center tracking-widest">
                        * Your votes will apply to the next epoch
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}
