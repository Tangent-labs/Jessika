import { Signer, Contract, toBigInt } from 'ethers';

const sdtBlackHole = '0x21777106355ba506a31ff7984c0ae5c924deb77f';
const multiMerkleStash = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4';

type DataClaim = {
    token: string;
    index: number;
    amount: string;
    merkleProof: string[];
};

const abi = [
    {
        inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'index',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bytes32[]',
                        name: 'merkleProof',
                        type: 'bytes32[]',
                    },
                ],
                internalType: 'struct MultiMerkleStash.claimParam[]',
                name: 'claims',
                type: 'tuple[]',
            },
        ],
        name: 'claimMulti',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
export async function claimStakeDaoBribes(signer: Signer | null) {
    const lastMerkle = await (
        await fetch(
            'https://raw.githubusercontent.com/stake-dao/bounties-report/refs/heads/main/bounties-reports/latest/merkle.json'
        )
    ).json();
    const dataClaim: DataClaim[] = [];
    for (const rewardData of lastMerkle) {
        const addressReward = rewardData.address;
        const blackHoleRewardsData = rewardData.merkle[sdtBlackHole];

        const indexReward = blackHoleRewardsData?.index;
        const amountReward = blackHoleRewardsData?.amount;
        const proofReward = blackHoleRewardsData?.proof;
        if (blackHoleRewardsData) {
            dataClaim.push({
                token: addressReward,
                index: indexReward!,
                amount: toBigInt(amountReward!.hex).toString(),
                merkleProof: proofReward!,
            });
        }
    }

    const multiMerkle = new Contract(multiMerkleStash, abi, signer);

    await multiMerkle.claimMulti(sdtBlackHole, dataClaim);
}
