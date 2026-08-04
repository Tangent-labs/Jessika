import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'ethers';
import { isFeatureToggleAdmin } from '@/lib/featureToggleAdmins';

export const dynamic = 'force-dynamic';

/**
 * Lets the UI hide what an address cannot use. This is cosmetic only — the real check
 * runs on the upload route, which is what actually holds the API token.
 */
export async function GET(request: NextRequest) {
    const address = request.nextUrl.searchParams.get('address') || '';

    if (!isAddress(address)) {
        return NextResponse.json({ allowed: false });
    }

    return NextResponse.json({ allowed: isFeatureToggleAdmin(address) });
}
