'use client';

import { useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletContext } from '../context/WalletContext';
import { cn } from '@/lib/utils';

export const menuItems = [
    { href: '/cycle', label: 'Cycle' },
    { href: '/bribes', label: 'Bribes' },
    { href: '/liquidboost', label: 'LiquidBoost' },
    { href: '/tangent', label: 'USG' },
];

export default function NavBar() {
    const { clickConnectWallet, wallet } = useContext(WalletContext);
    const pathname = usePathname();

    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="border-b border-border px-2 mb-5">
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-10">
                    <Link
                        href="/"
                        className="flex items-center gap-3 text-4xl font-semibold whitespace-nowrap text-primary"
                    >
                        <Image
                            src="/icon.svg"
                            alt=""
                            width={44}
                            height={44}
                            unoptimized
                            priority
                        />
                        Jessika
                    </Link>

                    <ul className="flex items-center gap-6">
                        {menuItems.map(({ href, label }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        'text-lg font-semibold whitespace-nowrap transition-colors hover:text-foreground',
                                        pathname === href
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    className="px-6 py-2 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
                    onClick={clickConnectWallet}
                >
                    {wallet
                        ? truncateAddress(wallet.accounts[0].address)
                        : 'Connect Wallet'}
                </button>
            </div>
        </nav>
    );
}
