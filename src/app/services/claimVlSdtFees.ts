import { AddressLike, Contract, Interface, parseUnits, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import FeeDistributorAbi from '../abi/FeeDistributor.json';
import ERC20Abi from '../abi/ERC20.json';
import StableSwapAbi from '../abi/StableSwapLP.json';

import { BOOTSTRAPPING_MODULE, VLSDT_FEE_DISTRIBUTORS, VLSDT_MULTISIG } from '../config';
import { getQuoteAndRoute } from './enso';

export const ENSO_ROUTER = "0xF75584eF6673aD213a685a1B58Cc0330B8eA22Cf"
const cvgSDT_BUFFER = "0x98C04163723134b0a4C364A72A71e620b58aB3f1"
const cvgSDT_SDT_LP = "0xc6628f00f29cc89a87bbee7554c4725611200fd7"
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
const SDT = "0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f"

export type ClaimableFee = {
    distributor: string;
    symbol: string;
    decimals: number;
    amount: bigint;
    lastClaimedEpoch: bigint;
};

export type EnsoRoute = {
    quote: bigint;
    minAmountOut: bigint
    priceImpact: number;
    to: AddressLike;
    data: string;
}

export async function getCvgSDTData(
    provider: Provider,
    slippagePercentage: number = 1
) {

    const [usdc, claimedSdt] = await Promise.all(
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
    const usdcToSdtRoute = await getSDTQuote(usdc.amount, slippagePercentage)
    const minSdtOut = usdcToSdtRoute.minAmountOut

    // SDT the multisig already holds before this run. It gets swapped along with
    // the freshly claimed fees, so it has to be part of the quoted total.
    const sdtBalance: bigint = await new Contract(SDT, ERC20Abi, provider).balanceOf(VLSDT_MULTISIG)

    // The Enso leg is quoted at its minimum, not its expected output: that is
    // the only amount the batch is guaranteed to hold when the swap executes.
    const totalSdtAmount = minSdtOut + claimedSdt.amount + sdtBalance
    const cvgSDTAmout = await getCvgSDTQuote(totalSdtAmount, provider, slippagePercentage)

    return { claimable: [usdc, claimedSdt], ensoRoute: usdcToSdtRoute, cvgSDTAmout, sdtBalance, totalSdtAmount }
}



const feeDistributorInterface = new Interface(FeeDistributorAbi);
const er20Interface = new Interface(ERC20Abi);
const StableSwapInterface = new Interface(StableSwapAbi);

/**
 * claim() is overloaded on the FeeDistributor, hence the explicit signature. It
 * pays out to the caller, which is the Safe itself once the batch executes.
 */
export type CvgSdtQuote = {
    quote: bigint;
    minAmountOut: bigint;
};

export function buildVlSdtFeesClaimBatch(claimableFee: ClaimableFee[], USDC_To_SDT: EnsoRoute, SDT_To_cvgSDT: CvgSdtQuote, sdtBalance: bigint = BigInt(0)): MetaTransactionData[] {

    const usdcAmount = claimableFee[0].amount

    const sdtAmount = claimableFee[1].amount

    // Mirrors getCvgSDTData: the Enso leg counts at its guaranteed minimum, so
    // the exchange cannot ask for more SDT than the Safe will actually hold.
    const totalSDT = sdtAmount + USDC_To_SDT.minAmountOut + sdtBalance

    // Dump USDC for SDT
    const txs = VLSDT_FEE_DISTRIBUTORS.map(({ address }) => ({
        to: address,
        value: '0',
        data: feeDistributorInterface.encodeFunctionData('claim()'),
    })
    );

    // Approve USDC to be spent by Enso router 
    txs.push({
        to: USDC,
        value: '0',
        data: er20Interface.encodeFunctionData('approve', [ENSO_ROUTER, usdcAmount]),
    });

    // Swap USDC to SDT via enso
    txs.push({
        to: USDC_To_SDT.to.toString(),
        value: '0',
        data: USDC_To_SDT.data,
    });

    // Approve SDT to be spent by cvgSDT LP
    txs.push({
        to: SDT,
        value: '0',
        data: er20Interface.encodeFunctionData('approve', [cvgSDT_SDT_LP, totalSDT]),
    });

    // Convert SDT to cvgSDT and send to cvgSDTBuffer
    txs.push({
        to: cvgSDT_SDT_LP,
        value: '0',
        // min_dy is the slippage guard the card advertises. Leaving it at 0
        // would let the swap execute at any price once the owners sign.
        data: StableSwapInterface.encodeFunctionData('exchange(int128,int128,uint256,uint256,address)', [0, 1, totalSDT, SDT_To_cvgSDT.minAmountOut, cvgSDT_BUFFER]),
    });

    return txs;
}


export async function getSDTQuote(usdcAmount: bigint, slippagePercentage: number = 1): Promise<EnsoRoute> {
    const quote = await getQuoteAndRoute(usdcAmount.toString(), SDT, USDC, "0", VLSDT_MULTISIG, VLSDT_MULTISIG)
    const quoteAmount = quote.quote
    const minAmountOut = computedMinAmountOut(quoteAmount, slippagePercentage)
    const route = await getQuoteAndRoute(usdcAmount.toString(), SDT, USDC, minAmountOut.toString(), VLSDT_MULTISIG, VLSDT_MULTISIG)
    return { ...route, minAmountOut: minAmountOut }
}

export async function getCvgSDTQuote(sdtAmount: bigint, provider: Provider, slippagePercentage: number = 1) {
    const cvgSDTLp = new Contract(cvgSDT_SDT_LP, StableSwapAbi, provider);

    const quoteAmount = await cvgSDTLp.get_dy(0, 1, sdtAmount)
    const minAmountOut = computedMinAmountOut(quoteAmount, slippagePercentage)
    return { quote: quoteAmount as bigint, minAmountOut: minAmountOut }
}




export const computedMinAmountOut = (value: bigint | string, slippagePercentage: number) => {
    const percentageToString = (slippagePercentage / 100).toFixed(4)
    const mul = parseUnits("1", 5) - parseUnits(percentageToString, 5)
    return (BigInt(value) * mul) / parseUnits("1", 5)
}