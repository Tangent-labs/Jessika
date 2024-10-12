import { isAddress, Provider } from 'ethers';
import { Signer } from 'ethers';
import { Contract } from 'ethers';
import { SymbolAddress } from '../containers/Bribes/BribesClaiming';

export async function checkConvexInput(
    provider: Signer | Provider,
    convexInput: string,
    allConvexBribesToClaim: SymbolAddress[]
) {
    if (!isAddress(convexInput)) {
        return { isValid: false, reason: 'Input is not  an address' };
    }

    if (
        allConvexBribesToClaim.find(
            (token) =>
                token.tokenAddress.toUpperCase() === convexInput.toUpperCase()
        )
    ) {
        return { isValid: false, reason: 'Token already selected' };
    }
    const erc20Abi = [
        {
            inputs: [],
            name: 'symbol',
            outputs: [
                {
                    internalType: 'string',
                    name: '',
                    type: 'string',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
    ];
    const erc20 = new Contract(convexInput, erc20Abi, provider);
    let symbol = '';
    try {
        symbol = await erc20.symbol();
    } catch (error) {
        console.log(error);
        return { isValid: false, reason: "L'adresse c'est pas un ERC20" };
    }

    return {
        isValid: true,
        erc20: symbol,
    };
}

//////////////////// CLAIM

const abiMerkle = [
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
export const CONVEX_MULTI_MERKLE_STASH =
    '0x378Ba9B73309bE80BF4C2c027aAD799766a7ED5A';

const cvgCVXAddress = '0x2191DF768ad71140F9F3E96c1e4407A4aA31d082';
const endpoint = `https://test-54f45-default-rtdb.firebaseio.com/claims/{TOKEN_ADDRESS}/claims/${cvgCVXAddress}/{ACTION}.json`;

type Action = 'index' | 'amount' | 'proof';
interface ActionResponse {
    index: number;
    amount: string;
    proof: string[];
}
type ActionType<T extends Action> = ActionResponse[T];

type MerkleData = {
    amount: string;
    index: number;
    token: string;
    merkleProof: string[];
};

const actionToKey: Record<Action, keyof MerkleData> = {
    index: 'index',
    amount: 'amount',
    proof: 'merkleProof',
};

const actions: Action[] = ['index', 'amount', 'proof'];

// TO UPDATE

export async function claimConvexBribes(
    signer: Provider | Signer,
    tokensList: string[]
) {
    const data: MerkleData[] = [];

    tokenLoop: for (const token of tokensList) {
        const tokenData: MerkleData = {
            token,
            index: 0,
            amount: '',
            merkleProof: [],
        };
        const url = endpoint.replace('{TOKEN_ADDRESS}', token.toUpperCase());

        for (const action of actions) {
            const data = (await (
                await fetch(url.replace('{ACTION}', action))
            ).json()) as ActionType<typeof action>;

            const key = actionToKey[action];

            // if one data is null, skip this token iteration
            if (data === null) continue tokenLoop;

            if (key === 'index') {
                tokenData[key] = data as ActionResponse['index'];
            } else if (key === 'amount') {
                tokenData[key] = data as ActionResponse['amount'];
            } else if (key === 'merkleProof') {
                tokenData[key] = data as ActionResponse['proof'];
            }
        }

        data.push(tokenData);
    }

    const multiMerkle = new Contract(
        CONVEX_MULTI_MERKLE_STASH,
        abiMerkle,
        signer
    );

    await multiMerkle.claimMulti(cvgCVXAddress, data);
}
