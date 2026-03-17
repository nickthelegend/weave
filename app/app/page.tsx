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
  Target
} from "lucide-react"
import Link from "next/link"
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet"
import { usePoolData } from "@/app/hooks/usePoolData"
import { useVault } from "@/app/hooks/useVault"
import { LiveBadge } from "@/app/components/LiveBadge"

export default function AppPage() {
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("USDC")
  const [withdrawShares, setWithdrawShares] = useState("")
  const [showBanner, setShowBanner] = useState(false)
  const [depositStatus, setDepositStatus] = useState<"idle"|"approving"|"depositing"|"success"|"error">("idle")
  const [lastTxHash, setLastTxHash] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { isConnected, connect, address, balances, isFetching } = useWeaveWallet();
  const { weightedPool, error: poolError } = usePoolData();
  const { deposit, withdraw, position, stats, getUSDCBalance, loading: positionLoading } = useVault();
  
  const harvestHistory = useQuery(api.functions.getHarvestHistory, { limit: 5 }) || [];
  const apr = weightedPool?.totalAPR || 169.4;

  // Banner Logic
  useEffect(() => {
    if (typeof window !== 'undefined' && isConnected) {
        getUSDCBalance().then(bal => {
            const dismissed = localStorage.getItem('weave_faucet_banner_dismissed');
            if (parseFloat(bal) === 0 && !dismissed) {
                setShowBanner(true);
            } else {
                setShowBanner(false);
            }
        });
    }
  }, [isConnected, address, getUSDCBalance]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('weave_faucet_banner_dismissed', 'true');
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setDepositStatus("approving");
    setErrorMsg("");
    
    try {
        const receipt = await deposit(amount);
        setLastTxHash(receipt.transactionHash);
        setDepositStatus("success");
        setAmount("");
    } catch (e: any) {
        setDepositStatus("error");
        if (e.message.toLowerCase().includes("insufficient")) {
            setErrorMsg("Not enough mUSDC balance");
        } else if (e.message.toLowerCase().includes("rejected")) {
            setErrorMsg("Transaction cancelled");
        } else {
            setErrorMsg("Transaction failed");
        }
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawShares || parseFloat(withdrawShares) <= 0) return;
    try {
        await withdraw(withdrawShares);
        setWithdrawShares("");
    } catch (e) {
        console.error(e);
    }
  };

  // Real-time yield ticker math
  const [liveValue, setLiveValue] = useState(0);
  useEffect(() => {
    if (position && parseFloat(position.shares) > 0) {
        setLiveValue(parseFloat(position.valueUSD)); // Instant init
        const interval = setInterval(() => {
            const pps = parseFloat(position.pricePerShare);
            const shares = parseFloat(position.shares);
            setLiveValue(shares * pps);
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [position]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-sans selection:bg-primary/20">
      
      {/* Faucet Notification Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
                        <Zap size={16} className="fill-current" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-yellow-500/80 tracking-widest">
                        Low Liquidity Detected. Get free test tokens → 
                        <Link href="/faucet" className="ml-2 underline hover:text-yellow-400">Request 10,000 mUSDC</Link>
                    </p>
                </div>
                <button onClick={dismissBanner} className="text-yellow-500/40 hover:text-yellow-500 transition-colors">
                    <X size={16} />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Stats Bar */}
      <div className="mb-12 flex flex-wrap gap-8 items-center justify-center py-4 border-y border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Protocol TVL</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(position.totalDeposited).toLocaleString()}</span>
            <LiveBadge />
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Yield Generated</span>
            <span className="text-sm font-mono font-bold text-[#22c55e] tabular-nums">${parseFloat(position.totalYieldGenerated).toLocaleString()}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Future Staker Rewards</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(position.totalProtocolFees).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
            <div className="terminal-card bg-black p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Target className="text-primary" />
                        Execute Strategy
                    </h2>
                    {isConnected && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 tracking-wider">
                          Balance: <span className={isFetching ? "animate-pulse" : ""}>{token === "INIT" ? balances.init : balances.usdc} {token}</span>
                          <button onClick={() => setAmount(token === "INIT" ? balances.init : balances.usdc)} className="text-primary hover:underline ml-2">MAX</button>
                      </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-[#050505] border border-white/5 p-6 rounded-sm flex items-center justify-between focus-within:border-primary/40 transition-colors">
                        <div className="space-y-1 flex-grow">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Input Amount</p>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent border-none outline-none text-4xl font-mono font-bold w-full text-white placeholder:text-white/5 tabular-nums"
                            />
                        </div>
                        <button 
                          onClick={() => setToken(token === "INIT" ? "USDC" : "INIT")}
                          className="bg-secondary p-3 rounded-sm border border-white/10 flex items-center gap-3 hover:border-primary/40 transition-all"
                        >
                            <span className="font-bold text-xs tracking-widest">{token}</span>
                            <ChevronDown size={14} className="text-white/40" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 border border-white/5 rounded-sm space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Projected APY</p>
                        <p className="text-2xl font-mono font-black italic text-primary tabular-nums tracking-tighter">{apr.toFixed(1)}%</p>
                    </div>
                    <div className="bg-secondary p-4 border border-white/5 rounded-sm space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Monthly Earn</p>
                        <p className="text-2xl font-mono font-black italic text-white tabular-nums tracking-tighter">${(parseFloat(amount || "0") * (apr/1200)).toFixed(2)}</p>
                    </div>
                </div>

                {isConnected ? (
                  <div className="space-y-4">
                    <button 
                        onClick={handleDeposit}
                        disabled={depositStatus === "approving" || depositStatus === "depositing" || !amount}
                        className={`w-full py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3
                            ${depositStatus === "success" ? "bg-[#22c55e]" : "bg-primary glow-primary"}
                            ${depositStatus === "error" ? "bg-red-500" : ""}
                            disabled:opacity-50 active:scale-95
                        `}
                    >
                        {(depositStatus === "approving" || depositStatus === "depositing") && <Loader2 className="animate-spin" size={20} />}
                        {depositStatus === "idle" && "Execute Deposit_"}
                        {depositStatus === "approving" && "Approving USDC..."}
                        {depositStatus === "depositing" && "Confirming Deposit..."}
                        {depositStatus === "success" && "Deposit Confirmed ✓"}
                        {depositStatus === "error" && "Failed — Try Again"}
                    </button>
                    
                    {depositStatus === "success" && (
                        <a 
                            href={`https://scan.testnet.initia.xyz/tx/${lastTxHash}`} 
                            target="_blank" 
                            className="block text-center text-[10px] font-bold text-primary hover:underline uppercase tracking-[0.2em]"
                        >
                            View Transaction on InitiaScan <ExternalLink size={10} className="inline ml-1" />
                        </a>
                    )}

                    {errorMsg && (
                        <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest italic">{errorMsg}</p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => connect()} className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] glow-primary flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <Wallet size={18} /> Connect Wallet to Deposit
                  </button>
                )}
            </div>

            {/* Token Roadmap Card */}
            <div className="terminal-card p-10 bg-gradient-to-br from-black to-[#080210] border-primary/20 relative overflow-hidden group">
                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">WEAVE Token — Q3 2025</h3>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Governance & Reward Distribution</p>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-sm flex flex-col items-center">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Fees Accrued</p>
                            <p className="text-xl font-mono font-bold text-[#22c55e] tabular-nums tracking-tighter">${parseFloat(position.totalProtocolFees).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">LP Rewards</p>
                            <p className="text-xs font-bold font-mono">40%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Team (2yr)</p>
                            <p className="text-xs font-bold font-mono">30%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Treasury</p>
                            <p className="text-xs font-bold font-mono">20%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Airdrop</p>
                            <p className="text-xs font-bold font-mono text-primary">10%</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Zap size={250} className="text-primary fill-current" />
                </div>
            </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="terminal-card bg-[#0A0A0A] p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-white/90">
                        <Lock size={20} className="text-white/40" />
                        Active Position
                    </h2>
                    {isConnected && <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ad46ff]" />}
                </div>

                {!isConnected ? (
                  <div className="py-12 text-center opacity-30">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Connect wallet to view portfolio</p>
                  </div>
                ) : positionLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : parseFloat(position.shares) === 0 ? (
                  <div className="py-12 text-center opacity-20 flex flex-col items-center gap-4">
                    <Activity size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No deployed capital found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Real-time Value</p>
                            <LiveBadge />
                        </div>
                        <div className="text-5xl font-mono font-black italic text-white tracking-tighter tabular-nums">
                            ${liveValue.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </div>
                        <div className="flex items-center gap-2 text-primary font-bold text-[9px] uppercase tracking-widest">
                            <TrendingUp size={10} />
                            {position.shares} Shares @ ${position.pricePerShare}
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-white/5">
                         <div className="bg-secondary/5 border border-white/10 p-5 rounded-sm space-y-5">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Withdraw Amount (Shares)</p>
                                <div className="flex items-center justify-between gap-4">
                                    <input 
                                        type="number"
                                        value={withdrawShares}
                                        onChange={(e) => setWithdrawShares(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-transparent border-none outline-none text-2xl font-mono font-bold w-full text-white placeholder:text-white/5"
                                    />
                                    <button onClick={() => setWithdrawShares(position.shares)} className="text-[10px] font-black text-primary hover:text-white transition-colors">ALL_</button>
                                </div>
                            </div>
                            <button 
                                onClick={handleWithdraw}
                                className="w-full bg-white text-black py-4 rounded-sm font-black uppercase italic text-[10px] tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95"
                            >
                                Execute Withdrawal_
                            </button>
                         </div>
                    </div>
                  </div>
                )}
            </motion.div>

            <div className="terminal-card bg-black p-6 space-y-6 border-dashed border-white/10 opacity-60">
                <div className="flex items-center gap-3 text-white/20">
                    <Activity size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest italic underline underline-offset-4 decoration-primary/30">Protocol Activity Feed</h3>
                </div>
                <div className="space-y-6">
                    {harvestHistory.length > 0 ? harvestHistory.map((h, i) => (
                        <div key={i} className="flex gap-4 items-start relative group">
                            <div className="w-0.5 h-6 bg-primary/20 group-hover:bg-primary transition-colors absolute -left-2 top-0" />
                            <p className="text-[10px] font-medium text-white/40 uppercase leading-relaxed tracking-tight group-hover:text-white/60 transition-colors">
                                Harvest completed — <span className="text-primary">${h.amountReinvested} REINVESTED</span>
                                <span className="block text-[8px] opacity-40 mt-1 font-mono">{new Date(h.timestamp).toLocaleTimeString()} // ID: 0x{i}..ef</span>
                            </p>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Listening for signals...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
