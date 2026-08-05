'use client';

import { useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { WalletContext } from '../../context/WalletContext';
import { PAUSER_PROXY, TANGENT_DAO_MULTI } from '../../config';
import { buildManageMultiPausingBatch, getMarketPauseStates, MarketPauseState, PauseFlags } from '../../services/pauseMarkets';
import { proposeSafeBatch } from '../../services/safe';
import { Eip1193Provider } from '@safe-global/protocol-kit';

const FLAGS: { key: keyof PauseFlags; label: string }[] = [
    { key: 'deposit', label: 'Deposit' },
    { key: 'borrow', label: 'Borrow' },
    { key: 'leverage', label: 'Leverage' },
];

// Which flags of a selected market are to be unpaused. A flag left out keeps its
// current on-chain value, because manageMultiPausing() rewrites all three.
type Selection = Record<string, PauseFlags>;

function truncateAddress(address: string) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function isPaused(market: MarketPauseState) {
    return market.pauses !== null && (market.pauses.deposit || market.pauses.borrow || market.pauses.leverage);
}

export default function UnpauseMarkets() {
    const { wallet, provider } = useContext(WalletContext);

    const [markets, setMarkets] = useState<MarketPauseState[]>([]);
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
    const [marketsError, setMarketsError] = useState('');

    const [selection, setSelection] = useState<Selection>({});

    const [isProposing, setIsProposing] = useState(false);
    const [proposeError, setProposeError] = useState('');
    const [proposedTxHash, setProposedTxHash] = useState('');

    useEffect(() => {
        if (!provider) return;

        let cancelled = false;
        setIsLoadingMarkets(true);
        setMarketsError('');
        getMarketPauseStates(provider)
            .then((states) => {
                if (cancelled) return;
                setMarkets(states);
            })
            .catch((error) => {
                console.error('getMarketPauseStates failed', error);
                if (!cancelled) setMarketsError(error instanceof Error ? error.message : String(error));
            })
            .finally(() => {
                if (!cancelled) setIsLoadingMarkets(false);
            });

        return () => {
            cancelled = true;
        };
    }, [provider !== null]);

    function toggleMarket(market: MarketPauseState) {
        setSelection((current) => {
            const next = { ...current };
            if (next[market.address]) {
                delete next[market.address];
            } else {
                // Selecting a market unpauses everything by default, that is what the card is for.
                next[market.address] = { deposit: true, borrow: true, leverage: true };
            }
            return next;
        });
    }

    function toggleFlag(address: string, flag: keyof PauseFlags) {
        setSelection((current) => {
            const flags = current[address];
            if (!flags) return current;
            return { ...current, [address]: { ...flags, [flag]: !flags[flag] } };
        });
    }

    function selectAllPaused() {
        const next: Selection = {};
        for (const market of markets) {
            if (isPaused(market)) next[market.address] = { deposit: true, borrow: true, leverage: true };
        }
        setSelection(next);
    }

    // The flags to write on-chain: unpause what is checked, resend the current
    // value for the rest so nothing else changes.
    const transactions = markets
        .filter((market) => market.pauses !== null && selection[market.address])
        .map((market) => {
            const unpause = selection[market.address];
            const pauses = market.pauses as PauseFlags;
            return {
                market,
                pauses: {
                    deposit: unpause.deposit ? false : pauses.deposit,
                    borrow: unpause.borrow ? false : pauses.borrow,
                    leverage: unpause.leverage ? false : pauses.leverage,
                },
            };
        });

    const changedMarkets = transactions.filter(
        ({ market, pauses }) =>
            pauses.deposit !== (market.pauses as PauseFlags).deposit ||
            pauses.borrow !== (market.pauses as PauseFlags).borrow ||
            pauses.leverage !== (market.pauses as PauseFlags).leverage
    );

    const canPropose = changedMarkets.length > 0;

    async function proposeUnpause() {
        if (!wallet || !canPropose) return;

        setIsProposing(true);
        setProposeError('');
        setProposedTxHash('');
        try {
            const safeTxHash = await proposeSafeBatch({
                provider: wallet.provider as unknown as Eip1193Provider,
                signerAddress: wallet.accounts[0].address,
                safeAddress: TANGENT_DAO_MULTI,
                transactions: buildManageMultiPausingBatch(
                    transactions.map(({ market, pauses }) => ({ address: market.address, pauses }))
                ),
                origin: 'Jessika - unpause USG markets',
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
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>Unpause markets</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            PauserProxy.manageMultiPausing({truncateAddress(PAUSER_PROXY)}) — batched into the Tangent DAO Safe
                        </p>
                    </div>
                    <Button variant="outline" size="sm" disabled={isProposing || markets.every((market) => !isPaused(market))} onClick={selectAllPaused}>
                        Select all paused
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingMarkets && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Fetching market pause states…</p>
                    </div>
                )}

                {!isLoadingMarkets && marketsError && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-destructive">Could not load the market pause states.</p>
                        <p className="mt-1 text-xs text-muted-foreground break-words">{marketsError}</p>
                    </div>
                )}

                {!isLoadingMarkets && !marketsError && !provider && <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to see the market pause states.</p>}

                {!isLoadingMarkets && !marketsError && provider && (
                    <>
                        <div className="grid gap-2 mb-3">
                            {markets.map((market) => {
                                const unpause = selection[market.address];
                                const unreadable = market.pauses === null;

                                return (
                                    <div key={market.address} className={cn('p-2 rounded-lg border', unpause ? 'bg-muted' : 'bg-transparent')}>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={market.address}
                                                checked={Boolean(unpause)}
                                                disabled={isProposing || unreadable || !isPaused(market)}
                                                onClick={() => toggleMarket(market)}
                                            />
                                            <label htmlFor={market.address} className="flex-1 text-sm font-medium">
                                                {market.name}
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">{truncateAddress(market.address)}</span>
                                            </label>

                                            {unreadable && <Badge variant="outline">state unavailable</Badge>}
                                            {!unreadable && !isPaused(market) && <Badge variant="secondary">active</Badge>}
                                            {!unreadable &&
                                                isPaused(market) &&
                                                FLAGS.filter(({ key }) => (market.pauses as PauseFlags)[key]).map(({ key, label }) => (
                                                    <Badge key={key} variant="destructive">
                                                        {label} paused
                                                    </Badge>
                                                ))}
                                        </div>

                                        {unpause && (
                                            <div className="flex items-center gap-4 mt-2 pl-6">
                                                <span className="text-xs text-muted-foreground">Unpause</span>
                                                {FLAGS.map(({ key, label }) => (
                                                    <div key={key} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${market.address}-${key}`}
                                                            checked={unpause[key]}
                                                            disabled={isProposing}
                                                            onClick={() => toggleFlag(market.address, key)}
                                                        />
                                                        <label htmlFor={`${market.address}-${key}`} className="text-xs font-medium">
                                                            {label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-3 border-t">
                            <Button variant="outline" className="w-full" disabled={!wallet || isProposing || !canPropose} onClick={proposeUnpause}>
                                {isProposing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Proposing…
                                    </>
                                ) : (
                                    `Queue unpause of ${changedMarkets.length} market${changedMarkets.length === 1 ? '' : 's'} in Safe`
                                )}
                            </Button>

                            {!canPropose && <p className="mt-3 text-sm text-muted-foreground text-center">Select at least one paused market to unpause.</p>}

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
