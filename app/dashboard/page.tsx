"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import { Zap, Clock, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  const harvests = useQuery(api.functions.getHarvestEvents) || []

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Harvest Activity</h1>
        <p className="text-white/40 uppercase tracking-widest text-xs font-bold">
          Real-time tracking of automated yield compounding across all strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {harvests.map((harvest: any, i: number) => {
            const isRecent = Date.now() - harvest.timestamp < 24 * 60 * 60 * 1000
            
            return (
                <motion.div 
                    key={harvest._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="terminal-card bg-black/40 border-white/5 p-6 hover:border-primary/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-sm flex items-center justify-center border ${isRecent ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/30'}`}>
                            <Zap size={20} className={isRecent ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-black uppercase italic text-lg tracking-tight">System Harvest</h3>
                                {isRecent && (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest">
                                        <div className="w-1 h-1 rounded-full bg-green-500 animate-ping" />
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(harvest.timestamp)} ago</span>
                                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Verified on Weave-3</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:text-right">
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Harvested</p>
                            <p className="font-mono font-bold text-white tabular-nums">${(harvest.amountReinvested / 0.9).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Reinvested</p>
                            <p className="font-mono font-bold text-primary tabular-nums">${harvest.amountReinvested.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">System Fee</p>
                            <p className="font-mono font-bold text-white/40 tabular-nums">${(harvest.amountReinvested * 0.1).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">New PPS</p>
                            <p className="font-mono font-bold text-green-500 tabular-nums">{(harvest.apyAtHarvest / 100).toFixed(4)}</p>
                        </div>
                    </div>
                </motion.div>
            )
        })}

        {harvests.length === 0 && (
            <div className="py-20 text-center border border-dashed border-white/10 rounded">
                <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">No harvest logs synced yet</p>
            </div>
        )}
      </div>
    </div>
  )
}
