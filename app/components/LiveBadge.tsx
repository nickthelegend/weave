"use client";

import { motion } from "framer-motion";

interface LiveBadgeProps {
  type?: 'live' | 'est' | 'cached';
  className?: string;
}

export function LiveBadge({ type = 'live', className = "" }: LiveBadgeProps) {
  if (type === 'live') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#0B7B5E]/20 bg-[#0B7B5E]/5 ${className}`}>
        <div className="w-1 h-1 rounded-full bg-[#0B7B5E] animate-pulse" />
        <span className="text-[7px] font-black uppercase text-[#0B7B5E] tracking-widest">Live</span>
      </div>
    );
  }

  if (type === 'est') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 ${className}`}>
        <div className="w-1 h-1 rounded-full bg-primary" />
        <span className="text-[7px] font-black uppercase text-primary tracking-widest">Est.</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 ${className}`}>
      <span className="text-[7px] font-black uppercase text-yellow-500 tracking-widest">⚠️ Cached</span>
    </div>
  );
}
