"use client"

import SafeApiKit from '@safe-global/api-kit';
import Safe, { buildSignatureBytes, Eip1193Provider } from '@safe-global/protocol-kit';
import { MetaTransactionData } from '@safe-global/types-kit';
import { proposeSafeBatchServer } from './safe_server';

export type ProposeSafeBatchParams = {
    provider: Eip1193Provider;
    signerAddress: string;
    safeAddress: string;
    transactions: MetaTransactionData[];
    origin?: string;
};

/**
 * Bundles `transactions` into a single Safe transaction and signs it off-chain
 * with the connected owner. The signed payload is handed to /api/safe/propose,
 * which is where it reaches the Safe Transaction Service: that call needs the
 * API key, so it has to stay on the server. Nothing is sent on-chain here.
 */
export async function proposeSafeBatch({
    provider,
    signerAddress,
    safeAddress,
    transactions,
    origin = 'Jessika',
}: ProposeSafeBatchParams) {
    if (!transactions.length) {
        throw new Error('Nothing to propose, the batch is empty');
    }
    const protocolKit = await Safe.init({
        provider,
        signer: signerAddress,
        safeAddress,
    });

    // The Transaction Service rejects proposals from non-owners, but only after
    // the wallet has already prompted for a signature. Failing here keeps the
    // user from signing something that cannot land.
    if (!(await protocolKit.isOwner(signerAddress))) {
        throw new Error(
            `${signerAddress} is not an owner of the Safe ${safeAddress}`
        );
    }


    const nextNonce = await protocolKit.getNonce();

    const safeTransaction = await protocolKit.createTransaction({
        transactions,
        options: {
            nonce: nextNonce
        }
    });
    const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
    const signature = await protocolKit.signHash(safeTxHash);

    // Call the Server Action
    await proposeSafeBatchServer(
        signerAddress,
        safeAddress,
        safeTransaction.data,
        safeTxHash,
        buildSignatureBytes([signature]),
        origin
    );

    return safeTxHash;
}

// export function safeTransactionUrl(safeAddress: string, safeTxHash: string) {
//     return `https://app.safe.global/transactions/tx?safe=eth:${safeAddress}&id=multisig_${safeAddress}_${safeTxHash}`;
// }
