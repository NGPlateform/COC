import test from "node:test"
import assert from "node:assert/strict"
import { BatchAggregator } from "./batch-aggregator.ts"
import type { VerifiedReceipt } from "../common/pose-types.ts"

const mkReceipt = (n: number): VerifiedReceipt => ({
  challenge: {
    challengeId: `0x${"1".repeat(63)}${n}` as `0x${string}`,
    epochId: 1n,
    nodeId: "0x2222222222222222222222222222222222222222222222222222222222222222",
    challengeType: "U",
    nonce: "0x1234567890abcdef1234567890abcdef",
    randSeed: "0x3333333333333333333333333333333333333333333333333333333333333333",
    issuedAtMs: 1000n,
    deadlineMs: 2500,
    querySpec: {},
    challengerId: "0x4444444444444444444444444444444444444444444444444444444444444444",
    challengerSig: "0xabc",
  },
  receipt: {
    challengeId: `0x${"1".repeat(63)}${n}` as `0x${string}`,
    nodeId: "0x2222222222222222222222222222222222222222222222222222222222222222",
    responseAtMs: BigInt(1200 + n),
    responseBody: { ok: true, i: n },
    nodeSig: "0xdef",
  },
  verifiedAtMs: 1300n,
  responseBodyHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
})

test("batch aggregator builds deterministic batch", () => {
  const agg = new BatchAggregator({
    sampleSize: 2,
    signSummary: (s) => `0xsig${s.slice(2, 10)}`,
  })

  const receipts = [mkReceipt(1), mkReceipt(2), mkReceipt(3)]
  const batch = agg.buildBatch(1n, receipts)

  assert.equal(batch.leafHashes.length, 3)
  assert.equal(batch.sampleProofs.length, 2)
  assert.equal(batch.sampleProofs[0].leafIndex < batch.sampleProofs[1].leafIndex, true)
  assert.equal(batch.sampleProofs[0].merkleProof.length > 0, true)
  assert.equal(batch.merkleRoot.length, 66)
  assert.equal(batch.summaryHash.length, 66)
})
