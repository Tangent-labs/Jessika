'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PRESETS = [0.1, 0.5, 1];

export default function SlippageInput({
    slippage,
    onChange,
    disabled,
    className,
}: {
    slippage: number;
    onChange: (slippage: number) => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span className="text-sm text-muted-foreground">Slippage</span>

            <div className="flex items-center gap-1">
                {PRESETS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(preset)}
                        className={cn(
                            'px-2 py-1 rounded-md text-xs font-medium border transition-colors disabled:opacity-50',
                            slippage === preset
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {preset}%
                    </button>
                ))}
            </div>

            <div className="relative w-24">
                <Input
                    type="number"
                    min={0}
                    max={50}
                    step={0.1}
                    disabled={disabled}
                    value={slippage}
                    onChange={(event) => {
                        const parsed = Number(event.target.value);
                        // Reject NaN and out-of-range values so the quote is
                        // never rebuilt from a slippage the contracts reject.
                        if (Number.isNaN(parsed) || parsed < 0 || parsed > 50)
                            return;
                        onChange(parsed);
                    }}
                    className="h-8 pr-6 text-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                </span>
            </div>
        </div>
    );
}
