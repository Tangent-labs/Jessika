import { Signer } from 'ethers';
import { Contract } from 'ethers';

export async function triggerCycleNoRewardProcessing(signer: Signer | null) {
    const abi = [
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: '_uselessParam',
                    type: 'uint256',
                },
            ],
            name: 'writeStakingRewards',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ];
    const cvgRewards = new Contract(
        '0xa044fd2E8254eC5DE93B15b8B27d005899579109',
        abi,
        signer
    );

    await cvgRewards.writeStakingRewards(0);
}
