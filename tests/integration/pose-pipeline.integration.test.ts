import test from "node:test"
import assert from "node:assert/strict"

import { ChallengeFactory } from "../../services/challenger/challenge-factory.ts"
import { ReceiptVerifier } from "../../services/verifier/receipt-verifier.ts"
import { NonceRegistry } from "../../services/verifier/nonce-registry.ts"
import { BatchAggregator } from "../../services/aggregator/batch-aggregator.ts"
import { computeEpochRewards } from "../../services/verifier/scoring.ts"

test("integration: challenge -> verify -> batch -> score", () => {
  const factory = new ChallengeFactory({
    challengerId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sign: (d) => `0xsig${d.slice(2, 18)}`,
  })

  const challenge = factory.issue({
    epochId: 10n,
    nodeId: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    challengeType: "Uptime",
    randSeed: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    issuedAtMs: 1_000n,
    querySpec: { method: "eth_blockNumber" },
  })

  const receipt = {
    challengeId: challenge.challengeId,
    nodeId: challenge.nodeId,
    responseAtMs: 2_000n,
    responseBody: { result: "0x99" },
    nodeSig: "0xnode",
  }

  const verifier = new ReceiptVerifier({
    nonceRegistry: new NonceRegistry(),
    verifyChallengerSig: () => true,
    verifyNodeSig: () => true,
    verifyUptimeResult: () => true,
  })

  const verified = verifier.toVerifiedReceipt(challenge, receipt, 2_100n)

  const aggregator = new BatchAggregator({
    sampleSize: 1,
    signSummary: (s) => `0xagg${s.slice(2, 10)}`,
  })
  const batch = aggregator.buildBatch(10n, [verified])

  const rewards = computeEpochRewards(100_000n, [
    {
      nodeId: challenge.nodeId,
      uptimeBps: 9000,
      storageBps: 0,
      relayBps: 0,
      storageGb: 0n,
    },
  ])

  assert.equal(batch.leafHashes.length, 1)
  assert.equal(batch.merkleRoot.length, 66)
  assert.equal(rewards.rewards[challenge.nodeId] > 0n, true)
})
