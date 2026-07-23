'use client';

import { useContext, useEffect, useState } from 'react';
import { formatUnits, parseUnits } from 'ethers';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WalletContext } from '../../context/WalletContext';
import { FEE_TRESO_MULTI } from '../../config';
import { buildStreamUsgBatch, getUsgBalance } from '../../services/streamUsg';
import { proposeSafeBatch } from '../../services/safe';
import { Eip1193Provider } from '@safe-global/protocol-kit';

const USG_DECIMALS = 18;

function formatAmount(amount: bigint) {
    const value = Number(formatUnits(amount, USG_DECIMALS)).toFixed(2);
    return value.endsWith('.00') ? value.slice(0, -3) : value;
}

export default function SUsgStreaming() {
    const { wallet, provider } = useContext(WalletContext);

    const [multisigBalance, setMultisigBalance] = useState(BigInt(0));
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState(false);

    const [amountInput, setAmountInput] = useState('');

    const [isProposing, setIsProposing] = useState(false);
    const [proposeError, setProposeError] = useState('');
    const [proposedTxHash, setProposedTxHash] = useState('');

    useEffect(() => {
        if (!provider) return;

        let cancelled = false;
        setIsLoadingBalance(true);
        setBalanceError(false);
        getUsgBalance(provider)
            .then((balance) => {
                if (cancelled) return;
                setMultisigBalance(balance);
            })
            .catch(() => {
                if (!cancelled) setBalanceError(true);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingBalance(false);
            });

        return () => {
            cancelled = true;
        };
    }, [provider !== null]);

    let amount = BigInt(0);
    let amountParseError = false;
    if (amountInput.trim() !== '') {
        try {
            amount = parseUnits(amountInput, USG_DECIMALS);
        } catch {
            amountParseError = true;
        }
    }

    const exceedsBalance = amount > multisigBalance;
    const canPropose = amount > BigInt(0) && !exceedsBalance && !amountParseError;

    async function proposeStream() {
        if (!wallet || !canPropose) return;

        setIsProposing(true);
        setProposeError('');
        setProposedTxHash('');
        try {
            const safeTxHash = await proposeSafeBatch({
                provider: wallet.provider as unknown as Eip1193Provider,
                signerAddress: wallet.accounts[0].address,
                safeAddress: FEE_TRESO_MULTI,
                transactions: buildStreamUsgBatch(amount),
                origin: 'Jessika - sUSG streaming',
            });
            setProposedTxHash(safeTxHash);
        } catch (error) {
            setProposeError(error instanceof Error ? error.message : 'Proposal failed');
        } finally {
            setIsProposing(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>sUSG streaming</CardTitle>
                <p className="text-xs text-muted-foreground">2 steps to batch into Gnosis</p>
            </CardHeader>
            <CardContent>
                {isLoadingBalance && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Fetching multisig balance…</p>
                    </div>
                )}

                {!isLoadingBalance && balanceError && <p className="py-8 text-center text-sm text-destructive">Could not load the multisig balance.</p>}

                {!isLoadingBalance && !balanceError && !provider && <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to see the multisig balance.</p>}

                {!isLoadingBalance && !balanceError && provider && (
                    <>
                        <div className="mb-3">
                            <div className="flex justify-between items-center p-2 rounded-lg bg-muted border mb-4">
                                <p className="font-medium">USG in multisig</p>
                                <p className="font-semibold">{formatAmount(multisigBalance)}</p>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs text-muted-foreground mb-2 block">Amount of USG to stream to sUSG</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        disabled={isProposing}
                                        value={amountInput}
                                        onChange={(event) => setAmountInput(event.target.value)}
                                        placeholder="0.0"
                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <Button type="button" variant="outline" disabled={isProposing} onClick={() => setAmountInput(formatUnits(multisigBalance, USG_DECIMALS))}>
                                        Max
                                    </Button>
                                </div>
                                {exceedsBalance && !amountParseError && <p className="text-xs text-destructive mt-1">Amount exceeds the multisig's USG balance.</p>}
                            </div>

                            {/* Step 1 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">1</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Transfer {formatAmount(amount)} USG to sUSG</h3>
                                    <p className="text-xs text-muted-foreground">Call USG.transfer(sUSG, {formatAmount(amount)})</p>
                                </div>
                            </div>

                            <div className="h-6"></div>

                            {/* Step 2 */}
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">2</div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-sm">Stream USG in sUSG</h3>
                                    <p className="text-xs text-muted-foreground">Call sUSG.process_report(sUSG)</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t">
                            <Button variant="outline" className="w-full" disabled={!wallet || isProposing || !canPropose} onClick={proposeStream}>
                                {isProposing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Proposing…
                                    </>
                                ) : (
                                    'Queue batch in Safe'
                                )}
                            </Button>

                            {amount === BigInt(0) && <p className="mt-3 text-sm text-muted-foreground text-center">Enter an amount of USG to stream.</p>}

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
