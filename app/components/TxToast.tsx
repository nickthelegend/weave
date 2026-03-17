"use client";

import React from 'react';
import { ExternalLink, CheckCircle2, Loader2, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const showTxToast = {
  approve: () => {
    return toast.loading(
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 animate-pulse text-primary" />
        <span className="text-[10px] font-black uppercase tracking-wider">Approving token spend...</span>
      </div>,
      { id: "tx-status" }
    );
  },
  pending: () => {
    return toast.loading(
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-wider">Waiting for confirmation...</span>
      </div>,
      { id: "tx-status" }
    );
  },
  success: (txHash: string) => {
    return toast.success(
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#0B7B5E]" />
          <span className="text-[10px] font-black uppercase tracking-wider">Success! ✓</span>
        </div>
        <a 
          href={`https://scan.testnet.initia.xyz/tx/${txHash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[8px] font-bold text-primary hover:underline uppercase tracking-widest"
        >
          View on InitiaScan →
        </a>
      </div>,
      { id: "tx-status", duration: 8000 }
    );
  },
  error: (error: any) => {
    let message = "Transaction failed";
    if (error?.message?.includes("user rejected")) message = "Transaction cancelled";
    else if (error?.message?.includes("insufficient balance")) message = "Insufficient funds";
    
    return toast.error(
      <div className="flex items-center gap-3">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-[10px] font-black uppercase tracking-wider">{message}</span>
      </div>,
      { id: "tx-status", duration: Infinity }
    );
  }
};
