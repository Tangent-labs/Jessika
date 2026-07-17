'use client';

import { WalletProvider } from './context/WalletContext';
import NavBar from './containers/NavBar';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WalletProvider>
            <NavBar />
            <main className="container mx-auto mt-10">{children}</main>
        </WalletProvider>
    );
}
