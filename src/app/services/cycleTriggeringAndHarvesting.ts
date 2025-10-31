import { AddressLike } from 'ethers';
import { Signer } from 'ethers';
import { Contract } from 'ethers';
import { cvgCVX_STAKING } from '../config';

export async function cycleTriggeringAndHarvesting(
    signer: Signer | null,
    stakingContracts: AddressLike[]
) {
    const abi = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "stepAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "contract ISdtStakingPositionService[]",
                    "name": "sdtStakings",
                    "type": "address[]"
                },
                {
                    "internalType": "contract ICvxStakingPositionService[]",
                    "name": "cvxStakings",
                    "type": "address[]"
                }
            ],
            "name": "cycleProcess",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    const cycleProcessor = new Contract(
        '0xdF640F13Ef36E22384fb9F0F713C739C34e54521',
        abi,
        signer
    );
    const isCvgCvxStakingSelected = stakingContracts.includes(cvgCVX_STAKING.key)
    const cvgCVXStakings = []
    if (isCvgCvxStakingSelected) {
        cvgCVXStakings.push(cvgCVX_STAKING.key)
        stakingContracts = stakingContracts.filter(a => cvgCVX_STAKING.key !== a)
    }
    console.log(stakingContracts, cvgCVXStakings)
    await cycleProcessor.cycleProcess(0, stakingContracts, cvgCVXStakings);
}
