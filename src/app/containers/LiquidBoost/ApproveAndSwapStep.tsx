'use client';

import { formatUnits } from 'ethers';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PERCENT_PRESETS = [50, 100];

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
    fromInputValue,
    onFromInputChange,
    fromInputError,
    fromMaxAmount,
    disabled,
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
    /** When provided, `fromAmount` becomes editable and is driven by this value. */
    fromInputValue?: string;
    onFromInputChange?: (value: string) => void;
    fromInputError?: string;
    /** Basis for the percentage shortcuts next to the input. */
    fromMaxAmount?: bigint;
    disabled?: boolean;
}) {
    const isEditable = fromInputValue !== undefined && onFromInputChange !== undefined;

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
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">{fromLabel}</span>
                        {isEditable ? (
                            <div className="flex items-center gap-1">
                                {fromMaxAmount !== undefined &&
                                    PERCENT_PRESETS.map((percent) => (
                                        <button
                                            key={percent}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() =>
                                                onFromInputChange(
                                                    formatUnits(
                                                        (fromMaxAmount *
                                                            BigInt(percent)) /
                                                            100n,
                                                        fromDecimals
                                                    )
                                                )
                                            }
                                            className="px-2 py-1 rounded-md text-xs font-medium border bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                                        >
                                            {percent}%
                                        </button>
                                    ))}

                                <div className="relative w-44">
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        disabled={disabled}
                                        value={fromInputValue}
                                        onChange={(event) =>
                                            onFromInputChange(event.target.value)
                                        }
                                        className="h-8 pr-14 text-sm text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {fromSymbol}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="font-medium">
                                {formatAmount(fromAmount, fromDecimals)}{' '}
                                {fromSymbol}
                            </span>
                        )}
                    </div>

                    {fromInputError && (
                        <p className="text-xs text-destructive text-right">
                            {fromInputError}
                        </p>
                    )}

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
