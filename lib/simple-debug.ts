import type { Hash, PublicClient } from "viem"

// Waits until the given transaction hash is confirmed in a block
export async function waitForBlockConfirmation(publicClient: PublicClient, txHash: Hash, confirmations: number = 1): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations })
}

// Optionally check base collateral balance after a transaction settles
// Returns the numeric balance for convenience
export async function checkBalanceAfterTransaction(
  publicClient: PublicClient,
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  erc20Abi: any
): Promise<number> {
  try {
    const balance = (await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account],
    })) as bigint
    return Number(balance)
  } catch {
    // Non-fatal utility; surface zero if read fails
    return 0
  }
}

