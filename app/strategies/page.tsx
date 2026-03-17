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
  TrendingUp,
  Globe,
  Lock,
  ArrowUpRight
} from "lucide-react"
import { LiveBadge } from "@/app/components/LiveBadge"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useVault } from "@/app/hooks/useVault"

export default function StrategiesPage() {
  const pools = useQuery(api.functions.getLatestPools) || [];
  const { position, stats } = useVault();

  const chartData = [
    { date: 'Mar 10', apy: 162 },
    { date: 'Mar 11', apy: 165 },
    { date: 'Mar 12', apy: 161 },
    { date: 'Mar 13', apy: 168 },
    { date: 'Mar 14', apy: 172 },
    { date: 'Mar 15', apy: 169 },
    { date: 'Mar 16', apy: 169.4 },
  ];

  const crossMinitiaVaults = [
    { name: "Blackwing", tvl: "$0", apy: "~45%", status: "Coming Soon", risk: "Medium" },
    { name: "Tucana", tvl: "$0", apy: "~38%", status: "Coming Soon", risk: "High" },
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
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white text-glow">Yield Strategies</h1>
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
                        ${parseFloat(stats.totalDeposited).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* L1 Strategies */}
      <div className="space-y-8">
        <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] italic px-2">Layer 1 Strategies</h2>
        {pools.map((strategy, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="terminal-card bg-black overflow-hidden group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
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
                        <p className="text-xs font-mono font-bold text-[#22c55e] tabular-nums">{strategy.feeAPR.toFixed(1)}% <span className="text-white/20">/</span> <span className="text-primary">{strategy.emissionAPR.toFixed(1)}%</span></p>
                    </div>
                </div>
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

      {/* Cross-Minitia Strategies V3 */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] italic">Cross-Minitia Vaults</h2>
            <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">V3 Beta</div>
        </div>
        <div className="terminal-card bg-black/50 overflow-hidden border-dashed">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-white/20 uppercase italic">
                        <th className="p-6">Minitia Network</th>
                        <th className="p-6">Projected APY</th>
                        <th className="p-6">Current TVL</th>
                        <th className="p-6">Governance Status</th>
                        <th className="p-6 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-white/60 uppercase tracking-tight">
                    {crossMinitiaVaults.map((v, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <td className="p-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/20">
                                    <Globe size={16} />
                                </div>
                                <span className="text-white/80">{v.name}</span>
                            </td>
                            <td className="p-6 text-primary">{v.apy}</td>
                            <td className="p-6 font-mono text-white/20">{v.tvl}</td>
                            <td className="p-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                                    <span className="text-yellow-500/60 text-[9px]">Pending Governance Vote</span>
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <button className="text-[9px] font-black text-white/20 group-hover:text-primary transition-colors flex items-center gap-2 ml-auto">
                                    Queue Vote <Lock size={10} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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

    </div>
  )
}
