import { useContext } from 'react';
import { WalletContext } from '../context/WalletContext';

export default function NavBar() {
    const { clickConnectWallet, wallet } = useContext(WalletContext);

    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
    return (
        <nav className="border-gray-200 px-2 mb-10">
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <span className="self-center text-4xl font-semibold whitespace-nowrap">
                    Jessika
                </span>
                <div className="flex">
                    <div className=" text-2xl font-semibold whitespace-nowrap">
                        LiquidBoost
                    </div>
                    <div className=" text-2xl font-semibold whitespace-nowrap">
                        Tangent
                    </div>
                </div>

                <button
                    className={`px-6 py-2 rounded-xl font-semibold  shadow-md hover:shadow-lg`}
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
