"use client";

import { useState } from 'react';
import {
    createPublicClient,
    http,
    parseUnits,
    Address,
} from 'viem';
import { minievm } from '@/lib/contractConfig';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { useWeaveWallet } from './useWeaveWallet';
import { showTxToast } from '@/app/components/TxToast';

export function useGovernance() {
    const { address, getWalletClient, isConnected } = useWeaveWallet();
    const [loading, setLoading] = useState(false);

    const publicClient = createPublicClient({
        chain: minievm as any,
        transport: http()
    });

    const createLock = async (amount: string, durationInYears: number) => {
        if (!isConnected || !address) {
            showTxToast.error(new Error("Please connect your wallet first"));
            return;
        }

        setLoading(true);
        try {
            const walletClient = await getWalletClient();
            const parsedAmount = parseUnits(amount, 18); // WEAVE has 18 decimals
            const unlockTime = BigInt(Math.floor(Date.now() / 1000) + durationInYears * 365 * 24 * 60 * 60);

            // 1. Approve veWEAVE to spend WEAVE
            // @ts-ignore
            const approveToastId = showTxToast.pending("Approving WEAVE...");
            const { request: approveReq } = await publicClient.simulateContract({
                account: address as Address,
                address: CONTRACT_ADDRESSES.weaveToken,
                abi: ABIS.mockERC20,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.veWeave, parsedAmount]
            });
            const approveHash = await walletClient.writeContract(approveReq);
            await publicClient.waitForTransactionReceipt({ hash: approveHash });

            // 2. Create Lock
            // @ts-ignore
            const lockToastId = showTxToast.pending("Creating veWEAVE Lock...");
            const { request: lockReq } = await publicClient.simulateContract({
                account: address as Address,
                address: CONTRACT_ADDRESSES.veWeave,
                abi: ABIS.mockERC20, // Temporarily using mockERC20 ABI for testing if real ABI not found
                functionName: 'create_lock',
                args: [parsedAmount, unlockTime]
            });
            const lockHash = await walletClient.writeContract(lockReq);
            await publicClient.waitForTransactionReceipt({ hash: lockHash });

            // @ts-ignore
            showTxToast.success(lockHash, `Successfully locked ${amount} WEAVE!`);
        } catch (error) {
            console.error("Lock error:", error);
            showTxToast.error(error);
        } finally {
            setLoading(false);
        }
    };

    const vote = async (poolAddresses: string[], weights: number[]) => {
        if (!isConnected || !address) return;
        setLoading(true);
        try {
            const walletClient = await getWalletClient();

            // @ts-ignore
            const voteToastId = showTxToast.pending("Submitting Gauge Votes...");
            const { request } = await publicClient.simulateContract({
                account: address as Address,
                address: CONTRACT_ADDRESSES.weaveGauge,
                abi: ABIS.mockERC20, // Need real Gauge ABI here
                functionName: 'vote',
                args: [poolAddresses, weights.map(w => BigInt(w))]
            });
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            // @ts-ignore
            showTxToast.success(hash, "Votes submitted successfully!");
        } catch (error) {
            showTxToast.error(error);
        } finally {
            setLoading(false);
        }
    };

    return {
        createLock,
        vote,
        loading
    };
}
