"use client"

import { motion } from "framer-motion"
import { 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Activity,
  RefreshCcw
} from "lucide-react"
import { usePoolData } from "@/app/hooks/usePoolData"
import { LiveBadge } from "@/app/components/LiveBadge"

export default function StrategiesPage() {
  const { pools, loading, lastUpdated, error } = usePoolData();

  if (loading) {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20 space-y-12 animate-pulse">
            <div className="h-12 w-64 bg-white/5 rounded-sm" />
            <div className="space-y-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-48 w-full bg-white/5 rounded-sm border border-white/5" />
                ))}
            </div>
        </div>
    );
  }

  const totalTVL = pools.reduce((acc, p) => acc + p.tvl, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Yield Strategies</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">Protocol-Managed Liquidity Allocation</p>
        </div>
        
        <div className="flex gap-4">
            <div className="terminal-card bg-black px-6 py-4 flex items-center gap-4">
                <BarChart3 className="text-primary" size={20} />
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-white/20 uppercase">Total TVL</p>
                        <LiveBadge type={error ? 'cached' : 'live'} />
                    </div>
                    <p className="text-xl font-mono font-black italic text-white">${totalTVL.toLocaleString()}</p>
                </div>
            </div>
            <div className="terminal-card bg-black px-6 py-4 flex items-center gap-4 border-dashed">
                <Activity className="text-white/20" size={20} />
                <div>
                    <p className="text-[9px] font-black text-white/20 uppercase">Last Update</p>
                    <p className="text-lg font-mono font-bold text-white/40 italic">{lastUpdated.toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {pools.map((strategy, i) => (
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
                            {strategy.type === 'dex' ? <Zap size={24} /> : <Layers size={24} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none">{strategy.pair}</h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">{strategy.type === 'dex' ? 'LP Provision' : 'Lending Supply'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Protocol Risk</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={12} className={strategy.type === 'dex' ? "text-yellow-500" : "text-[#0B7B5E]"} />
                                <span className={`text-xs font-black uppercase italic ${strategy.type === 'dex' ? "text-yellow-500" : "text-[#0B7B5E]"}`}>{strategy.type === 'dex' ? 'Medium' : 'Low'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Status</p>
                            <span className="text-xs font-black uppercase italic text-primary">Optimizing</span>
                        </div>
                    </div>
                </div>

                {/* Data Points */}
                <div className="lg:col-span-6 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Current APY</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-mono font-black italic text-primary tracking-tighter">{strategy.totalAPR.toFixed(1)}%</p>
                            <LiveBadge type="est" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">TVL</p>
                        <p className="text-xl font-mono font-bold text-white tracking-tighter">${(strategy.tvl / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">24h Vol</p>
                        <p className="text-xs font-mono font-bold text-white/60">${strategy.volume24h > 0 ? (strategy.volume24h / 1000).toFixed(0) + 'K' : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Fees/Emiss</p>
                        <p className="text-xs font-mono font-bold text-[#0B7B5E]">{strategy.feeAPR.toFixed(1)}% <span className="text-white/20">/</span> <span className="text-primary">{strategy.emissionAPR.toFixed(1)}%</span></p>
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

    </div>
  )
}
