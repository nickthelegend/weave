"use client";

import React from 'react';
import { ExternalLink, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const showTxToast = {
  pending: (message: string = "Transaction pending...") => {
    return toast.loading(
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-wider">{message}</span>
      </div>
    );
  },
  success: (txHash: string, message: string = "Success!") => {
    return toast.success(
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#0B7B5E]" />
          <span className="text-[10px] font-black uppercase tracking-wider">{message}</span>
        </div>
        <a 
          href={`https://scan.testnet.initia.xyz/tx/${txHash}`} 
          target="_blank" 
          className="flex items-center gap-1 text-[8px] font-bold text-primary hover:underline uppercase"
        >
          View on InitiaScan <ExternalLink size={10} />
        </a>
      </div>
    );
  },
  error: (error: any) => {
    let message = "Transaction failed";
    if (error?.message?.includes("user rejected")) message = "Transaction cancelled";
    else if (error?.message?.includes("insufficient allowance")) message = "Please approve USDC first";
    else if (error?.message?.includes("revert")) message = "Execution reverted — check balance";

    return toast.error(
      <div className="flex items-center gap-3">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-[10px] font-black uppercase tracking-wider">{message}</span>
      </div>
    );
  }
};
