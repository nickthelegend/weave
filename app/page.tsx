"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, TrendingUp, ShieldCheck, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [counter, setCounter] = useState(1000)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + (prev * (1.69 / (365 * 24 * 60 * 20)))) // Simulating growth
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 space-y-32">
      
      {/* Hero Section */}
      <section className="relative pt-10 text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded border border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-[0.3em] text-primary"
        >
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          Initia Network // Yield Aggregator
        </motion.div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none"
          >
            Your Initia yield. <br />
            <span className="text-primary glow-active px-2">Automated.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-sm md:text-base font-medium text-white/40 uppercase tracking-widest"
          >
            Weave aggregates liquidity across Initia DEX, Echelon, and VIP pools <br className="hidden md:block" /> 
            to deliver institutional-grade yield strategies in one click.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link href="/app">
            <button className="bg-primary text-white px-10 py-5 rounded-sm font-black uppercase italic text-sm flex items-center gap-4 transition-all hover:scale-105 hover:terminal-glow active:scale-95 group">
              Launch Terminal
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </Link>
          <button className="px-10 py-5 border border-white/10 rounded-sm text-white/60 font-black uppercase italic text-sm hover:border-primary/40 hover:text-white transition-all">
            Documentation
          </button>
        </motion.div>
      </section>

      {/* Yield Counter Section */}
      <section className="terminal-card bg-black p-12 md:p-20 relative overflow-hidden group">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary italic">Live Yield Engine</h3>
            <p className="text-2xl font-bold uppercase leading-tight">
              Watch your capital work at <br />
              <span className="text-primary">169% Target APY</span>
            </p>
            <p className="text-xs font-medium text-white/40 uppercase tracking-tighter">
              Historical performance based on USDC-INIT LP auto-compounding emissions.
            </p>
          </div>
          <div className="text-center md:text-right">
            <div className="inline-block p-10 bg-[#050505] border border-primary/10 rounded shadow-2xl">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Projected Growth</p>
                <div className="text-6xl md:text-8xl font-mono font-black italic tracking-tighter text-white tabular-nums">
                    ${counter.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 mt-4">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="text-xs font-bold text-primary italic uppercase tracking-widest">+169.42% APR</span>
                </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={200} className="text-primary fill-current" />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Auto-Compound",
            desc: "VIP emissions are harvested and reinvested into your core position every 24 hours.",
            icon: Zap,
            stat: "Daily harvests"
          },
          {
            title: "Best Yield",
            desc: "Proprietary routing splits capital between Initia DEX LPs and Echelon lending pools.",
            icon: TrendingUp,
            stat: "Risk-optimized"
          },
          {
            title: "One Click",
            desc: "Single-token entry. Deposit INIT or USDC and we handle the LP formation and staking.",
            icon: ShieldCheck,
            stat: "Zero friction"
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5, borderColor: 'rgba(173, 70, 255, 0.4)' }}
            className="terminal-card p-8 space-y-6"
          >
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-primary">
              <feature.icon size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tighter">{feature.title}</h4>
              <p className="text-xs text-white/40 leading-relaxed uppercase font-medium tracking-tight">
                {feature.desc}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">{feature.stat}</span>
              <ChevronRight size={14} className="text-primary" />
            </div>
          </motion.div>
        ))}
      </section>

    </div>
  )
}
