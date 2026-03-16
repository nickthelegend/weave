"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  ArrowDownCircle, 
  Wallet, 
  ChevronDown, 
  Zap, 
  Lock, 
  TrendingUp,
  History
} from "lucide-react"
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet"

export default function AppPage() {
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("INIT")
  const { isConnected, connect, balances, isFetching } = useWeaveWallet();

  const currentBalance = token === "INIT" ? balances.init : balances.usdc;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Action Panel */}
        <div className="lg:col-span-7 space-y-8">
            <div className="terminal-card bg-black p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <ArrowDownCircle className="text-primary" />
                        Deposit Capital
                    </h2>
                    {isConnected && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40">
                          Balance: <span className={isFetching ? "animate-pulse" : ""}>{currentBalance} {token}</span>
                          <button onClick={() => setAmount(currentBalance)} className="text-primary hover:underline">MAX</button>
                      </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-[#050505] border border-white/5 p-6 rounded flex items-center justify-between group focus-within:border-primary/40 transition-colors">
                        <div className="space-y-1 flex-grow">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Input Amount</p>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent border-none outline-none text-4xl font-mono font-bold w-full text-white placeholder:text-white/10"
                            />
                        </div>
                        <button 
                          onClick={() => setToken(token === "INIT" ? "USDC" : "INIT")}
                          className="bg-secondary p-3 rounded border border-white/10 flex items-center gap-3 hover:border-primary/40 transition-all"
                        >
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs italic">
                                {token[0]}
                            </div>
                            <span className="font-bold">{token}</span>
                            <ChevronDown size={16} className="text-white/40" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded group cursor-pointer hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-primary fill-current" />
                            <div>
                                <p className="text-[10px] font-black uppercase italic text-primary tracking-widest">Zap Mode Active</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase">We handle LP conversion for you</p>
                            </div>
                        </div>
                        <div className="w-10 h-5 bg-primary/20 rounded-full relative p-1">
                            <div className="w-3 h-3 bg-primary rounded-full absolute right-1" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Projected APY</p>
                        <p className="text-2xl font-mono font-black italic text-primary">169.4%</p>
                    </div>
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Monthly Earn</p>
                        <p className="text-2xl font-mono font-black italic text-white">${(parseFloat(amount || "0") * 0.14).toFixed(2)}</p>
                    </div>
                </div>

                {isConnected ? (
                  <button className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_0_30px_rgba(173,70,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
                      Execute Deposit_
                  </button>
                ) : (
                  <button onClick={() => connect()} className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_0_30px_rgba(173,70,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      <Wallet size={18} /> Connect Wallet to Deposit
                  </button>
                )}

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/40">Fees APR</span>
                        <span className="text-[#0B7B5E]">12.4%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/40">Incentives APR</span>
                        <span className="text-primary">157.0%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/40">Vesting Period</span>
                        <span className="text-white">Liquid</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Portfolio Panel */}
        <div className="lg:col-span-5 space-y-8">
            <div className="terminal-card bg-[#0A0A0A] p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-white/80">
                        <Lock size={20} className="text-white/40" />
                        My Position
                    </h2>
                    {isConnected && <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ad46ff]" />}
                </div>

                {!isConnected ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                      <Wallet size={24} className="text-white/20" />
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Connect wallet to view portfolio</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Current Balance</p>
                        <div className="text-5xl font-mono font-black italic text-white tracking-tighter">
                            $0.00
                        </div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No active position detected</p>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5 opacity-30 pointer-events-none">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-primary rounded-full" />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-white/40 italic">Liquid Position</p>
                                        <p className="text-sm font-bold">$0.00</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                        <div className="w-[0%] h-full bg-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-grow border border-white/10 py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest">
                                Withdraw
                            </button>
                        </div>
                    </div>
                  </>
                )}
            </div>

            {isConnected && (
              <div className="terminal-card bg-black p-6 space-y-4 border-dashed opacity-60">
                  <div className="flex items-center gap-3 text-white/40">
                      <History size={16} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest italic">Live Activity Stream</h3>
                  </div>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Scanning blockchain...</span>
                  </div>
              </div>
            )}
        </div>

      </div>
    </div>
  )
}
