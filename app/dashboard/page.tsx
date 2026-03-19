"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import { Zap, Clock, TrendingUp, ArrowRight, ShieldCheck, PieChart, Activity, Wallet, BarChart3, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"

const VAULT_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "getPricePerShare", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { name: "totalDeposited", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const harvests = useQuery(api.functions.getHarvestEvents) || []
  const [timeLeft, setTimeLeft] = useState("")

  // Contract Reads
  const vaultAddress = "0x4e6926f7d551df7b5fD3A32d15CF24248d2d6b51" // Placeholder from deployments
  
  const { data: userShares } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })

  const { data: pps } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getPricePerShare',
  })

  const { data: totalTVL } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalDeposited',
  })

  const lastHarvest = harvests[0]?.timestamp || Date.now() - 3600000
  const nextHarvest = lastHarvest + 24 * 60 * 60 * 1000

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = nextHarvest - Date.now()
      if (diff <= 0) {
        setTimeLeft("Harvesting...")
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [nextHarvest])

  const userSharesBig = (userShares as bigint) || 0n
  const ppsBig = (pps as bigint) || 1000000n
  const totalTVLBig = (totalTVL as bigint) || 0n

  const userValue = (Number(userSharesBig) * Number(ppsBig)) / 1e12
  const userYield = userValue - Number(formatUnits(userSharesBig, 6))

  const blendedAPR = 66.8 // Based on weighted average of strategies

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* Protocol Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1 bg-white/[0.02] border border-white/5 rounded-sm overflow-hidden"
      >
        <div className="p-6 border-r border-white/5 flex flex-col gap-1 items-center md:items-start">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Protocol TVL</span>
            <span className="text-xl font-mono font-bold text-white tracking-tighter">${Number(formatUnits(totalTVLBig, 6)).toLocaleString()}</span>
        </div>
        <div className="p-6 border-r border-white/5 flex flex-col gap-1 items-center md:items-start">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Blended APR</span>
            <span className="text-xl font-mono font-bold text-primary tracking-tighter">{blendedAPR}%</span>
        </div>
        <div className="p-6 border-r border-white/5 flex flex-col gap-1 items-center md:items-start">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Total Harvests</span>
            <span className="text-xl font-mono font-bold text-white tracking-tighter">{harvests.length}</span>
        </div>
        <div className="p-6 flex flex-col gap-1 items-center md:items-start">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Next Harvest</span>
            <span className="text-xl font-mono font-bold text-green-500 tracking-tighter tabular-nums">{timeLeft}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <Activity className="text-primary" /> Live Activity
                    </h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Auto-compounding events across all strategies</p>
                </div>
                <button className="px-4 py-2 border border-white/5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
                    View on Explorer
                </button>
            </div>

            <div className="space-y-4">
                {harvests.map((harvest: any, i: number) => {
                    const isRecent = Date.now() - harvest.timestamp < 24 * 60 * 60 * 1000
                    return (
                        <motion.div 
                            key={harvest._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="terminal-card bg-black/40 border-white/5 p-6 hover:border-primary/30 transition-all group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${isRecent ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                    <Zap size={16} className={isRecent ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-sm tracking-tight text-white/80 group-hover:text-white transition-colors">Global Yield Harvest</h3>
                                    <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {formatDistanceToNow(harvest.timestamp)} ago</span>
                                        <span className="flex items-center gap-1"><ShieldCheck size={10} /> {harvest.txSignatures[0].slice(0, 10)}...</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-white/20 uppercase mb-1">Reinvested</p>
                                <p className="font-mono font-bold text-primary group-hover:text-glow transition-all">${harvest.amountReinvested.toFixed(2)}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>

        {/* Sidebar: Position & Info */}
        <div className="space-y-8">
            {/* Position Panel */}
            <div className="terminal-card p-8 bg-primary/[0.03] border-primary/20 space-y-8 relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                             Your Position
                        </h3>
                        <Wallet size={18} className="text-primary" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Deposited principal</span>
                            <span className="text-lg font-mono font-black text-white tracking-tighter">${isConnected ? formatUnits(userSharesBig, 6) : "0.00"}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Current Value (PPS)</span>
                            <span className="text-lg font-mono font-black text-white tracking-tighter">${isConnected ? userValue.toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Yield Earned</span>
                            <span className="text-lg font-mono font-black text-primary tracking-tighter">
                                {isConnected ? (userYield >= 0 ? "+" : "") : ""}${isConnected ? userYield.toFixed(2) : "0.00"}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic flex items-center gap-1">VIP SCORE <Info size={10}/></span>
                            <span className="text-lg font-mono font-black text-white tracking-tighter">{isConnected ? Math.floor(userValue) : "0"}</span>
                        </div>
                    </div>

                    {!isConnected && (
                        <div className="p-4 bg-white/5 border border-white/10 rounded text-center">
                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest leading-relaxed">
                                Connect wallet to track your position <br /> and earnings real-time.
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:scale-110 transition-transform">
                    <BarChart3 size={200} className="text-primary fill-current" />
                </div>
            </div>

            {/* Strategy Breakdown */}
            <div className="terminal-card p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] italic flex items-center gap-2 border-b border-white/5 pb-4">
                    <PieChart size={14} className="text-primary" /> Strategy Weight
                </h3>
                <div className="space-y-4">
                    {[
                        { name: "Initia DEX LP", weight: 60, apr: 112 },
                        { name: "Echelon Lending", weight: 30, apr: 14.5 },
                        { name: "Stable Pool", weight: 10, apr: 28.2 },
                    ].map((s, i) => (
                        <div key={i} className="space-y-2">
                             <div className="flex justify-between text-[9px] font-black uppercase tracking-widest shadow-text">
                                <span className="text-white/40">{s.name}</span>
                                <span className="text-primary">{s.weight}%</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${s.weight}%` }}
                                    className="h-full bg-primary"
                                />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
