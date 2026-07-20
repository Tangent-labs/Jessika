import { NextRequest, NextResponse } from 'next/server';
import SafeApiKit from '@safe-global/api-kit';
import { VLSDT_MULTISIG } from '../../../config';

const MAINNET_CHAIN_ID = BigInt(1);

// The Transaction Service already rejects proposals that are not signed by an
// owner, so this only stops the route from being used as a generic proxy that
// spends our API key on Safes that are none of Jessika's business.
const ALLOWED_SAFES = [VLSDT_MULTISIG].map((address) => address.toLowerCase());

export async function POST(request: NextRequest) {
    const apiKey = process.env.SAFE_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'SAFE_KEY is not configured on the server' },
            { status: 500 }
        );
    }

    const {
        safeAddress,
        safeTransactionData,
        safeTxHash,
        senderAddress,
        senderSignature,
        origin,
    } = await request.json();

    if (
        !safeAddress ||
        !safeTransactionData ||
        !safeTxHash ||
        !senderAddress ||
        !senderSignature
    ) {
        return NextResponse.json(
            { error: 'Incomplete proposal payload' },
            { status: 400 }
        );
    }

    if (!ALLOWED_SAFES.includes(String(safeAddress).toLowerCase())) {
        return NextResponse.json(
            { error: `Safe ${safeAddress} is not allowed` },
            { status: 403 }
        );
    }

    try {
        const apiKit = new SafeApiKit({ chainId: MAINNET_CHAIN_ID, apiKey });
        await apiKit.proposeTransaction({
            safeAddress,
            safeTransactionData,
            safeTxHash,
            senderAddress,
            senderSignature,
            origin,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Safe Transaction Service rejected the proposal',
            },
            { status: 502 }
        );
    }

    return NextResponse.json({ safeTxHash });
}
