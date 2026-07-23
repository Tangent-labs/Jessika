export const VLSDT_MULTISIG = '0x6ceE94bFCD5a7dEFDBEF337Bf79fE31D0982CF2A';
export const BOOTSTRAPPING_MODULE = "0x2927D7D70943290529Adc517E8E2Dc1eEE7818b6"

export const VLCVX_MULTISIG = '0x11B6B453019DcdE7F0048348ff954bF29a6D6853';
// Contract recoverTokens() is claimed from into the vlCVX multisig.
export const CVGCVX_CONTRACT = '0x2191DF768ad71140F9F3E96c1e4407A4aA31d082';


export const CVX = "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b"
// Selectable fee tokens for the cvgCVX "Claim fees to multisig" step.
// TODO: CRV address is a placeholder — replace with the real CRV token address.
export const CVGCVX_FEE_TOKENS = [
    { address: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b', symbol: 'CVX', decimals: 18 },
    { address: '0x04acaf8d2865c0714f79da09645c13fd2888977f', symbol: 'WFRAX', decimals: 18 },
    { address: '0xD533a949740bb3306d119CC777fa900bA034cd52', symbol: 'CRV', decimals: 18 }, // TODO: placeholder, not a real address
];

// TODO: placeholder — replace with the real CVX/cvgCVX pool address once available.
export const CVX_CVGCVX_LP = '0xc50e191f703fb3160fc15d8b168a8c740fec3666';
// to their REWARD_TOKEN at deployment, so symbol and decimals cannot drift.
export const VLSDT_FEE_DISTRIBUTORS = [
    {
        address: '0xca94395469a88e9cac0d5e5e308910e298270d30',
        symbol: 'USDC',
        decimals: 6,
    },
    {
        address: '0x6d57d34259f6dc31c9a241c199822861940d38f9',
        symbol: 'SDT',
        decimals: 18,
    },
];

export const SD_STAKINGS = [
    {
        key: '0xF941BC649Ef0B20ABd7f6dC78CA8f8E225337933',
        displayKey: 'cvgSDT',
    },
    {
        key: '0x2FF160bcADb485b5F048b9880e6f471Af632060c',
        displayKey: 'sdCRV',
        sdToken: "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5"

    },
    {
        key: '0x508f0E1b565b40AeB94671BeD228083203330882',
        displayKey: 'sdPENDLE',
        sdToken: "0x5Ea630e00D6eE438d3deA1556A110359ACdc10A9"

    },
    {
        key: '0x35e30Bc815935Bb5EC1743f772331864D780cc26',
        displayKey: 'sdFXN',
        sdToken: "0xe19d1c837B8A1C83A56cD9165b2c0256D39653aD"

    },
    {
        key: '0xAf5b3f4A0b4dc334dB7137E5584E0e971E5e4962',
        displayKey: 'sdBAL',
        sdToken: "0xF24d8651578a55b0C119B9910759a351A3458895"

    },
]

export const cvgCVX_STAKING = {
    key: '0x2c1D293c50C6d1a4370ebb442A02c5956bbAb119'.toLowerCase(),
    displayKey: 'cvgCVX',
}

export const USG = '0xb1c2db5d6ca03fce73dbd304d320bf76c55ae1b1';
export const sUSG = '0xf17d6f98a5c6eaa99d149079984119e0a4ef6900';
export const FEE_TRESO_MULTI = '0x536d4e9C0944dE2aC6657d610Aa99fA5e97Ce493';

// Tokens the treasury multisig can accumulate as fees, dumped to USDC then USG.
export const USG_FEE_TOKENS = [
    { address: '0x365accfca291e7d3914637abf1f7635db165bb09', symbol: 'FXN', decimals: 18 },
    { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', symbol: 'CRV', decimals: 18 },
    { address: '0xd1b5651e55d4ceed36251c61c50c889b36f6abb5', symbol: 'sdCRV', decimals: 18 },
    { address: '0xe19d1c837b8a1c83a56cd9165b2c0256d39653ad', symbol: 'sdFXN', decimals: 18 },
    { address: '0x6c3ea9036406852006290770bedfcaba0e23a0e8', symbol: 'PYUSD', decimals: 6 },
    { address: '0x8292bb45bf1ee4d140127049757c2e0ff06317ed', symbol: 'RLUSD', decimals: 18 },
    { address: '0x6440f144b7e50d6a8439336510312d2f54beb01d', symbol: 'BOLD', decimals: 18 },
];



export const REWARDS: { [token: string]: { name: string, decimals?: number } } = {
    ["0x5af15DA84A4a6EDf2d9FA6720De921E1026E37b7".toLowerCase()]: {
        name: "sdFrax3CRV",
    },
    ["0x830614aE209FF9d8706d386fcdBc7a55206fcffC".toLowerCase()]: {
        name: "cvgSDT",
    },

    ["0x999999999991e178d52cd95afd4b00d066664144".toLowerCase()]: {
        name: "sPENDLE",
    },
    ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase()]: {
        name: "USDC",
        decimals: 6
    },
    ["0xF24d8651578a55b0C119B9910759a351A3458895".toLowerCase()]: {
        name: "sdBAL",
    },
    ["0xba100000625a3754423978a60c9317c58a424e3D".toLowerCase()]: {
        name: "BAL",
    },
    ["0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5".toLowerCase()]: {
        name: "sdCRV",
    },
    ["0xD533a949740bb3306d119CC777fa900bA034cd52".toLowerCase()]: {
        name: "CRV"
    },
    ["0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E".toLowerCase()]: {
        name: "crvUSD"
    },
    ["0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0".toLowerCase()]: {
        name: "wstETH"
    },
    ["0xe19d1c837B8A1C83A56cD9165b2c0256D39653aD".toLowerCase()]: {
        name: "sdFXN"
    },
    ["0x5Ea630e00D6eE438d3deA1556A110359ACdc10A9".toLowerCase()]: {
        name: "sdPENDLE"
    },
    ["0x808507121B80c02388fAd14726482e061B8da827".toLowerCase()]: {
        name: "PENDLE"
    },
    ["0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase()]: {
        name: "USDT",
        decimals: 6
    },
    ["0x2191DF768ad71140F9F3E96c1e4407A4aA31d082".toLowerCase()]: {
        name: "cvxCVX"
    }

}