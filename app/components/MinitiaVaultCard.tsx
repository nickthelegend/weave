"use client";

import { motion } from "framer-motion";
import { Globe, Lock, ShieldCheck, ChevronRight, Zap, Target } from "lucide-react";
import { LiveBadge } from "@/app/components/LiveBadge";

interface MinitiaVaultProps {
  name: string;
  apy: string;
  risk: "Low" | "Medium" | "High";
  status: "active" | "soon" | "pending";
  description: string;
}

export function MinitiaVaultCard({ name, apy, risk, status, description }: MinitiaVaultProps) {
  const riskColor = {
    Low: "text-[#22c55e]",
    Medium: "text-yellow-500",
    High: "text-red-500"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="terminal-card bg-black/40 overflow-hidden group border-dashed"
    >
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">{name}</h3>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Cross-Minitia Protocol</p>
            </div>
          </div>
          
          {status === 'active' ? (
            <div className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Active</div>
          ) : status === 'pending' ? (
            <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Pending Vote</div>
          ) : (
            <div className="bg-white/5 text-white/20 border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Coming Soon</div>
          )}
        </div>

        <p className="text-[10px] text-white/40 uppercase leading-relaxed font-medium">
          {description}
        </p>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Target APY</p>
            <p className="text-xl font-mono font-black italic text-primary">{apy}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-white/20 uppercase italic tracking-widest">Risk Factor</p>
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} className={riskColor[risk]} />
              <span className={`text-xs font-black uppercase italic ${riskColor[risk]}`}>{risk}</span>
            </div>
          </div>
        </div>

        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-sm font-black uppercase italic text-[10px] tracking-[0.2em] text-white/40 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all flex items-center justify-center gap-3">
          {status === 'active' ? 'Enter Vault' : 'Vote to Activate'}
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
