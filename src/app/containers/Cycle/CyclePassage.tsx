'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { triggerCycleNoRewardProcessing } from '../../services/cycleTriggering';
import CheckboxList from '../CheckboxList';
import { useContext, useState } from 'react';
import { cycleTriggeringAndHarvesting } from '../../services/cycleTriggeringAndHarvesting';
import { WalletContext } from '../../context/WalletContext';

export default function CyclePassage({ className }: { className: string }) {
    const [stakingToProcess, setStakingToProcess] = useState([
        {
            key: '0xF941BC649Ef0B20ABd7f6dC78CA8f8E225337933',
            displayKey: 'cvgSDT',
            checked: true,
        },
        {
            key: '0x2FF160bcADb485b5F048b9880e6f471Af632060c',
            displayKey: 'sdCRV',
            checked: true,
        },
        {
            key: '0x508f0E1b565b40AeB94671BeD228083203330882',
            displayKey: 'sdPENDLE',
            checked: true,
        },
        {
            key: '0x35e30Bc815935Bb5EC1743f772331864D780cc26',
            displayKey: 'sdFXN',
            checked: true,
        },
        {
            key: '0xAf5b3f4A0b4dc334dB7137E5584E0e971E5e4962',
            displayKey: 'sdBAL',
            checked: true,
        },
    ]);
    const stakingAddressesToProcess = stakingToProcess
        .filter((staking) => staking.checked)
        .map((staking) => staking.key);

    function updateToggleStakingToProcess(key: string) {
        const index = stakingToProcess.findIndex(
            (staking) => staking.key === key
        );
        const copy = [...stakingToProcess];
        copy[index].checked = !copy[index].checked;
        setStakingToProcess(copy);
    }

    const { signer } = useContext(WalletContext);

    return (
        <div className={className}>
            <div className="text-4xl text-center mb-5">Cycle passage</div>
            <div className=" grid grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Cycle Triggering</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() =>
                                triggerCycleNoRewardProcessing(signer)
                            }
                        >
                            Pass Cycle
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Cycle Triggering + Harvest of biggest Pool
                        </CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-5 mb-3">
                            <CheckboxList
                                list={stakingToProcess}
                                onClick={updateToggleStakingToProcess}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() =>
                                cycleTriggeringAndHarvesting(
                                    signer,
                                    stakingAddressesToProcess
                                )
                            }
                        >
                            Pass Cycle & Process Rewards
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
