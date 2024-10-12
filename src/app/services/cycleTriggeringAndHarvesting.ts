import { AddressLike } from 'ethers';
import { Signer } from 'ethers';
import { Contract } from 'ethers';

export async function cycleTriggeringAndHarvesting(
    signer: Signer | null,
    stakingContracts: AddressLike[]
) {
    console.log(signer);

    const abi = [
        {
            inputs: [
                {
                    internalType: 'contract IERC20[]',
                    name: 'tokens',
                    type: 'address[]',
                },
                {
                    internalType: 'address',
                    name: 'receiver',
                    type: 'address',
                },
            ],
            name: 'transferTokens',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'stepAmount',
                    type: 'uint256',
                },
                {
                    internalType: 'contract ISdtStakingPositionService[]',
                    name: 'sdtStakings',
                    type: 'address[]',
                },
            ],
            name: 'cycleProcess',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ];
    const cycleProcessor = new Contract(
        '0x49d2de51f61e439d7e97810834e56ff0c4ce5c9b',
        abi,
        signer
    );
    console.log(stakingContracts);
    await cycleProcessor.cycleProcess(0, stakingContracts);
}
