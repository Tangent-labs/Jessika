'use client';

import { useContext, useEffect, useState } from 'react';
import { WalletContext } from '../../context/WalletContext';

export type FeatureToggleAccess = 'checking' | 'disconnected' | 'allowed' | 'denied';

/**
 * Whether the connected wallet may publish banners. Drives what the UI shows; the
 * upload route re-checks server-side, so a forged 'allowed' here buys nothing.
 */
export function useFeatureToggleAccess(): { access: FeatureToggleAccess; address: string | null } {
    const { wallet } = useContext(WalletContext);
    const address = wallet?.accounts[0]?.address ?? null;

    const [access, setAccess] = useState<FeatureToggleAccess>('checking');

    useEffect(() => {
        if (!address) {
            setAccess('disconnected');
            return;
        }

        let cancelled = false;
        setAccess('checking');

        fetch(`/api/feature-toggle/authorized?address=${address}`, { cache: 'no-store' })
            .then((response) => response.json())
            .then((result) => {
                if (!cancelled) setAccess(result.allowed ? 'allowed' : 'denied');
            })
            .catch(() => {
                if (!cancelled) setAccess('denied');
            });

        return () => {
            cancelled = true;
        };
    }, [address]);

    return { access, address };
}
