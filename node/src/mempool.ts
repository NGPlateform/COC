import { Transaction } from "ethers"
import type { Hex, MempoolTx } from "./blockchain-types.ts"

export class Mempool {
  private readonly txs = new Map<Hex, MempoolTx>()

  addRawTx(rawTx: Hex): MempoolTx {
    const tx = Transaction.from(rawTx)
    if (!tx.from) {
      throw new Error("invalid tx: missing sender")
    }
    const gasPrice = tx.gasPrice ?? tx.maxFeePerGas ?? 0n
    const item: MempoolTx = {
      hash: tx.hash as Hex,
      rawTx,
      from: tx.from.toLowerCase() as Hex,
      nonce: BigInt(tx.nonce),
      gasPrice,
      receivedAtMs: Date.now(),
    }
    this.txs.set(item.hash, item)
    return item
  }

  has(hash: Hex): boolean {
    return this.txs.has(hash)
  }

  remove(hash: Hex): void {
    this.txs.delete(hash)
  }

  size(): number {
    return this.txs.size
  }

  async pickForBlock(
    maxTx: number,
    getOnchainNonce: (address: Hex) => Promise<bigint>,
    minGasPriceWei: bigint,
  ): Promise<MempoolTx[]> {
    if (maxTx <= 0 || this.txs.size === 0) {
      return []
    }

    const sorted = [...this.txs.values()]
      .filter((tx) => tx.gasPrice >= minGasPriceWei)
      .sort((a, b) => {
        if (a.gasPrice !== b.gasPrice) return a.gasPrice > b.gasPrice ? -1 : 1
        if (a.nonce !== b.nonce) return a.nonce < b.nonce ? -1 : 1
        return a.receivedAtMs - b.receivedAtMs
      })

    const picked: MempoolTx[] = []
    const expected = new Map<Hex, bigint>()

    for (const tx of sorted) {
      if (picked.length >= maxTx) break
      let next = expected.get(tx.from)
      if (next === undefined) {
        next = await getOnchainNonce(tx.from)
      }
      if (tx.nonce !== next) {
        expected.set(tx.from, next)
        continue
      }
      picked.push(tx)
      expected.set(tx.from, next + 1n)
    }

    return picked
  }
}
