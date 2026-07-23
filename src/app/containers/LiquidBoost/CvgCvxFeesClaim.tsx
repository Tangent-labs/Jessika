'use client';

import { useContext, useEffect, useState } from 'react';
import { formatUnits } from 'ethers';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletContext } from '../../context/WalletContext';
import { VLCVX_MULTISIG } from '../../config';
import { buildCvgCvxFeesClaimBatch, CvgCvxQuote, CvxSwapRoute, getCvgCvxFeeBalances, getCvgCvxQuote, getCvxSwapRoutes, SelectedFeeToken } from '../../services/claimCvgCvxFees';
import { proposeSafeBatch } from '../../services/safe';
import { Eip1193Provider } from '@safe-global/protocol-kit';
import SlippageInput from './SlippageInput';
import ApproveAndSwapStep from './ApproveAndSwapStep';
import FeeTokenSelector from './FeeTokenSelector';

const DEFAULT_SLIPPAGE = 0.5;

function formatAmount(amount: bigint, decimals: number) {
    return Number(formatUnits(amount, decimals)).toFixed(4);
}

export default function CvgCvxFeesClaim() {
    const { wallet, provider } = useContext(WalletContext);

    const [availableTokens, setAvailableTokens] = useState<SelectedFeeToken[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<SelectedFeeToken[]>([]);

    const [swapRoutes, setSwapRoutes] = useState<CvxSwapRoute[]>([]);
    const [cvgCvxQuote, setCvgCvxQuote] = useState<CvgCvxQuote>({ quote: 0n, minAmountOut: 0n });

    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [balancesError, setBalancesError] = useState(false);

    const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
    const [quotesError, setQuotesError] = useState(false);

    const [isProposing, setIsProposing] = useState(false);
    const [proposeError, setProposeError] = useState('');
    const [proposedTxHash, setProposedTxHash] = useState('');

    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);

    useEffect(() => {
        if (!provider) return;

        let cancelled = false;
        setIsLoadingBalances(true);
        setBalancesError(false);
        getCvgCvxFeeBalances(provider)
            .then((tokens) => {
                console.log(tokens);
                if (cancelled) return;
                setAvailableTokens(tokens);
            })
            .catch(() => {
                if (!cancelled) setBalancesError(true);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingBalances(false);
            });

        return () => {
            cancelled = true;
        };
    }, [provider !== null]);

    const selectedAddresses = selectedTokens.map((t) => t.address).join(',');

    useEffect(() => {
        if (!provider || selectedTokens.length === 0) {
            setSwapRoutes([]);
            setCvgCvxQuote({ quote: 0n, minAmountOut: 0n });
            return;
        }

        // Debounced like the vlSDT card: every slippage/selection change
        // re-quotes Enso and the pool, so `cancelled` drops stale responses.
        let cancelled = false;
        const timeout = setTimeout(() => {
            setIsLoadingQuotes(true);
            setQuotesError(false);
            getCvxSwapRoutes(selectedTokens, slippage)
                .then(async (routes) => {
                    if (cancelled) return;
                    setSwapRoutes(routes);

                    const cvxToken = selectedTokens.find((t) => t.symbol === 'CVX');
                    const directCvx = cvxToken?.balance ?? 0n;
                    const totalCvx = routes.reduce((sum, route) => sum + route.minAmountOut, directCvx);

                    const quote = await getCvgCvxQuote(totalCvx, provider, slippage);
                    if (cancelled) return;
                    setCvgCvxQuote(quote);
                })
                .catch(() => {
                    if (!cancelled) setQuotesError(true);
                })
                .finally(() => {
                    if (!cancelled) setIsLoadingQuotes(false);
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [provider !== null, slippage, selectedAddresses]);

    function addToken(token: SelectedFeeToken) {
        setSelectedTokens((current) => [...current, token]);
    }

    function removeToken(address: string) {
        setSelectedTokens((current) => current.filter((token) => token.address !== address));
    }

    async function proposeClaim() {
        if (!wallet) return;

        const cvxToken = selectedTokens.find((t) => t.symbol === 'CVX');
        const directCvx = cvxToken?.balance ?? 0n;
        const totalCvx = swapRoutes.reduce((sum, route) => sum + route.minAmountOut, directCvx);

        setIsProposing(true);
        setProposeError('');
        setProposedTxHash('');
        try {
            const safeTxHash = await proposeSafeBatch({
                provider: wallet.provider as unknown as Eip1193Provider,
                signerAddress: wallet.accounts[0].address,
                safeAddress: VLCVX_MULTISIG,
                transactions: buildCvgCvxFeesClaimBatch(selectedTokens, swapRoutes, cvgCvxQuote, totalCvx),
                origin: 'Jessika - cvgCVX process',
            });
            setProposedTxHash(safeTxHash);
        } catch (error) {
            setProposeError(error instanceof Error ? error.message : 'Proposal failed');
        } finally {
            setIsProposing(false);
        }
    }

    const cvxToken = selectedTokens.find((t) => t.symbol === 'CVX');
    const directCvx = cvxToken?.balance ?? 0n;
    const totalCvxSwapped = swapRoutes.reduce((sum, route) => sum + route.minAmountOut, directCvx);
    const cvgCvxReceived = cvgCvxQuote.quote;
    const minCvgCvxAmountOut = cvgCvxQuote.minAmountOut;

    const hasNothingToClaim = selectedTokens.length === 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>cvgCVX Process</CardTitle>
                    </div>
                    <SlippageInput slippage={slippage} onChange={setSlippage} disabled={isProposing} className="flex-shrink-0" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingBalances && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Fetching claimable fees…</p>
                    </div>
                )}

                {!isLoadingBalances && balancesError && <p className="py-8 text-center text-sm text-destructive">Could not load the claimable fees.</p>}

                {!isLoadingBalances && !balancesError && !provider && <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to see the claimable fees.</p>}

                {!isLoadingBalances && !balancesError && provider && (
                    <>
                        <div className="mb-3">
                            {/* Step 1 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">1</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Claim Fees to Multisig</h3>
                                    <p className="text-xs text-muted-foreground mb-2">Recover the selected reward tokens from the cvgCVX contract into the multisig</p>

                                    <FeeTokenSelector availableTokens={availableTokens} selectedTokens={selectedTokens} onAdd={addToken} onRemove={removeToken} disabled={isProposing} />
                                </div>
                            </div>

                            <div className="h-6"></div>

                            {/* Step 2 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">2</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Approve & Swap fees to CVX via Enso</h3>
                                    <p className="text-xs text-muted-foreground mb-2">Swap every selected reward token into CVX</p>

                                    {isLoadingQuotes && (
                                        <div className="flex items-center gap-2 py-4 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <p className="text-xs">Fetching Enso quotes…</p>
                                        </div>
                                    )}

                                    {!isLoadingQuotes && quotesError && <p className="text-xs text-destructive">Could not fetch the Enso quotes.</p>}

                                    {!isLoadingQuotes && !quotesError && selectedTokens.length === 0 && <p className="text-xs text-muted-foreground">Select at least one token above.</p>}

                                    {!isLoadingQuotes && !quotesError && swapRoutes.length > 0 && (
                                        <div className="grid gap-3">
                                            {swapRoutes.map((route) => (
                                                <ApproveAndSwapStep
                                                    key={route.token.address}
                                                    step={2}
                                                    title={`Swap ${route.token.symbol} to CVX via Enso`}
                                                    description={`Swap claimed ${route.token.symbol} into CVX`}
                                                    fromLabel={`${route.token.symbol} to swap`}
                                                    fromAmount={route.token.balance}
                                                    fromDecimals={route.token.decimals}
                                                    fromSymbol={route.token.symbol}
                                                    toLabel="CVX received"
                                                    toAmount={route.quote}
                                                    toDecimals={18}
                                                    toSymbol="CVX"
                                                    minAmountOut={route.minAmountOut}
                                                    slippage={slippage}
                                                    priceImpact={route.priceImpact}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-6"></div>

                            {/* Step 3 */}
                            <ApproveAndSwapStep
                                step={3}
                                title="Approve & Swap CVX to cvgCVX"
                                description="Swap all CVX (claimed + from Enso) into cvgCVX"
                                fromLabel="Total CVX swapped"
                                fromAmount={totalCvxSwapped}
                                fromBreakdown={[
                                    ...swapRoutes.map((route) => ({
                                        label: `CVX from ${route.token.symbol}`,
                                        amount: route.minAmountOut,
                                    })),
                                    ...(cvxToken ? [{ label: 'CVX claimed directly', amount: directCvx }] : []),
                                ]}
                                fromDecimals={18}
                                fromSymbol="CVX"
                                toLabel="cvgCVX received"
                                toAmount={cvgCvxReceived}
                                toDecimals={18}
                                toSymbol="cvgCVX"
                                minAmountOut={minCvgCvxAmountOut}
                                slippage={slippage}
                            />
                        </div>

                        <div className="pt-3 border-t">
                            <Button variant="outline" className="w-full" disabled={!wallet || isProposing || hasNothingToClaim} onClick={proposeClaim}>
                                {isProposing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Proposing…
                                    </>
                                ) : (
                                    'Queue batch in Safe'
                                )}
                            </Button>

                            {hasNothingToClaim && <p className="mt-3 text-sm text-muted-foreground text-center">Select at least one token to claim.</p>}

                            {proposeError && <p className="mt-3 text-sm text-destructive text-center">{proposeError}</p>}

                            {proposedTxHash && (
                                <p className="mt-3 text-sm text-muted-foreground text-center">
                                    Batch queued.{' '}
                                    <a className="underline hover:text-foreground" target="_blank" rel="noreferrer">
                                        Review it in the Safe
                                    </a>
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
