import { Contract, Interface, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import FeeDistributorAbi from '../abi/FeeDistributor.json';
import ERC20Abi from '../abi/ERC20.json';

import { BOOTSTRAPPING_MODULE, VLSDT_FEE_DISTRIBUTORS, VLSDT_MULTISIG } from '../config';

export type ClaimableFee = {
    distributor: string;
    symbol: string;
    decimals: number;
    amount: bigint;
    lastClaimedEpoch: bigint;
};

export async function getVlSdtClaimableFees(
    provider: Provider
): Promise<ClaimableFee[]> {
    return Promise.all(
        VLSDT_FEE_DISTRIBUTORS.map(async ({ address, symbol, decimals }) => {
            const feeDistributor = new Contract(
                address,
                FeeDistributorAbi,
                provider
            );

            const [lastClaimedEpoch, epochDuration]: [bigint, bigint] =
                await Promise.all([
                    feeDistributor.lastClaimedEpoch(VLSDT_MULTISIG),
                    feeDistributor.EPOCH_DURATION(),
                ]);

            // lastClaimedEpoch has already been paid out, so claiming starts at
            // the epoch after it. Passing lastClaimedEpoch itself counts that
            // epoch a second time and over-reports what claim() will transfer.
            const [amount]: [bigint, bigint] = await feeDistributor.claimable(
                VLSDT_MULTISIG,
                lastClaimedEpoch + epochDuration
            );

            return {
                distributor: address,
                symbol,
                decimals,
                amount,
                lastClaimedEpoch,
            };
        })
    );
}

const feeDistributorInterface = new Interface(FeeDistributorAbi);
const er20Interface = new Interface(ERC20Abi);

/**
 * claim() is overloaded on the FeeDistributor, hence the explicit signature. It
 * pays out to the caller, which is the Safe itself once the batch executes.
 */
export function buildDistributeCvgSdt(usdcToSwap: bigint,): MetaTransactionData[] {
    const txs = []

    return txs;
}
