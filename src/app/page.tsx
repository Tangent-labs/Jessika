'use client';
import CyclePassage from './containers/Cycle/CyclePassage';
import BribesClaiming from './containers/Bribes/BribesClaiming';
import { WalletProvider } from './context/WalletContext';
import NavBar from './containers/NavBar';

export default function Home() {
    return (
        <WalletProvider>
            <NavBar />
            <div className="container mx-auto mt-10">
                <CyclePassage className="mb-5" />

                <BribesClaiming className="mb-5" />
            </div>
        </WalletProvider>
    );
}
