import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';
import { BannerUpload, SIGNATURE_MAX_AGE_MS, buildUploadMessage, hashBanners } from '@/lib/featureToggleAuth';
import { isFeatureToggleAdmin } from '@/lib/featureToggleAdmins';

// Proxied through the server so the API's secret token never reaches the browser.
const API_URL = process.env.TANGENT_API_URL || 'http://localhost:3100';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch(`${API_URL}/feature-banners`, { cache: 'no-store' });

        if (!response.ok) {
            return NextResponse.json({ error: `API returned ${response.status}` }, { status: 502 });
        }

        const banners = await response.json();
        return NextResponse.json({ banners });
    } catch {
        return NextResponse.json({ error: `Could not reach the API at ${API_URL}` }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const token = process.env.TANGENT_API_SECRET_TOKEN;
    if (!token) {
        return NextResponse.json({ error: 'TANGENT_API_SECRET_TOKEN is not configured on the server' }, { status: 500 });
    }

    const body = await request.json();

    // Authorisation lives here rather than in the page: this route holds the API
    // token, so it is what an attacker would call directly.
    const publisher = verifyUploadSignature(body);
    if ('error' in publisher) {
        return NextResponse.json({ error: publisher.error }, { status: 401 });
    }

    try {
        const response = await fetch(`${API_URL}/feature-banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ banners: body.banners }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json({ error: result.error || `API returned ${response.status}` }, { status: response.status });
        }

        console.info(`Feature banners published by ${publisher.address}: ${body.banners.length} slot(s)`);

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: `Could not reach the API at ${API_URL}` }, { status: 502 });
    }
}

/** Recovers the signer, checks it against the allowlist, and ties it to this exact payload. */
function verifyUploadSignature(body: unknown): { address: string } | { error: string } {
    const { banners, signature, issuedAt } = (body || {}) as {
        banners?: BannerUpload[];
        signature?: string;
        issuedAt?: string;
    };

    if (!Array.isArray(banners) || typeof signature !== 'string' || typeof issuedAt !== 'string') {
        return { error: 'Unauthorized: missing signature' };
    }

    const age = Date.now() - Date.parse(issuedAt);
    if (Number.isNaN(age) || Math.abs(age) > SIGNATURE_MAX_AGE_MS) {
        return { error: 'Unauthorized: signature has expired, try again' };
    }

    let address: string;
    try {
        // Hashed from the received banners, so altering them invalidates the signature.
        address = verifyMessage(buildUploadMessage(hashBanners(banners), issuedAt), signature);
    } catch {
        return { error: 'Unauthorized: signature could not be verified' };
    }

    if (!isFeatureToggleAdmin(address)) {
        return { error: `Unauthorized: ${address} is not allowed to publish banners` };
    }

    return { address };
}
