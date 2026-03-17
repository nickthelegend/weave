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
  ExternalLink
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
  const { deposit, withdraw, position, stats, getUSDCBalance, fetchPosition } = useVault();
  
  const harvestHistory = useQuery(api.functions.getHarvestHistory, { limit: 5 }) || [];
  const globalStats = useQuery(api.functions.getGlobalStats);

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
  }, [isConnected, address]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('weave_faucet_banner_dismissed', 'true');
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setDepositStatus("approving");
    setErrorMsg("");
    
    try {
        // Step 1 & 2: Approve and Deposit
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
        console.error(e);
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
        const interval = setInterval(() => {
            const now = Date.now();
            // In a real scenario, yield grows by PPS. Here we simulate continuous compounding.
            const pps = parseFloat(position.pricePerShare);
            const shares = parseFloat(position.shares);
            setLiveValue(shares * pps);
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [position]);

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

      {/* Real-time Global Stats Bar */}
      <div className="mb-12 flex flex-wrap gap-8 items-center justify-center py-4 border-y border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Protocol TVL</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(stats.totalDeposited).toLocaleString()}</span>
            <LiveBadge />
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Yield Generated</span>
            <span className="text-sm font-mono font-bold text-[#0B7B5E] tabular-nums">${parseFloat(stats.totalYieldGenerated).toLocaleString()}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Protocol Fees</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">${parseFloat(stats.totalProtocolFeesAccrued).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Deposit & Token Card */}
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
                          <button onClick={() => setAmount(token === "INIT" ? balances.init : balances.usdc)} className="text-primary hover:underline ml-1">MAX</button>
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

                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-primary fill-current" />
                            <div>
                                <p className="text-[10px] font-black uppercase italic text-primary tracking-widest">Auto-Compound Active</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase">Optimizing yield across Initia ecosystem</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Projected APY</p>
                            <LiveBadge type="est" />
                        </div>
                        <p className="text-2xl font-mono font-black italic text-primary tabular-nums">{apr.toFixed(1)}%</p>
                    </div>
                    <div className="bg-secondary p-4 border border-white/5 rounded space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Monthly Earn</p>
                        <p className="text-2xl font-mono font-black italic text-white tabular-nums">${(parseFloat(amount || "0") * (apr/1200)).toFixed(2)}</p>
                    </div>
                </div>

                {isConnected ? (
                  <div className="space-y-4">
                    <button 
                        onClick={handleDeposit}
                        disabled={depositStatus === "approving" || depositStatus === "depositing" || !amount}
                        className={`w-full py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3
                            ${depositStatus === "success" ? "bg-[#0B7B5E] text-white" : "bg-primary text-white hover:scale-[1.02] shadow-[0_0_30px_rgba(173,70,255,0.2)]"}
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
                    
                    {depositStatus === "success" && (
                        <a 
                            href={`https://scan.testnet.initia.xyz/tx/${lastTxHash}`} 
                            target="_blank" 
                            className="block text-center text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                            View Transaction on InitiaScan <ExternalLink size={10} className="inline ml-1" />
                        </a>
                    )}

                    {errorMsg && (
                        <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest italic">{errorMsg}</p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => connect()} className="w-full bg-primary py-6 rounded-sm font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_0_30px_rgba(173,70,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      <Wallet size={18} /> Connect Wallet to Deposit
                  </button>
                )}
            </div>

            {/* Token Roadmap Card */}
            <div className="terminal-card p-10 bg-gradient-to-br from-black to-[#05000a] border-primary/30 relative overflow-hidden group">
                <div className="relative z-10 space-y-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">WEAVE Token — Q3 2025</h3>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Governance & Reward Distribution</p>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded flex flex-col items-center">
                            <p className="text-[9px] font-black text-white/40 uppercase">Fees Accrued</p>
                            <p className="text-xl font-mono font-bold text-[#0B7B5E] tabular-nums">${parseFloat(stats.totalProtocolFeesAccrued).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/20 uppercase">LP Rewards</p>
                            <p className="text-xs font-bold">40%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/20 uppercase">Team (2yr)</p>
                            <p className="text-xs font-bold">30%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/20 uppercase">Treasury</p>
                            <p className="text-xs font-bold">20%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-white/20 uppercase">Airdrop</p>
                            <p className="text-xs font-bold text-primary">10%</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <div className="w-full relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                                type="email" 
                                placeholder="Enter address for priority airdrop..."
                                className="w-full bg-white/5 border border-white/10 rounded p-4 pl-12 text-xs outline-none focus:border-primary/40 transition-all placeholder:text-white/10"
                            />
                        </div>
                        <button className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                            Join_Waitlist
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Col: Portfolio & Feed */}
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
                ) : parseFloat(position.shares) === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Activity className="mx-auto text-white/10" size={32} />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No active position detected</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Current Value</p>
                            <LiveBadge />
                        </div>
                        <div className="text-5xl font-mono font-black italic text-white tracking-tighter tabular-nums">
                            ${parseFloat(position.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                            <TrendingUp size={12} />
                            {position.shares} Shares @ ${parseFloat(position.pricePerShare).toFixed(4)}
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="bg-secondary/5 border border-white/5 p-4 rounded space-y-2">
                                <p className="text-[9px] font-black text-white/20 uppercase">Withdraw Shares</p>
                                <input 
                                    type="number"
                                    value={withdrawShares}
                                    onChange={(e) => setWithdrawShares(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-none outline-none text-2xl font-mono font-bold w-full text-white placeholder:text-white/10"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase">
                                    <span>You Receive: ~${(parseFloat(withdrawShares || "0") * parseFloat(position.pricePerShare)).toFixed(2)} USDC</span>
                                    <button onClick={() => setWithdrawShares(position.shares)} className="text-primary hover:underline">ALL</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleWithdraw}
                                disabled={vaultLoading || !withdrawShares}
                                className="flex-grow bg-white text-black py-4 rounded-sm font-black uppercase italic text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                            >
                                {vaultLoading ? 'Processing...' : 'Withdraw_'}
                            </button>
                        </div>
                    </div>
                  </>
                )}
            </div>

            <div className="terminal-card bg-black p-6 space-y-4 border-dashed opacity-60">
                <div className="flex items-center gap-3 text-white/40">
                    <Activity size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest italic">Live Activity Stream</h3>
                </div>
                <div className="space-y-4">
                    {harvestHistory.length > 0 ? harvestHistory.map((h, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                            <div className="w-0.5 h-4 bg-white/10 group-hover:bg-primary transition-colors mt-1" />
                            <p className="text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors uppercase leading-relaxed">
                                Harvest completed — <span className="text-primary">${h.amountReinvested} reinvested</span>
                                <span className="text-[9px] opacity-40 italic block mt-1">{new Date(h.timestamp).toLocaleTimeString()} // RE-COMPOUND</span>
                            </p>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <History size={24} className="mb-2 text-white/5" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Scanning blockchain...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}
