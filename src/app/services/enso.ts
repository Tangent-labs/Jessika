"use server"

import { AddressLike } from "ethers";


export interface UserStatus {
    hasUsedCode: boolean
    referralCode: string | null
    friends: number
}
export async function getQuoteAndRoute(
    amountIn: string,
    tokenOut: AddressLike,
    tokenIn: AddressLike,
    minAmountOut: string,
    from: AddressLike,
    to: AddressLike
) {
    const ensoResult = await getEnsoData(amountIn, tokenIn, tokenOut, from, to, minAmountOut)
    return {
        quote: BigInt(ensoResult?.amountOut || 0n),
        priceImpact: ensoResult?.priceImpact || 0,
        to: ensoResult?.tx.to,
        data: ensoResult?.tx.data

    }
}

export async function getEnsoData(
    amountIn: string,
    tokenIn: AddressLike,
    tokenOut: AddressLike,
    fromAddress: AddressLike | null,
    receiver: AddressLike,
    minAmountOut: string
) {
    try {
        const url = `https://api.enso.finance/api/v1/shortcuts/route?chainId=1&fromAddress=${!!fromAddress ? fromAddress : receiver}&receiver=${receiver}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&minAmountOut=${minAmountOut}&routingStrategy=router`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_ENSO_API_KEY}`,
            },
        })

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Failed to fetch Enso data:", error)
        return null
    }
}
