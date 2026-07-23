import { Contract, Interface, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import ERC20Abi from '../abi/ERC20.json';
import { FEE_TRESO_MULTI, sUSG, USG } from '../config';

const er20Interface = new Interface(ERC20Abi);
const sUsgInterface = new Interface(['function process_report(address strategy) returns (uint256, uint256)']);

export async function getUsgBalance(provider: Provider): Promise<bigint> {
    const usg = new Contract(USG, ERC20Abi, provider);
    return usg.balanceOf(FEE_TRESO_MULTI);
}

/**
 * sUSG streams its own token as the strategy, so process_report is called
 * with its own address rather than a separate strategy contract.
 */
export function buildStreamUsgBatch(amount: bigint): MetaTransactionData[] {
    return [
        {
            to: USG,
            value: '0',
            data: er20Interface.encodeFunctionData('transfer', [sUSG, amount]),
        },
        {
            to: sUSG,
            value: '0',
            data: sUsgInterface.encodeFunctionData('process_report', [sUSG]),
        },
    ];
}
