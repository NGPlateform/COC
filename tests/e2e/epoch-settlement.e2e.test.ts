import test from "node:test"
import assert from "node:assert/strict"

import { ChallengeFactory } from "../../services/challenger/challenge-factory.ts"
import { ChallengeQuota } from "../../services/challenger/challenge-quota.ts"
import { ReceiptVerifier } from "../../services/verifier/receipt-verifier.ts"
import { NonceRegistry } from "../../services/verifier/nonce-registry.ts"
import { BatchAggregator } from "../../services/aggregator/batch-aggregator.ts"
import { computeEpochRewards } from "../../services/verifier/scoring.ts"

test("e2e: two nodes epoch settlement pipeline", () => {
  const quota = new ChallengeQuota({
    maxPerEpoch: { U: 6, S: 2, R: 2 },
    minIntervalMs: { U: 1, S: 1, R: 1 },
  })

  const factory = new ChallengeFactory({
    challengerId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sign: (d) => `0xsig${d.slice(2, 18)}`,
  })

  const nodes = [
    "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  ] as const

  const verifier = new ReceiptVerifier({
    nonceRegistry: new NonceRegistry(),
    verifyChallengerSig: () => true,
    verifyNodeSig: () => true,
    verifyUptimeResult: () => true,
  })

  const verified = []
  for (let i = 0; i < nodes.length; i++) {
    const nodeId = nodes[i]
    const check = quota.canIssue(nodeId, 99n, "U", BigInt(1000 + i))
    assert.equal(check.ok, true)
    quota.commitIssue(nodeId, 99n, "U", BigInt(1000 + i))

    const challenge = factory.issue({
      epochId: 99n,
      nodeId,
      challengeType: "Uptime",
      randSeed: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      issuedAtMs: BigInt(1000 + i),
      querySpec: { method: "eth_getBlockByNumber", i },
    })

    const receipt = {
      challengeId: challenge.challengeId,
      nodeId,
      responseAtMs: BigInt(1500 + i),
      responseBody: { ok: true, height: i + 100 },
      nodeSig: "0xnode",
    }

    verified.push(verifier.toVerifiedReceipt(challenge, receipt, BigInt(1600 + i)))
  }

  const batch = new BatchAggregator({
    sampleSize: 2,
    signSummary: (s) => `0xagg${s.slice(2, 10)}`,
  }).buildBatch(99n, verified)

  const result = computeEpochRewards(1_000_000n, [
    { nodeId: nodes[0], uptimeBps: 9000, storageBps: 7500, relayBps: 6000, storageGb: 120n },
    { nodeId: nodes[1], uptimeBps: 8500, storageBps: 7200, relayBps: 5500, storageGb: 60n },
  ])

  const total = Object.values(result.rewards).reduce((a, b) => a + b, 0n) + result.treasuryOverflow
  assert.equal(batch.sampleProofs.length, 2)
  assert.equal(total, 1_000_000n)
  assert.equal(result.rewards[nodes[0]] > result.rewards[nodes[1]], true)
})
