'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import CheckboxList, { AddressDisplayKeyChecked } from '../CheckboxList';
import { useContext, useEffect, useState } from 'react';
import { cycleTriggeringAndHarvesting } from '../../services/cycleTriggeringAndHarvesting';
import { WalletContext } from '../../context/WalletContext';
import { getLastEventsLiquidboost } from '@/app/services/lastDistributedRewards';

export default function CyclePassage({ className }: { className: string }) {
    const [stakingToProcess, setStakingToProcess] = useState([
        {
            address: '0xF941BC649Ef0B20ABd7f6dC78CA8f8E225337933',
            displayKey: 'cvgSDT',
            checked: true,
        },
        {
            address: '0x2FF160bcADb485b5F048b9880e6f471Af632060c',
            displayKey: 'sdCRV',
            checked: true,
        },
        {
            address: '0x508f0E1b565b40AeB94671BeD228083203330882',
            displayKey: 'sdPENDLE',
            checked: true,
        },
        {
            address: '0x35e30Bc815935Bb5EC1743f772331864D780cc26',
            displayKey: 'sdFXN',
            checked: true,
        },
        {
            address: '0xAf5b3f4A0b4dc334dB7137E5584E0e971E5e4962',
            displayKey: 'sdBAL',
            checked: true,
        },
        {
            address: '0x2c1D293c50C6d1a4370ebb442A02c5956bbAb119'.toLowerCase(),
            displayKey: 'cvgCVX',
            checked: true,
        },
    ] as AddressDisplayKeyChecked[]);

    const [lastRewards, setLastRewards] = useState(
        {} as {
            tokenDistributed: {
                staking: string;
                rewards: {
                    name: string;
                    amount: number;
                    amountUsd?: number;
                    address: string;
                }[];
            }[];
            totalUSD: number;
        }
    );
    const stakingAddressesToProcess = stakingToProcess
        .filter((staking) => staking.checked)
        .map((staking) => staking.address);

    function updateToggleStakingToProcess(key: string) {
        const index = stakingToProcess.findIndex(
            (staking) => staking.address === key
        );
        const copy = [...stakingToProcess];
        copy[index].checked = !copy[index].checked;
        setStakingToProcess(copy);
    }
    const { signer, provider } = useContext(WalletContext);

    useEffect(() => {
        if (provider) {
            getLastEventsLiquidboost(provider).then((a) => {
                setLastRewards(a);
            });
        }
    }, [provider !== null]);

    return (
        <div className={className}>
            <div className="text-4xl text-center mb-5">Cycle passage</div>
            <div className=" grid grid-cols-2 gap-12">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Last distribution</CardTitle>
                        <CardDescription>
                            List of rewards distributed on last cycle
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-lg font-bold ">
                            Total : ${lastRewards?.totalUSD?.toFixed()}
                        </h1>
                        {lastRewards?.tokenDistributed?.map((pool, i) => (
                            <div
                                key={i}
                                className="border p-4 rounded-2xl shadow-sm bg-white"
                            >
                                <h2 className="text-lg font-bold mb-3">
                                    {pool.staking}
                                </h2>

                                <div className="grid gap-3">
                                    {pool.rewards.map((reward, j) => (
                                        <div
                                            key={j}
                                            className="flex justify-between items-center p-3 rounded-xl bg-gray-50"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {reward.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {reward.address}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                {reward.amountUsd && (
                                                    <p className="font-semibold">
                                                        $
                                                        {reward.amountUsd.toFixed()}
                                                    </p>
                                                )}
                                                <p className=" text-sm text-gray-500">
                                                    {reward.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
