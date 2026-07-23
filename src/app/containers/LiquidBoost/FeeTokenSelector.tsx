'use client';

import { useState } from 'react';
import { formatUnits } from 'ethers';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SelectedFeeToken } from '../../services/claimCvgCvxFees';

function formatAmount(amount: bigint, decimals: number) {
    return Number(formatUnits(amount, decimals)).toFixed(4);
}

export default function FeeTokenSelector({
    availableTokens,
    selectedTokens,
    onAdd,
    onRemove,
    disabled,
}: {
    availableTokens: SelectedFeeToken[];
    selectedTokens: SelectedFeeToken[];
    onAdd: (token: SelectedFeeToken) => void;
    onRemove: (address: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const selectableTokens = availableTokens.filter(
        (token) => !selectedTokens.some((selected) => selected.address === token.address)
    );

    return (
        <div className="grid gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="w-full justify-between">
                        Add a token…
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandList>
                            <CommandEmpty>No token left to add.</CommandEmpty>
                            <CommandGroup>
                                {selectableTokens.map((token) => (
                                    <CommandItem
                                        key={token.address}
                                        value={token.symbol}
                                        onSelect={() => {
                                            onAdd(token);
                                            setOpen(false);
                                        }}
                                        className="justify-between"
                                    >
                                        <span>{token.symbol}</span>
                                        <span className="text-muted-foreground">{formatAmount(token.balance, token.decimals)}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="grid gap-2">
                {selectedTokens.map((token) => (
                    <div key={token.address} className={cn('flex justify-between items-center p-2 rounded-lg bg-muted border')}>
                        <div>
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{formatAmount(token.balance, token.decimals)}</p>
                        </div>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onRemove(token.address)}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
