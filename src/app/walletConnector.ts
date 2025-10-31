import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
const MAINNET_RPC_URL = 'https://rpc.flashbots.net/fast';

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
