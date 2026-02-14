import { keccak256Hex } from "../relayer/keccak256.ts"
import { buildMerkleProof, buildMerkleRoot, hashVerifiedReceipt } from "../common/merkle.ts"
import type { Hex32, VerifiedReceipt } from "../common/pose-types.ts"

export interface SampleProof {
  leaf: Hex32
  leafIndex: number
  merkleProof: Hex32[]
}

export interface ReceiptBatch {
  epochId: bigint
  merkleRoot: Hex32
  summaryHash: Hex32
  leafHashes: Hex32[]
  sampleProofs: SampleProof[]
  aggregatorSig: `0x${string}`
}

export interface BatchAggregatorConfig {
  sampleSize: number
  signSummary: (summaryHash: Hex32) => `0x${string}`
}

export class BatchAggregator {
  private readonly config: BatchAggregatorConfig

  constructor(config: BatchAggregatorConfig) {
    this.config = config
  }

  buildBatch(epochId: bigint, receipts: VerifiedReceipt[]): ReceiptBatch {
    if (receipts.length === 0) {
      throw new Error("empty receipt batch")
    }

    const leafHashes = receipts.map((r) => hashVerifiedReceipt(r))
    const merkleRoot = buildMerkleRoot(leafHashes)
    const sampleIndexes = this.pickSampleIndexes(leafHashes.length, epochId)
    const sampleProofs = sampleIndexes.map((leafIndex) => ({
      leaf: leafHashes[leafIndex],
      leafIndex,
      merkleProof: buildMerkleProof(leafHashes, leafIndex),
    }))
    const summaryHash = this.buildSummaryHash(epochId, merkleRoot, sampleProofs)
    const aggregatorSig = this.config.signSummary(summaryHash)

    return {
      epochId,
      merkleRoot,
      summaryHash,
      leafHashes,
      sampleProofs,
      aggregatorSig,
    }
  }

  private buildSummaryHash(epochId: bigint, merkleRoot: Hex32, sampleProofs: SampleProof[]): Hex32 {
    const sampleCommitment = this.buildSampleCommitment(sampleProofs)
    const encoded = Buffer.concat([
      this.u64(epochId),
      this.hex32(merkleRoot),
      this.hex32(sampleCommitment),
      this.u32(sampleProofs.length),
    ])
    return `0x${keccak256Hex(encoded)}` as Hex32
  }

  private buildSampleCommitment(sampleProofs: SampleProof[]): Hex32 {
    let rolling = `0x${"0".repeat(64)}` as Hex32
    for (const proof of sampleProofs) {
      const encoded = Buffer.concat([
        this.hex32(rolling),
        this.u32(proof.leafIndex),
        this.hex32(proof.leaf),
      ])
      rolling = `0x${keccak256Hex(encoded)}` as Hex32
    }
    return rolling
  }

  private pickSampleIndexes(leafCount: number, epochId: bigint): number[] {
    const max = Math.min(this.config.sampleSize, leafCount)
    const selected = new Set<number>()

    let cursor = 0
    while (selected.size < max) {
      const seed = Buffer.concat([
        Buffer.from(epochId.toString(16).padStart(16, "0"), "hex"),
        Buffer.from(cursor.toString(16).padStart(8, "0"), "hex"),
      ])
      const digest = keccak256Hex(seed)
      const idx = Number(BigInt(`0x${digest}`) % BigInt(leafCount))
      selected.add(idx)
      cursor += 1
    }

    return [...selected].sort((a, b) => a - b)
  }

  private hex32(value: Hex32): Buffer {
    return Buffer.from(value.slice(2), "hex")
  }

  private u64(value: bigint): Buffer {
    const b = Buffer.alloc(8)
    b.writeBigUInt64BE(value)
    return b
  }

  private u32(value: number): Buffer {
    const b = Buffer.alloc(4)
    b.writeUInt32BE(value)
    return b
  }
}
