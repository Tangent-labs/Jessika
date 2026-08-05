import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.TANGENT_API_URL || 'http://localhost:3100';

export const dynamic = 'force-dynamic';

// Proxied rather than fetched straight from the browser so the form works even
// when the API is only reachable from the server.
export async function GET(request: NextRequest, { params }: { params: { slot: string } }) {
    const version = request.nextUrl.searchParams.get('v');
    const url = `${API_URL}/feature-banners/${params.slot}/image${version ? `?v=${version}` : ''}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            return NextResponse.json({ error: `API returned ${response.status}` }, { status: response.status });
        }

        return new NextResponse(await response.arrayBuffer(), {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
                'Cache-Control': 'no-store',
            },
        });
    } catch {
        return NextResponse.json({ error: `Could not reach the API at ${API_URL}` }, { status: 502 });
    }
}
