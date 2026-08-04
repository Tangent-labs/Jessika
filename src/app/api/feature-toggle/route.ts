import { NextRequest, NextResponse } from 'next/server';

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

    try {
        const response = await fetch(`${API_URL}/feature-banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json({ error: result.error || `API returned ${response.status}` }, { status: response.status });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: `Could not reach the API at ${API_URL}` }, { status: 502 });
    }
}
