import { Contract, Interface, Provider } from 'ethers';
import { MetaTransactionData } from '@safe-global/types-kit';
import ERC20Abi from '../abi/ERC20.json';
import cvgCVXAbi from '../abi/CvgCVX.json';

import StableSwapAbi from '../abi/StableSwapLP.json';

import { CVGCVX_CONTRACT, CVGCVX_FEE_TOKENS, CVX, CVX_CVGCVX_LP, VLCVX_MULTISIG } from '../config';
import { computedMinAmountOut, ENSO_ROUTER } from './claimVlSdtFees';
import { getQuoteAndRoute } from './enso';

export type CvgCvxFeeToken = (typeof CVGCVX_FEE_TOKENS)[number];

export type SelectedFeeToken = CvgCvxFeeToken & { balance: bigint };

const CVX_ADDRESS = CVGCVX_FEE_TOKENS.find((t) => t.symbol === 'CVX')!.address;

export type CvxSwapRoute = {
    token: SelectedFeeToken;
    quote: bigint;
    minAmountOut: bigint;
    priceImpact: number;
    to: string;
    data: string;
};

export type CvgCvxQuote = {
    quote: bigint;
    minAmountOut: bigint;
};

const recoverTokensInterface = new Interface([
    'function recoverTokens(address[] tokens)',
]);
const erc20Interface = new Interface(ERC20Abi);
const cvgCvxInterface = new Interface(cvgCVXAbi);

/**
 * Balances are read on the cvgCVX contract itself, since that is what
 * recoverTokens() moves into the multisig, not what the multisig already holds.
 */
export async function getCvgCvxFeeBalances(provider: Provider): Promise<SelectedFeeToken[]> {
    return Promise.all(
        CVGCVX_FEE_TOKENS.map(async (token) => {
            const erc20 = new Contract(token.address, ERC20Abi, provider)
            let balance: bigint = await erc20.balanceOf(CVGCVX_CONTRACT);

            if (token.symbol === "CVX") {
                const cvgCVX = new Contract(CVGCVX_CONTRACT, cvgCVXAbi, provider)
                const withdrawableFee = await cvgCVX.withdrawableFees(CVX)
                balance = balance - withdrawableFee;
            }

            return { ...token, balance };
        })
    );
}

/**
 * One Enso quote per selected token, swapped into CVX. CVX itself needs no
 * swap (from === to), so it is excluded and its claimed amount is added to
 * the CVX total directly instead.
 */
export async function getCvxSwapRoutes(selected: SelectedFeeToken[], slippagePercentage: number): Promise<CvxSwapRoute[]> {
    const tokensToSwap = selected.filter((token) => token.address.toLowerCase() !== CVX_ADDRESS.toLowerCase());

    return Promise.all(
        tokensToSwap.map(async (token) => {
            const quote = await getQuoteAndRoute(token.balance.toString(), CVX_ADDRESS, token.address, '0', VLCVX_MULTISIG, VLCVX_MULTISIG);
            const minAmountOut = computedMinAmountOut(quote.quote, slippagePercentage);
            const route = await getQuoteAndRoute(token.balance.toString(), CVX_ADDRESS, token.address, minAmountOut.toString(), VLCVX_MULTISIG, VLCVX_MULTISIG);
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

export async function getCvgCvxQuote(cvxAmount: bigint, provider: Provider, slippagePercentage: number): Promise<CvgCvxQuote> {
    // TODO: exchange indices (0, 1) assume a two-coin CVX/cvgCVX Curve pool
    // matching the SDT/cvgSDT layout — confirm once CVX_CVGCVX_LP is set.
    const pool = new Contract(CVX_CVGCVX_LP, StableSwapAbi, provider);
    const quote: bigint = await pool.get_dy(0, 1, cvxAmount);
    const minAmountOut = computedMinAmountOut(quote, slippagePercentage);
    return { quote, minAmountOut };
}

export function buildCvgCvxFeesClaimBatch(
    selected: SelectedFeeToken[],
    swapRoutes: CvxSwapRoute[],
    cvgCvxQuote: CvgCvxQuote,
    totalCvx: bigint
): MetaTransactionData[] {
    const txs: MetaTransactionData[] = [];

    // Claim the selected reward tokens from the cvgCVX contract into the multisig.
    txs.push({
        to: CVGCVX_CONTRACT,
        value: '0',
        data: recoverTokensInterface.encodeFunctionData('recoverTokens', [selected.map((token) => token.address)]),
    });

    // Approve + swap every non-CVX token into CVX via Enso.
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

    // Approve + convert the accumulated CVX into cvgCVX. The cvgCVX contract
    // pulls the CVX itself, so it is the spender — not the pool.
    txs.push({
        to: CVX_ADDRESS,
        value: '0',
        data: erc20Interface.encodeFunctionData('approve', [CVGCVX_CONTRACT, totalCvx]),
    });
    txs.push({
        to: CVGCVX_CONTRACT,
        value: '0',
        data: cvgCvxInterface.encodeFunctionData('convertCvxToCvgCVXWithSwap', [CVGCVX_CONTRACT, totalCvx, cvgCvxQuote.minAmountOut]),
    });

    return txs;
}
