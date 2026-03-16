"use client"

import { motion } from "framer-motion"
import { 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Info,
  ChevronRight,
  TrendingUp,
  Activity
} from "lucide-react"

const strategies = [
  {
    name: "Initia DEX LP",
    pair: "USDC-INIT",
    apy: "169.4%",
    tvl: "$14.2M",
    allocation: "65%",
    risk: "Medium",
    riskColor: "text-yellow-500",
    fees: "12.4%",
    emissions: "157.0%",
    status: "Optimizing"
  },
  {
    name: "Echelon Lending",
    pair: "INIT Supply",
    apy: "14.2%",
    tvl: "$28.5M",
    allocation: "35%",
    risk: "Low",
    riskColor: "text-[#0B7B5E]",
    fees: "8.1%",
    emissions: "6.1%",
    status: "Stable"
  }
]

export default function StrategiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Yield Strategies</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">Protocol-Managed Liquidity Allocation</p>
        </div>
        
        <div className="flex gap-4">
            <div className="terminal-card bg-black px-6 py-4 flex items-center gap-4">
                <BarChart3 className="text-primary" size={20} />
                <div>
                    <p className="text-[9px] font-black text-white/20 uppercase">Total TVL</p>
                    <p className="text-xl font-mono font-black italic text-white">$42,701,920</p>
                </div>
            </div>
            <div className="terminal-card bg-black px-6 py-4 flex items-center gap-4 border-dashed opacity-50">
                <Activity className="text-white/20" size={20} />
                <div>
                    <p className="text-[9px] font-black text-white/20 uppercase">Last Harvest</p>
                    <p className="text-lg font-mono font-bold text-white/40 italic">14m ago</p>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {strategies.map((strategy, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="terminal-card bg-black overflow-hidden group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Header Info */}
                <div className="lg:col-span-4 p-8 bg-[#050505] border-r border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            {i === 0 ? <Zap size={24} /> : <Layers size={24} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none">{strategy.name}</h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">{strategy.pair}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Protocol Risk</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={12} className={strategy.riskColor} />
                                <span className={`text-xs font-black uppercase italic ${strategy.riskColor}`}>{strategy.risk}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Status</p>
                            <span className="text-xs font-black uppercase italic text-primary">{strategy.status}</span>
                        </div>
                    </div>
                </div>

                {/* Data Points */}
                <div className="lg:col-span-6 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Current APY</p>
                        <p className="text-3xl font-mono font-black italic text-primary tracking-tighter">{strategy.apy}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Total Value</p>
                        <p className="text-xl font-mono font-bold text-white tracking-tighter">{strategy.tvl}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Allocation</p>
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: strategy.allocation }} />
                            </div>
                            <span className="text-xs font-mono font-bold text-white/60">{strategy.allocation}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Fees/Emiss</p>
                        <p className="text-xs font-mono font-bold text-[#0B7B5E]">{strategy.fees} <span className="text-white/20">/</span> <span className="text-primary">{strategy.emissions}</span></p>
                    </div>
                </div>

                {/* Action */}
                <div className="lg:col-span-2 p-8 flex items-center justify-center border-l border-white/5 bg-[#050505]/50 group-hover:bg-primary/5 transition-colors">
                    <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase italic text-white/60 group-hover:text-primary transition-colors">
                        View Strategy
                        <ChevronRight size={14} />
                    </button>
                </div>

            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="terminal-card bg-[#050505] p-6 border-dashed opacity-40">
        <div className="flex items-start gap-4">
            <Info className="text-primary flex-shrink-0" size={16} />
            <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                All strategies are non-custodial and governed by the Weave Yield Engine. Capital is distributed based on real-time APY monitoring and liquidity depth. Historical performance is not indicative of future results. Max drawdown for DEX LP strategies capped at IL exposure.
            </p>
        </div>
      </div>

    </div>
  )
}
