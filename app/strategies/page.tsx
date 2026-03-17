"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import { 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Activity,
  TrendingUp
} from "lucide-react"
import { LiveBadge } from "@/app/components/LiveBadge"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function StrategiesPage() {
  const pools = useQuery(api.functions.getLatestPools) || [];
  const stats = useQuery(api.functions.getGlobalStats);

  // Mock data for the history chart (real chart integration)
  const chartData = [
    { date: 'Mar 10', apy: 162 },
    { date: 'Mar 11', apy: 165 },
    { date: 'Mar 12', apy: 161 },
    { date: 'Mar 13', apy: 168 },
    { date: 'Mar 14', apy: 172 },
    { date: 'Mar 15', apy: 169 },
    { date: 'Mar 16', apy: 169.4 },
  ];

  if (pools.length === 0) {
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
                        <LiveBadge />
                    </div>
                    <p className="text-xl font-mono font-black italic text-white tabular-nums">
                        ${(stats?.totalTVL || 42701920).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* APY History Chart */}
      <div className="terminal-card bg-black p-8 space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary italic">Protocol APY Performance // 7D</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Aggregated Yield
                </div>
            </div>
        </div>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ad46ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ad46ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.3 }} />
                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(173, 70, 255, 0.2)', fontSize: '12px' }}
                    itemStyle={{ color: '#ad46ff' }}
                />
                <Area type="monotone" dataKey="apy" stroke="#ad46ff" strokeWidth={3} fillOpacity={1} fill="url(#colorApy)" />
              </AreaChart>
            </ResponsiveContainer>
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
                            {strategy.type === 'weighted' ? <Zap size={24} /> : <Layers size={24} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none">{strategy.pair}</h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">{strategy.type === 'weighted' ? 'LP Provision' : 'Lending Supply'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Protocol Risk</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={12} className={strategy.type === 'weighted' ? "text-yellow-500" : "text-[#0B7B5E]"} />
                                <span className={`text-xs font-black uppercase italic ${strategy.type === 'weighted' ? "text-yellow-500" : "text-[#0B7B5E]"}`}>{strategy.type === 'weighted' ? 'Medium' : 'Low'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Status</p>
                            <span className="text-xs font-black uppercase italic text-primary">Active</span>
                        </div>
                    </div>
                </div>

                {/* Data Points */}
                <div className="lg:col-span-6 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Current APY</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-mono font-black italic text-primary tracking-tighter tabular-nums">{strategy.totalAPR.toFixed(1)}%</p>
                            <LiveBadge type="est" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">TVL</p>
                        <p className="text-xl font-mono font-bold text-white tracking-tighter tabular-nums">${(strategy.tvl / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">24h Vol</p>
                        <p className="text-xs font-mono font-bold text-white/60 tabular-nums">${strategy.volume24h > 0 ? (strategy.volume24h / 1000).toFixed(0) + 'K' : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Fees/Emiss</p>
                        <p className="text-xs font-mono font-bold text-[#0B7B5E] tabular-nums">{strategy.feeAPR.toFixed(1)}% <span className="text-white/20">/</span> <span className="text-primary">{strategy.emissionAPR.toFixed(1)}%</span></p>
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
