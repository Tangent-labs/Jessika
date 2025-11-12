'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import CheckboxList from '../CheckboxList';
import { useContext, useMemo, useState } from 'react';
import { WalletContext } from '../../context/WalletContext';
import { claimStakeDaoBribes } from '../../services/claimStakeDaoBribes';
import { Input } from '@/components/ui/input';
import {
    checkConvexInput,
    claimConvexBribes,
} from '../../services/claimConvexBribes';
import BadgeList from '../BadgeList';

export type SymbolAddress = { symbol: string; tokenAddress: string };
export default function BribesClaiming({ className }: { className: string }) {
    const { signer } = useContext(WalletContext);

    const [bribesToClaim, setBribesToClaim] = useState([
        { key: 'sdCRV', displayKey: 'sdCRV', checked: true },
        { key: 'sdPENDLE', displayKey: 'sdPENDLE', checked: true },
        { key: 'sdFXN', displayKey: 'sdFXN', checked: true },
        { key: 'sdBAL', displayKey: 'sdBAL', checked: true },
    ]);

    function updateToggleBribes(key: string) {
        const index = bribesToClaim.findIndex((bribe) => bribe.key === key);
        const copy = [...bribesToClaim];
        copy[index].checked = !copy[index].checked;
        setBribesToClaim(copy);
    }

    const [inputConvexClaim, setInputConvexClaim] = useState('');

    const emptyStringArray: SymbolAddress[] = [];

    const [allConvexBribesToClaim, setAllConvexBribesToClaim] =
        useState(emptyStringArray);

    const allSymbolToClaim = useMemo(
        () => allConvexBribesToClaim.map((token) => token.symbol),
        [allConvexBribesToClaim.length]
    );

    const allAddressesToClaim = useMemo(
        () => allConvexBribesToClaim.map((token) => token.tokenAddress),
        [allConvexBribesToClaim.length]
    );

    async function addTokenToClaimConvex() {
        const { isValid, erc20, reason } = await checkConvexInput(
            signer!,
            inputConvexClaim,
            allConvexBribesToClaim
        );
        if (isValid) {
            setAllConvexBribesToClaim([
                ...allConvexBribesToClaim,
                {
                    symbol: erc20!,
                    tokenAddress: inputConvexClaim,
                },
            ]);
            setInputConvexClaim('');
        } else {
        }
        // setInputConvexClaim('');
    }

    return (
        <div className={className}>
            <div className="text-4xl text-center mb-5">Bribes claiming</div>
            <div className="grid grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>StakeDao Bribes harvesting</CardTitle>
                        <CardDescription>
                            Select the tokens to claim the bribes on
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-5 mb-3">
                            <CheckboxList
                                list={bribesToClaim}
                                onClick={updateToggleBribes}
                            ></CheckboxList>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => claimStakeDaoBribes(signer)}
                        >
                            Claim Bribes
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Convex Bribes harvesting</CardTitle>
                        <CardDescription>
                            Select and add ERC20s displayed on Votium
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full max-w-sm items-center space-x-2 mb-2">
                            <Input
                                type="text"
                                placeholder="Address"
                                onChange={(event) =>
                                    setInputConvexClaim(event.target.value)
                                }
                                value={inputConvexClaim}
                            />
                            <Button
                                type="submit"
                                onClick={() => addTokenToClaimConvex()}
                            >
                                +
                            </Button>
                        </div>

                        <div className="flex gap-5 mb-3">
                            <BadgeList list={allSymbolToClaim} />
                        </div>

                        <Button
                            variant="outline"
                            onClick={() =>
                                claimConvexBribes(signer!, allAddressesToClaim)
                            }
                        >
                            Claim Bribes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
