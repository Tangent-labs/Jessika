'use server';

import SafeApiKit from '@safe-global/api-kit';
import { MetaTransactionData } from '@safe-global/types-kit';
import { getAddress } from 'ethers';

export async function proposeSafeBatchServer(
    signerAddress: string,
    safeAddress: string,
    safeTransactionData: any,
    safeTxHash: string,
    senderSignature: string,
    origin = 'Jessika'
) {
    const apiKit = new SafeApiKit({
        chainId: 1n,                    // ← change per network
        apiKey: process.env.SAFE_KEY,   // private key, no NEXT_PUBLIC_
    });
    try {
        await apiKit.proposeTransaction({
            safeAddress: getAddress(safeAddress),
            safeTransactionData,
            safeTxHash,
            senderAddress: getAddress(signerAddress),
            senderSignature,
            origin,
        });

        return { success: true, safeTxHash };
    } catch (error: any) {
        const responseData = error.response?.data;
        console.error("=== FULL SAFE ERROR ===");
        console.error("Status:", error.response?.status);
        console.error("Error Body:", JSON.stringify(responseData, null, 2));
        console.error("Raw Error:", error);

        throw new Error(
            responseData?.message ||
            responseData?.detail ||
            responseData?.error ||
            "Unprocessable Content - see console"
        );
    }
}