'use client';

import { formatUnits } from 'ethers';
import { ArrowRight } from 'lucide-react';

function formatAmount(amount: bigint, decimals: number) {
    return Number(formatUnits(amount, decimals)).toFixed(4);
}

export default function ApproveAndSwapStep({
    step,
    title,
    description,
    fromLabel,
    fromAmount,
    fromDecimals,
    fromSymbol,
    toLabel,
    toAmount,
    toDecimals,
    toSymbol,
    minAmountOut,
    slippage,
    priceImpact,
    fromBreakdown,
}: {
    step: number;
    title: string;
    description: string;
    fromLabel: string;
    fromAmount: bigint;
    fromDecimals: number;
    fromSymbol: string;
    toLabel: string;
    toAmount: bigint;
    toDecimals: number;
    toSymbol: string;
    minAmountOut: bigint;
    slippage: number;
    priceImpact?: number;
    /** Parts that sum to `fromAmount`, listed under it. */
    fromBreakdown?: { label: string; amount: bigint }[];
}) {
    return (
        <div className="flex gap-2">
            <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                    {step}
                </div>
            </div>
            <div className="flex-1 pt-1">
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{description}</p>

                <div className="bg-muted p-3 rounded-lg space-y-2 border">
                    <div className="flex justify-between">
                        <span className="text-sm">{fromLabel}</span>
                        <span className="font-medium">
                            {formatAmount(fromAmount, fromDecimals)}{' '}
                            {fromSymbol}
                        </span>
                    </div>

                    {fromBreakdown && (
                        <div className="pl-3 border-l border-muted-foreground/30 space-y-1">
                            {fromBreakdown.map((part, index) => (
                                <div
                                    key={part.label}
                                    className="flex justify-between text-xs text-muted-foreground"
                                >
                                    <span>
                                        {index > 0 && (
                                            <span className="mr-1">+</span>
                                        )}
                                        {part.label}
                                    </span>
                                    <span>
                                        {formatAmount(
                                            part.amount,
                                            fromDecimals
                                        )}{' '}
                                        {fromSymbol}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center text-muted-foreground -my-0.5">
                        <ArrowRight className="h-3 w-3" />
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm">{toLabel}</span>
                        <span className="font-medium text-emerald-600">
                            {formatAmount(toAmount, toDecimals)} {toSymbol}
                        </span>
                    </div>

                    <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-muted-foreground">
                            Min received ({slippage}% slippage)
                        </span>
                        <span className="text-sm font-medium">
                            {formatAmount(minAmountOut, toDecimals)} {toSymbol}
                        </span>
                    </div>

                    {priceImpact !== undefined && priceImpact > 0 && (
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                                Price impact
                            </span>
                            <span className="text-sm font-medium">
                                {priceImpact.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
