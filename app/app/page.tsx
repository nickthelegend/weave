"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useWeaveWallet } from "@/app/hooks/useWeaveWallet";
import { usePoolData } from "@/app/hooks/usePoolData";
import { useVault } from "@/app/hooks/useVault";
import { LiveBadge } from "@/app/components/LiveBadge";

export default function AppPage() {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [depositStatus, setDepositStatus] = useState<"idle"|"approving"|"depositing"|"success"|"error">("idle");
  const [lastTxHash, setLastTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-sans">
      
      {/* Faucet Notification Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
                        <Zap size={16} className="fill-current" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-yellow-500/80 tracking-wider">
                        You need mUSDC to use Weave. Get free test tokens → 
                        <Link href="/faucet" className="ml-2 underline hover:text-yellow-400">Go to Faucet</Link>
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
      <div className="mb-12 flex flex-wrap gap-8 items-center justify-center py-4 border-y border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Protocol TVL</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(position.totalDeposited).toLocaleString()}</span>
            <LiveBadge />
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Yield Generated</span>
            <span className="text-sm font-mono font-bold text-[#0B7B5E] tabular-nums">${parseFloat(position.totalYieldGenerated).toLocaleString()}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Staker Rewards</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(position.totalProtocolFees).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
            <div className="terminal-card bg-black p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <ArrowDownCircle className="text-primary" />
                        Deposit Capital
                    </h2>
                    {isConnected && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40">
                          Balance: <span className={isFetching ? "animate-pulse" : ""}>{token === "INIT" ? balances.init : balances.usdc} {token}</span>
                      </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-[#050505] border border-white/5 p-6 rounded flex items-center justify-between focus-within:border-primary/40 transition-colors">
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
                            <span className="font-bold">{token}</span>
                            <ChevronDown size={16} className="text-white/40" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Projected APY</p>
                        <p className="text-2xl font-mono font-black italic text-primary tabular-nums">{apr.toFixed(1)}%</p>
                    </div>
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Monthly Earn</p>
                        <p className="text-2xl font-mono font-black italic text-white tabular-nums">${(parseFloat(amount || "0") * (apr/1200)).toFixed(2)}</p>
                    </div>
                </div>

                {isConnected ? (
                  <button 
                    onClick={handleDeposit}
                    disabled={depositStatus === "approving" || depositStatus === "depositing" || !amount}
                    className={`w-full py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3
                        ${depositStatus === "success" ? "bg-[#0B7B5E]" : "bg-primary shadow-[0_0_30px_rgba(173,70,255,0.2)]"}
                        ${depositStatus === "error" ? "bg-red-500" : ""}
                        disabled:opacity-50
                    `}
                  >
                        {(depositStatus === "approving" || depositStatus === "depositing") && <Loader2 className="animate-spin" size={20} />}
                        {depositStatus === "idle" && "Execute Deposit_"}
                        {depositStatus === "approving" && "Approving USDC..."}
                        {depositStatus === "depositing" && "Confirming Deposit..."}
                        {depositStatus === "success" && "Deposit Confirmed ✓"}
                        {depositStatus === "error" && "Failed — Try Again"}
                  </button>
                ) : (
                  <button onClick={() => connect()} className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_0_30px_rgba(173,70,255,0.2)] flex items-center justify-center gap-3">
                      <Wallet size={18} /> Connect Wallet to Deposit
                  </button>
                )}
            </div>

            {/* Token Roadmap Card */}
            <div className="terminal-card p-10 bg-gradient-to-br from-black to-[#05000a] border-primary/30 relative overflow-hidden group">
                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">WEAVE Token — Q3 2025</h3>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Institutional Staking Rewards</p>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded flex flex-col items-center">
                            <p className="text-[8px] font-black text-white/40 uppercase">Future staker rewards</p>
                            <p className="text-xl font-mono font-bold text-[#0B7B5E] tabular-nums">${parseFloat(position.totalProtocolFees).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
            <div className="terminal-card bg-[#0A0A0A] p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Lock size={20} className="text-white/40" />
                        My Position
                    </h2>
                    {isConnected && <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ad46ff]" />}
                </div>

                {!isConnected ? (
                  <div className="py-12 text-center">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Connect wallet to view portfolio</p>
                  </div>
                ) : positionLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : parseFloat(position.shares) === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <Activity className="mx-auto mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No active position</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Current Value</p>
                        <div className="text-5xl font-mono font-black italic text-white tracking-tighter tabular-nums">
                            ${position.valueUSD}
                        </div>
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                            <TrendingUp size={12} />
                            {position.shares} Shares @ ${position.pricePerShare}
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5">
                         <div className="bg-secondary/5 border border-white/5 p-4 rounded space-y-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/20 uppercase">Withdraw Amount (Shares)</p>
                                <input 
                                    type="number"
                                    value={withdrawShares}
                                    onChange={(e) => setWithdrawShares(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-none outline-none text-2xl font-mono font-bold w-full text-white placeholder:text-white/10"
                                />
                            </div>
                            <button 
                                onClick={() => withdraw(withdrawShares)}
                                className="w-full bg-white text-black py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all"
                            >
                                Execute Withdrawal_
                            </button>
                         </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="terminal-card bg-black p-6 space-y-4 border-dashed opacity-60">
                <div className="flex items-center gap-3 text-white/40">
                    <Activity size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest italic">Live Activity Stream</h3>
                </div>
                <div className="space-y-4">
                    {harvestHistory.map((h, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="w-0.5 h-4 bg-white/10 mt-1" />
                            <p className="text-[10px] font-medium text-white/30 uppercase leading-relaxed">
                                Harvest completed — <span className="text-primary">${h.amountReinvested} reinvested</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
