import { Contract, Interface, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import ERC20Abi from '../abi/ERC20.json';
import { FEE_TRESO_MULTI, USG, USG_FEE_TOKENS } from '../config';
import { computedMinAmountOut, ENSO_ROUTER } from './claimVlSdtFees';
import { getQuoteAndRoute } from './enso';

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

export type FeeToken = (typeof USG_FEE_TOKENS)[number];
export type SelectedFeeToken = FeeToken & { balance: bigint };

export type FeeSwapRoute = {
    token: SelectedFeeToken;
    quote: bigint;
    minAmountOut: bigint;
    priceImpact: number;
    to: string;
    data: string;
};

export type EnsoQuote = {
    quote: bigint;
    minAmountOut: bigint;
    priceImpact: number;
    to: string;
    data: string;
};

const erc20Interface = new Interface(ERC20Abi);

export async function getFeeBalances(provider: Provider): Promise<SelectedFeeToken[]> {
    return Promise.all(
        USG_FEE_TOKENS.map(async (token) => {
            const erc20 = new Contract(token.address, ERC20Abi, provider);
            const balance: bigint = await erc20.balanceOf(FEE_TRESO_MULTI);
            return { ...token, balance };
        })
    );
}

/** One Enso quote per selected token, dumped into USDC. */
export async function getFeeSwapRoutesToUsdc(selected: SelectedFeeToken[], slippagePercentage: number): Promise<FeeSwapRoute[]> {
    return Promise.all(
        selected.map(async (token) => {
            const quote = await getQuoteAndRoute(token.balance.toString(), USDC, token.address, '0', FEE_TRESO_MULTI, FEE_TRESO_MULTI);
            const minAmountOut = computedMinAmountOut(quote.quote, slippagePercentage);
            const route = await getQuoteAndRoute(token.balance.toString(), USDC, token.address, minAmountOut.toString(), FEE_TRESO_MULTI, FEE_TRESO_MULTI);
            return {
                token,
                quote: route.quote,
                minAmountOut,
                priceImpact: route.priceImpact,
                to: route.to?.toString() ?? '',
                data: route.data ?? '',
            };
        })
    );
}

export async function getUsdcToUsgQuote(usdcAmount: bigint, slippagePercentage: number): Promise<EnsoQuote> {
    const quote = await getQuoteAndRoute(usdcAmount.toString(), USG, USDC, '0', FEE_TRESO_MULTI, FEE_TRESO_MULTI);
    const minAmountOut = computedMinAmountOut(quote.quote, slippagePercentage);
    const route = await getQuoteAndRoute(usdcAmount.toString(), USG, USDC, minAmountOut.toString(), FEE_TRESO_MULTI, FEE_TRESO_MULTI);
    return {
        quote: route.quote,
        minAmountOut,
        priceImpact: route.priceImpact,
        to: route.to?.toString() ?? '',
        data: route.data ?? '',
    };
}

export function buildDumpFeesBatch(selected: SelectedFeeToken[], swapRoutes: FeeSwapRoute[], usdcToUsg: EnsoQuote, totalUsdc: bigint): MetaTransactionData[] {
    const txs: MetaTransactionData[] = [];

    // Approve + swap every selected fee token into USDC via Enso.
    for (const route of swapRoutes) {
        txs.push({
            to: route.token.address,
            value: '0',
            data: erc20Interface.encodeFunctionData('approve', [ENSO_ROUTER, route.token.balance]),
        });
        txs.push({
            to: route.to,
            value: '0',
            data: route.data,
        });
    }

    // Approve + swap the accumulated USDC into USG via Enso.
    txs.push({
        to: USDC,
        value: '0',
        data: erc20Interface.encodeFunctionData('approve', [ENSO_ROUTER, totalUsdc]),
    });
    txs.push({
        to: usdcToUsg.to,
        value: '0',
        data: usdcToUsg.data,
    });

    return txs;
}
