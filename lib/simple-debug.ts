import type { PublicClient } from 'viem'

export async function waitForBlockConfirmation(publicClient: PublicClient, txHash: `0x${string}`, confirmations = 1): Promise<void> {
  let count = 0
  while (count < confirmations) {
    // Poll every ~1s for simplicity
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1000))
    // eslint-disable-next-line no-await-in-loop
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
    if (receipt && receipt.blockNumber) {
      count += 1
    }
  }
}

export async function checkBalanceAfterTransaction(): Promise<void> {
  // Placeholder util to satisfy imports; extend as needed for richer debug flows
  return
}


