import { Contract, Interface, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import PauserProxyAbi from '../abi/PauserProxy.json';
import { PAUSER_PROXY, USG_MARKETS } from '../config';

const pauserProxyInterface = new Interface(PauserProxyAbi);
const pauseSettingsAbi = ['function getPausedSettings() view returns (uint64, uint64, uint64)'];

export type PauseFlags = {
    deposit: boolean;
    borrow: boolean;
    leverage: boolean;
};

export type MarketPauseState = {
    address: string;
    name: string;
    marketType: string;
    /** null when getPausedSettings() could not be read, the market is then not actionable. */
    pauses: PauseFlags | null;
};

/**
 * Reads the three pause flags of every market listed in addresses.json. A market
 * whose call fails is kept in the list with a null state rather than dropped, so
 * it stays visible instead of silently disappearing from the card.
 */
export async function getMarketPauseStates(provider: Provider): Promise<MarketPauseState[]> {
    // The markets only exist on mainnet: on any other chain every read below would
    // fail one by one and look like a broken card rather than a wrong network.
    const network = await provider.getNetwork();
    if (network.chainId !== 1n) {
        throw new Error(`Wallet is connected to chain ${network.chainId}, switch it to Ethereum mainnet (1).`);
    }

    return Promise.all(
        USG_MARKETS.map(async (market) => {
            try {
                const contract = new Contract(market.address, pauseSettingsAbi, provider);
                const [deposit, borrow, leverage] = await contract.getPausedSettings();
                return {
                    ...market,
                    pauses: {
                        deposit: deposit !== 0n,
                        borrow: borrow !== 0n,
                        leverage: leverage !== 0n,
                    },
                };
            } catch (error) {
                console.error(`getPausedSettings failed for ${market.name} (${market.address})`, error);
                return { ...market, pauses: null };
            }
        })
    );
}

/**
 * manageMultiPausing() rewrites all three flags of every market it is given, so
 * the flags left alone must be resent with their current on-chain value.
 */
export function buildManageMultiPausingBatch(markets: { address: string; pauses: PauseFlags }[]): MetaTransactionData[] {
    const params = markets.map(({ address, pauses }) => [
        address,
        pauses.deposit ? 1 : 0,
        pauses.borrow ? 1 : 0,
        pauses.leverage ? 1 : 0,
    ]);

    return [
        {
            to: PAUSER_PROXY,
            value: '0',
            data: pauserProxyInterface.encodeFunctionData('manageMultiPausing', [params]),
        },
    ];
}
