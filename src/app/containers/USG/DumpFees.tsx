'use client';

import { useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletContext } from '../../context/WalletContext';
import { FEE_TRESO_MULTI } from '../../config';
import { buildDumpFeesBatch, EnsoQuote, FeeSwapRoute, getFeeBalances, getFeeSwapRoutesToUsdc, getUsdcToUsgQuote, SelectedFeeToken } from '../../services/dumpFees';
import { proposeSafeBatch } from '../../services/safe';
import { Eip1193Provider } from '@safe-global/protocol-kit';
import SlippageInput from '../LiquidBoost/SlippageInput';
import FeeTokenSelector from '../LiquidBoost/FeeTokenSelector';
import ApproveAndSwapStep from '../LiquidBoost/ApproveAndSwapStep';

const DEFAULT_SLIPPAGE = 0.5;
const USDC_DECIMALS = 6;

export default function DumpFees() {
    const { wallet, provider } = useContext(WalletContext);

    const [availableTokens, setAvailableTokens] = useState<SelectedFeeToken[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<SelectedFeeToken[]>([]);

    const [swapRoutes, setSwapRoutes] = useState<FeeSwapRoute[]>([]);
    const [usdcToUsg, setUsdcToUsg] = useState<EnsoQuote>({ quote: 0n, minAmountOut: 0n, priceImpact: 0, to: '', data: '' });

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
        getFeeBalances(provider)
            .then((tokens) => {
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
            setUsdcToUsg({ quote: 0n, minAmountOut: 0n, priceImpact: 0, to: '', data: '' });
            return;
        }

        let cancelled = false;
        const timeout = setTimeout(() => {
            setIsLoadingQuotes(true);
            setQuotesError(false);
            getFeeSwapRoutesToUsdc(selectedTokens, slippage)
                .then(async (routes) => {
                    if (cancelled) return;
                    setSwapRoutes(routes);

                    const totalUsdc = routes.reduce((sum, route) => sum + route.minAmountOut, 0n);
                    const quote = await getUsdcToUsgQuote(totalUsdc, slippage);
                    if (cancelled) return;
                    setUsdcToUsg(quote);
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

    const totalUsdc = swapRoutes.reduce((sum, route) => sum + route.minAmountOut, 0n);

    async function proposeDump() {
        if (!wallet) return;

        setIsProposing(true);
        setProposeError('');
        setProposedTxHash('');
        try {
            const safeTxHash = await proposeSafeBatch({
                provider: wallet.provider as unknown as Eip1193Provider,
                signerAddress: wallet.accounts[0].address,
                safeAddress: FEE_TRESO_MULTI,
                transactions: buildDumpFeesBatch(selectedTokens, swapRoutes, usdcToUsg, totalUsdc),
                origin: 'Jessika - dump fees',
            });
            setProposedTxHash(safeTxHash);
        } catch (error) {
            setProposeError(error instanceof Error ? error.message : 'Proposal failed');
        } finally {
            setIsProposing(false);
        }
    }

    const hasNothingToDump = selectedTokens.length === 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>Dump fees</CardTitle>
                        <p className="text-xs text-muted-foreground">2 steps to batch into Gnosis</p>
                    </div>
                    <SlippageInput slippage={slippage} onChange={setSlippage} disabled={isProposing} className="flex-shrink-0" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingBalances && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Fetching fee balances…</p>
                    </div>
                )}

                {!isLoadingBalances && balancesError && <p className="py-8 text-center text-sm text-destructive">Could not load the fee balances.</p>}

                {!isLoadingBalances && !balancesError && !provider && <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to see the fee balances.</p>}

                {!isLoadingBalances && !balancesError && provider && (
                    <>
                        <div className="mb-3">
                            {/* Step 1 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">1</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Dump fees via Enso to USDC</h3>
                                    <p className="text-xs text-muted-foreground mb-2">Select the fee tokens to swap into USDC</p>

                                    <FeeTokenSelector availableTokens={availableTokens} selectedTokens={selectedTokens} onAdd={addToken} onRemove={removeToken} disabled={isProposing} />

                                    <div className="h-3"></div>

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
                                                    step={1}
                                                    title={`Swap ${route.token.symbol} to USDC via Enso`}
                                                    description={`Swap ${route.token.symbol} fees into USDC`}
                                                    fromLabel={`${route.token.symbol} to swap`}
                                                    fromAmount={route.token.balance}
                                                    fromDecimals={route.token.decimals}
                                                    fromSymbol={route.token.symbol}
                                                    toLabel="USDC received"
                                                    toAmount={route.quote}
                                                    toDecimals={USDC_DECIMALS}
                                                    toSymbol="USDC"
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

                            {/* Step 2 */}
                            <ApproveAndSwapStep
                                step={2}
                                title="Swap fees via Enso USDC to USG"
                                description="Swap the accumulated USDC into USG"
                                fromLabel="Total USDC swapped"
                                fromAmount={totalUsdc}
                                fromBreakdown={swapRoutes.map((route) => ({
                                    label: `USDC from ${route.token.symbol}`,
                                    amount: route.minAmountOut,
                                }))}
                                fromDecimals={USDC_DECIMALS}
                                fromSymbol="USDC"
                                toLabel="USG received"
                                toAmount={usdcToUsg.quote}
                                toDecimals={18}
                                toSymbol="USG"
                                minAmountOut={usdcToUsg.minAmountOut}
                                slippage={slippage}
                                priceImpact={usdcToUsg.priceImpact}
                            />
                        </div>

                        <div className="pt-3 border-t">
                            <Button variant="outline" className="w-full" disabled={!wallet || isProposing || hasNothingToDump} onClick={proposeDump}>
                                {isProposing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Proposing…
                                    </>
                                ) : (
                                    'Queue batch in Safe'
                                )}
                            </Button>

                            {hasNothingToDump && <p className="mt-3 text-sm text-muted-foreground text-center">Select at least one fee token to dump.</p>}

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
