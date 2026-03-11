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
        {
            sdToken: '0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5',
            displayKey: 'sdCRV',
            checked: true,
        },
        {
            sdToken: '0x5Ea630e00D6eE438d3deA1556A110359ACdc10A9',
            displayKey: 'sdPENDLE',
            checked: true,
        },
        {
            sdToken: '0xe19d1c837B8A1C83A56cD9165b2c0256D39653aD',
            displayKey: 'sdFXN',
            checked: true,
        },
        {
            sdToken: '0xF24d8651578a55b0C119B9910759a351A3458895',
            displayKey: 'sdBAL',
            checked: true,
        },
    ]);

    function updateToggleBribes(sdAddress: string) {
        const index = bribesToClaim.findIndex(
            (bribe) => bribe.sdToken === sdAddress
        );
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
                            onClick={() =>
                                claimStakeDaoBribes(signer, bribesToClaim)
                            }
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
