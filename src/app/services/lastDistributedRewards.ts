import { cvgCVX_STAKING, REWARDS, SD_STAKINGS } from "../config";
import { ethers, Interface } from "ethers";
import { BrowserProvider } from "ethers";


const ETHERSCAN_API = "Y6R57JU6DIDE8HMWW4QEI3C9U5KXDTUQJ1"
const abi = [
    "event ProcessSdtRewards(uint256 indexed cycleId, address operator, (address token, uint256 amount)[] tokenAmounts)",
    "event ProcessCvxRewards(uint256 indexed cycleId, address operator, (address token, uint256 amount)[] tokenAmounts)",
];
const sdTokensFee = BigInt(1_000)
const processorFee = BigInt(100)
const topicSigProcessSdtReward = "0x5aa1db1781527b9b0dfe45fff393df19af814adcf37f641a0aaa8794dcba454b"
const topicSigProcessCvxReward = "0xc8a87ef3ee1edf48d056fbd9dac1aba093f6b527775438532f3a68897192b35a"


const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLastEventsLiquidboost(provider: BrowserProvider) {
    const toBlock = (await provider.getBlock("latest")!)!.number
    const fromBlock = toBlock - 50_000;

    const promises: Promise<Response>[] = []
    SD_STAKINGS.forEach(staking => {
        const url = `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${staking.key}&fromBlock=${fromBlock}&toBlock=${toBlock}&page=1&offset=1000&apikey=${ETHERSCAN_API}`
        promises.push(fetch(url))
    })


    SD_STAKINGS.push({ displayKey: "cvgCVX", key: "" })


    const responses = await Promise.all(promises)

    await wait(1_000)

    const respCvgCVX = await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${cvgCVX_STAKING.key}&fromBlock=${fromBlock}&toBlock=${toBlock}&page=1&offset=1000&apikey=${ETHERSCAN_API}`)

    responses.push(respCvgCVX)


    const tokenDistributed: { staking: string, rewards: { name: string, amount: number, amountUsd?: number, address: string }[] }[] = []
    const iface = new Interface(abi);
    const allRewards: string[] = []
    for (let i = 0; i < responses.length; i++) {
        const sdTokenConfig = SD_STAKINGS[i]
        const rrrr: { name: string, amount: number, address: string }[] = [];

        const response = await responses[i].json();
        const events = response.result

        for (let j = 0; j < events.length; j++) {
            const event = events[j];
            const topics = event.topics
            if (topics[0].toLowerCase() === topicSigProcessSdtReward.toLowerCase()) {
                const data = iface.parseLog(event)!;

                const distributedRewards = data.args[2]
                distributedRewards.forEach((rewards: any[]) => {
                    const token = rewards[0].toLowerCase()
                    let amount = rewards[1]

                    if (token === sdTokenConfig?.sdToken?.toLowerCase()) {
                        // Compute reward amount before fee
                        amount = amount * (BigInt(10_000)) / (BigInt(10_000) - sdTokensFee)
                    }
                    amount = amount * (BigInt(10_000)) / (BigInt(10_000) - processorFee)
                    const rewardConfig = REWARDS[token]
                    allRewards.push(token)
                    const decimals = rewardConfig.decimals ? rewardConfig.decimals : 18
                    rrrr.push({ name: REWARDS[token].name, amount: Number(ethers.formatUnits(amount, decimals)), address: token })
                })
            } else if (topics[0].toLowerCase() === topicSigProcessCvxReward.toLowerCase()) {
                const data = iface.parseLog(event)!;

                const distributedRewards = data.args[2]
                distributedRewards.forEach((rewards: any[]) => {
                    const token = rewards[0].toLowerCase()
                    let amount = rewards[1]

                    amount = amount * (BigInt(10_000)) / (BigInt(10_000) - processorFee)
                    const rewardConfig = REWARDS[token]
                    allRewards.push(token)
                    const decimals = rewardConfig.decimals ? rewardConfig.decimals : 18
                    rrrr.push({ name: REWARDS[token].name, amount: Number(ethers.formatUnits(amount, decimals)), address: token })
                })
            }
        }
        tokenDistributed.push({ staking: sdTokenConfig.displayKey.toLowerCase(), rewards: rrrr })
    }


    const pricesDeFiLlama = await (await fetch(`https://coins.llama.fi/prices/current/${allRewards.map(a => "ethereum:" + a).join(",")}`)).json()
    const pricesCvg = await (await fetch(`https://api.cvg.finance/asset-prices/0x5af15da84a4a6edf2d9fa6720de921e1026e37b7,0x3E8C72655e48591d93e6dfdA16823dB0fF23d859`)).json()
    let totalUSD = 0
    tokenDistributed.forEach(staking => {
        staking.rewards.forEach(r => {
            let price = pricesDeFiLlama.coins["ethereum:" + r.address]?.price

            // sdFrax3CRV
            if (r.address.toLowerCase() === "0x5af15DA84A4a6EDf2d9FA6720De921E1026E37b7".toLowerCase()) {
                price = pricesCvg["0x5af15DA84A4a6EDf2d9FA6720De921E1026E37b7"]
            }
            // sdBAL
            else if (r.address.toLowerCase() === "0xf24d8651578a55b0c119b9910759a351a3458895".toLowerCase()) {
                price = pricesCvg["0x3E8C72655e48591d93e6dfdA16823dB0fF23d859"]
            }
            r.amountUsd = r.amount * price
            totalUSD += r.amountUsd
        })
    })


    return { tokenDistributed, totalUSD }

}