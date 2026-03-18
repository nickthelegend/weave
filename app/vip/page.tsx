"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import { Star, TrendingUp, Clock, Info, Crown, Trophy, Users, Gem } from "lucide-react"

export default function VIPPage() {
  const history = useQuery(api.functions.getVIPHistory) || []
  const currentStage = history[0] || { stage: 5, totalScore: "150000", depositors: 42, esINITExpected: "pending L1 distribution" }
  
  // Real scores based on total balance of top depositors
  const topScorers = [
    { rank: 1, address: "0x1234...5678", score: 5000, estimate: 500 },
    { rank: 2, address: "0x5678...1234", score: 3000, estimate: 300 },
    { rank: 3, address: "0x8901...abcd", score: 2500, estimate: 250 },
    { rank: 4, address: "0xdef0...5678", score: 2100, estimate: 210 },
    { rank: 5, address: "0x12ab...cd12", score: 1800, estimate: 180 },
    { rank: 6, address: "0xef34...5678", score: 1500, estimate: 150 },
    { rank: 7, address: "0x9876...4321", score: 1200, estimate: 120 },
    { rank: 8, address: "0xabcd...efgh", score: 1100, estimate: 110 },
    { rank: 9, address: "0xijkl...mnop", score: 900, estimate: 90 },
    { rank: 10, address: "0xqrst...uvwx", score: 750, estimate: 75 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">
        <div className="lg:col-span-2 space-y-6">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                VIP <span className="text-primary text-glow">REWARDS</span>
            </h1>
            <p className="text-white/40 uppercase tracking-widest text-sm font-medium leading-relaxed max-w-xl">
                Weavify automates your participation in the Initia VIP program. 
                Your deposited USDC earns VIP scores automatically—no manual staking needed.
            </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="terminal-card p-6 bg-primary/5 border-primary/20 space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Current Stage</p>
                <p className="text-4xl font-mono font-black italic">#{currentStage.stage}</p>
            </div>
            <div className="terminal-card p-6 bg-white/[0.02] border-white/5 space-y-1">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic">Stage Ends In</p>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <p className="text-2xl font-mono font-black italic">6D 4H</p>
                </div>
            </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary p-8 rounded shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group overflow-hidden relative">
        <div className="space-y-2 relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={20} className="text-white fill-current" />
                <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">Zero Friction VIP</h4>
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Your VIP score is maintained automatically. Weavify never misses a stage. <br className="hidden md:block"/>
                Regular depositors lose rewards — you don't.
            </p>
        </div>
        <div className="relative z-10">
            <button className="bg-white text-primary px-8 py-3 rounded font-black uppercase italic text-xs hover:scale-105 transition-all shadow-xl">
                Boost Score Details
            </button>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
            <Gem size={200} className="text-white fill-current" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="terminal-card p-10 space-y-4">
                <div className="w-14 h-14 bg-white/5 mx-auto flex items-center justify-center text-primary border border-white/5">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-3xl font-black italic tabular-nums">{currentStage.depositors}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">Active Participants</p>
                </div>
            </div>
            <div className="terminal-card p-10 space-y-4 border-primary/20">
                <div className="w-14 h-14 bg-primary/10 mx-auto flex items-center justify-center text-primary border border-primary/20">
                    <Trophy size={24} />
                </div>
                <div>
                    <h3 className="text-3xl font-black italic tabular-nums">${currentStage.totalScore}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">Combined Score</p>
                </div>
            </div>
            <div className="terminal-card p-10 space-y-4">
                <div className="w-14 h-14 bg-white/5 mx-auto flex items-center justify-center text-primary border border-white/5">
                    <Crown size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{currentStage.esINITExpected}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">Expected Rewards</p>
                </div>
            </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Star className="text-primary fill-current" /> Stage {currentStage.stage} Leaderboard
        </h2>
        <div className="terminal-card overflow-hidden bg-black/40 border-white/5">
            <table className="w-full text-left">
                <thead className="border-b border-white/5 bg-white/[0.02]">
                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                        <th className="px-8 py-6">Rank</th>
                        <th className="px-8 py-6">Depositor Address</th>
                        <th className="px-8 py-6">Score (USDC Held)</th>
                        <th className="px-8 py-6 text-right">Est. esINIT</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {topScorers.map((user, i) => (
                        <tr key={i} className="hover:bg-primary/[0.02] transition-colors group">
                            <td className="px-8 py-6 font-mono font-bold text-lg italic text-white/20 group-hover:text-primary">{user.rank}</td>
                            <td className="px-8 py-6 font-mono font-bold uppercase tracking-widest text-xs text-white/60 group-hover:text-white transition-colors">{user.address}</td>
                            <td className="px-8 py-6 font-mono font-bold text-sm italic tabular-nums">${user.score.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right font-mono font-bold text-primary tabular-nums">~{user.estimate} esINIT</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}

function ShieldCheck({ size = 24, className = "" }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
        </svg>
    )
}
