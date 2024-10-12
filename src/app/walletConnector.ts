import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { Provider } from 'ethers';
const MAINNET_RPC_URL = 'https://rpc.ankr.com/eth';

export const wallets = [injectedModule()];
export const onboard = Onboard({
    wallets,
    chains: [
        {
            id: 1,
            token: 'ETH',
            label: 'Ethereum Mainnet',
            rpcUrl: MAINNET_RPC_URL,
        },
    ],
    connect: {
        disableClose: false,
    },
    //   appMetadata
});
export let provider: Provider;
export async function connectedWallets() {
    const wallet = await onboard.connectWallet();
    provider = wallet[0].provider as unknown as Provider;

    return wallet[0];
}
