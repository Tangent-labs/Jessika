'use client';

import { useContext, useEffect, useState } from 'react';
import { formatUnits } from 'ethers';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletContext } from '../../context/WalletContext';
import { VLSDT_MULTISIG } from '../../config';
import { buildVlSdtFeesClaimBatch, ClaimableFee, EnsoRoute, getCvgSDTData } from '../../services/claimVlSdtFees';
import { proposeSafeBatch } from '../../services/safe';
import { Eip1193Provider } from '@safe-global/protocol-kit';
import SlippageInput from './SlippageInput';
import ApproveAndSwapStep from './ApproveAndSwapStep';

export type CvgSdtStep = { quote: bigint; minAmountOut: bigint };

const DEFAULT_SLIPPAGE = 1;

export default function VlSdtFeesClaim() {
    const { wallet, provider } = useContext(WalletContext);

    const [claimableFees, setClaimableFees] = useState<ClaimableFee[]>([]);
    const [routingEnso, setRoutingEnso] = useState<EnsoRoute>({ quote: 0n, minAmountOut: 0n, priceImpact: 0, to: '', data: '' });
    const [cvgSDTQuote, setCvgSDTQuote] = useState<CvgSdtStep>({ quote: 0n, minAmountOut: 0n });

    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [feesError, setFeesError] = useState(false);

    const [isProposing, setIsProposing] = useState(false);
    const [proposeError, setProposeError] = useState('');
    const [proposedTxHash, setProposedTxHash] = useState('');

    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
    const [sdtBalance, setSdtBalance] = useState(BigInt(0));

    useEffect(() => {
        if (!provider) return;

        // Every slippage change re-quotes Enso and the curve pool, so typing in
        // the input is debounced to avoid a request per keystroke. `cancelled`
        // drops responses from superseded slippage values, which can otherwise
        // resolve out of order and leave a stale quote on screen.
        let cancelled = false;
        const timeout = setTimeout(() => {
            setIsLoadingFees(true);
            setFeesError(false);
            getCvgSDTData(provider, slippage)
                .then((data) => {
                    if (cancelled) return;
                    setClaimableFees(data.claimable);
                    setRoutingEnso(data.ensoRoute);
                    setCvgSDTQuote(data.cvgSDTAmout);
                    setSdtBalance(data.sdtBalance);
                })
                .catch(() => {
                    if (!cancelled) setFeesError(true);
                })
                .finally(() => {
                    if (!cancelled) setIsLoadingFees(false);
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [provider !== null, slippage]);

    async function proposeClaim() {
        if (!wallet) return;

        setIsProposing(true);
        setProposeError('');
        setProposedTxHash('');
        try {
            const safeTxHash = await proposeSafeBatch({
                provider: wallet.provider as unknown as Eip1193Provider,
                signerAddress: wallet.accounts[0].address,
                safeAddress: VLSDT_MULTISIG,
                transactions: buildVlSdtFeesClaimBatch(claimableFees, routingEnso, cvgSDTQuote, sdtBalance),
                origin: 'Jessika - vlSDT fees claim',
            });
            setProposedTxHash(safeTxHash);
        } catch (error) {
            setProposeError(error instanceof Error ? error.message : 'Proposal failed');
        } finally {
            setIsProposing(false);
        }
    }

    const hasNothingToClaim = claimableFees.length > 0 && claimableFees.every((fee) => fee.amount === BigInt(0));

    // Helper to format amounts
    const formatAmount = (amount: bigint, decimals: number) => {
        return Number(formatUnits(amount, decimals)).toFixed(4);
    };

    const usdcFee = claimableFees.find((f) => f.symbol === 'USDC');
    const sdtFee = claimableFees.find((f) => f.symbol === 'SDT');

    const usdcAmount = usdcFee?.amount ?? BigInt(0);
    const sdtAmount = sdtFee?.amount ?? BigInt(0);

    // Step 2: USDC → SDT via Enso
    const sdtFromSwap = routingEnso?.quote ?? BigInt(0);
    const minSdtAmountOut = routingEnso.minAmountOut;

    // Step 3: SDT → cvgSDT. The batch swaps the claimed SDT plus what Enso
    // returns, so the input mirrors buildVlSdtFeesClaimBatch's totalSDT.
    const totalSdtForCvg = minSdtAmountOut + sdtAmount + sdtBalance;
    const cvgSdtReceived = cvgSDTQuote?.quote ?? BigInt(0);
    const minCvgSdtAmountOut = cvgSDTQuote.minAmountOut;
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>vlSDT Fees Claiming</CardTitle>
                    </div>
                    <SlippageInput slippage={slippage} onChange={setSlippage} disabled={isProposing} className="flex-shrink-0" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingFees && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Fetching claimable fees…</p>
                    </div>
                )}

                {!isLoadingFees && feesError && <p className="py-8 text-center text-sm text-destructive">Could not load the claimable fees.</p>}

                {!isLoadingFees && !feesError && !provider && <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to see the claimable fees.</p>}

                {!isLoadingFees && !feesError && provider && (
                    <>
                        {/* Vertical Stepper */}
                        <div className="mb-3">
                            {/* Step 1 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">1</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Claim Fees</h3>
                                    <p className="text-xs text-muted-foreground mb-2">Claim USDC and SDT fees from the vlSDT multisig</p>

                                    <div className="grid gap-2">
                                        {claimableFees.map((fee) => (
                                            <div key={fee.distributor} className="flex justify-between items-center p-2 rounded-lg bg-muted border">
                                                <div>
                                                    <p className="font-medium">{fee.symbol}</p>
                                                    <p className="text-xs text-muted-foreground">{fee.distributor}</p>
                                                </div>
                                                <p className="font-semibold">{formatAmount(fee.amount, fee.decimals)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step Connector */}
                            <div className="h-6"></div>

                            {/* Step 2 */}
                            <ApproveAndSwapStep
                                step={2}
                                title="Approve & Swap USDC to SDT via Enso"
                                description="Swap claimed USDC into additional SDT"
                                fromLabel="USDC to swap"
                                fromAmount={usdcAmount}
                                fromDecimals={usdcFee?.decimals ?? 6}
                                fromSymbol="USDC"
                                toLabel="SDT received"
                                toAmount={sdtFromSwap}
                                toDecimals={18}
                                toSymbol="SDT"
                                minAmountOut={minSdtAmountOut}
                                slippage={slippage}
                                priceImpact={routingEnso.priceImpact}
                            />

                            {/* Step Connector */}
                            <div className="h-6"></div>

                            {/* Step 3 */}
                            <ApproveAndSwapStep
                                step={3}
                                title="Approve & Swap SDT to cvgSDT"
                                description="Swap all SDT (claimed + from Enso) into cvgSDT and send to buffer"
                                fromLabel="Total SDT swapped"
                                fromAmount={totalSdtForCvg}
                                fromBreakdown={[
                                    { label: 'Min SDT received', amount: minSdtAmountOut },
                                    { label: 'SDT fees claimed', amount: sdtAmount },
                                    { label: 'SDT already in multisig', amount: sdtBalance },
                                ]}
                                fromDecimals={18}
                                fromSymbol="SDT"
                                toLabel="cvgSDT received by buffer"
                                toAmount={cvgSdtReceived}
                                toDecimals={18}
                                toSymbol="cvgSDT"
                                minAmountOut={minCvgSdtAmountOut}
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

                            {hasNothingToClaim && <p className="mt-3 text-sm text-muted-foreground text-center">Nothing claimable for the current epoch.</p>}

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
