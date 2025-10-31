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



export const REWARDS: { [token: string]: { name: string, decimals?: number } } = {
    ["0x5af15DA84A4a6EDf2d9FA6720De921E1026E37b7".toLowerCase()]: {
        name: "sdFrax3CRV",
    },
    ["0x830614aE209FF9d8706d386fcdBc7a55206fcffC".toLowerCase()]: {
        name: "cvgSDT",
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