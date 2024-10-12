import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { onboard } from '../walletConnector';
import { WalletState } from '@web3-onboard/core';
import { Signer } from 'ethers';
import { BrowserProvider } from 'ethers';

// Création du contexte
export const WalletContext = createContext<WalletContextType>({
    wallet: null,
    signer: null,
    connectWallet() {},
    disconnectWallet() {},
});

interface WalletContextType {
    wallet: WalletState | null;
    signer: Signer | null;
    connectWallet: () => void;
    disconnectWallet: () => void;
}

// Fournisseur de contexte (AuthProvider)
export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [wallet, setWallet] = useState<WalletState | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);

    useEffect(() => {
        connectWallet();
    }, []);

    const connectWallet = async () => {
        const wallets = await onboard.connectWallet();
        console.log('en coule');
        if (wallets.length > 0) {
            setWallet(wallets[0]);
            const ethersProvider = new BrowserProvider(wallets[0]!.provider);
            const signer = await ethersProvider.getSigner();
            setSigner(signer);
        }
    };

    const disconnectWallet = async () => {
        await onboard.disconnectWallet({ label: wallet!.label });
        setWallet(null);
    };
    const returned = {
        wallet,
        signer,
        connectWallet,
        disconnectWallet,
    };
    return (
        <WalletContext.Provider value={returned}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = (): WalletContextType => {
    return useContext(WalletContext);
};
