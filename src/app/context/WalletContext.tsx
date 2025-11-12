import React, { createContext, useContext, useEffect, useState } from 'react';
import { onboard } from '../walletConnector';
import { WalletState } from '@web3-onboard/core';
import { BrowserProvider, Signer } from 'ethers';

interface WalletContextType {
    wallet: WalletState | null;
    signer: Signer | null;
    provider: BrowserProvider | null;
    connectWallet: () => void;
    clickConnectWallet: () => void;
    disconnectWallet: () => void;
}

export const WalletContext = createContext<WalletContextType>({
    wallet: null,
    signer: null,
    provider: null,
    connectWallet() {},
    clickConnectWallet() {},
    disconnectWallet() {},
});

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [wallet, setWallet] = useState<WalletState | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);

    async function clickConnectWallet() {
        connectWallet();
    }

    // --- AUTO RECONNECT ---
    useEffect(() => {
        const reconnect = async () => {
            const connectedWallets = JSON.parse(
                window.localStorage.getItem('connectedWallets') || '[]'
            );

            if (connectedWallets.length > 0) {
                const wallets = await onboard.connectWallet({
                    autoSelect: {
                        label: connectedWallets[0],
                        disableModals: true,
                    },
                });

                if (wallets && wallets.length > 0) {
                    const connectedWallet = wallets[0];
                    setWallet(connectedWallet);

                    const ethersProvider = new BrowserProvider(
                        connectedWallet.provider
                    );
                    const signer = await ethersProvider.getSigner();
                    setSigner(signer);
                    setProvider(ethersProvider);
                }
            }
        };

        reconnect();
    }, []);

    // --- CONNECT ---
    const connectWallet = async () => {
        const wallets = await onboard.connectWallet();
        if (wallets.length > 0) {
            const connectedWallet = wallets[0];
            setWallet(connectedWallet);

            const ethersProvider = new BrowserProvider(
                connectedWallet.provider
            );
            const signer = await ethersProvider.getSigner();
            setSigner(signer);
            setProvider(ethersProvider);

            window.localStorage.setItem(
                'connectedWallets',
                JSON.stringify(wallets.map((w) => w.label))
            );
        }
    };

    // --- DISCONNECT ---
    const disconnectWallet = async () => {
        if (wallet) {
            await onboard.disconnectWallet({ label: wallet.label });
            window.localStorage.removeItem('connectedWallets');
            setWallet(null);
            setSigner(null);
            setProvider(null);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                wallet,
                signer,
                provider,
                clickConnectWallet,
                connectWallet,
                disconnectWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
