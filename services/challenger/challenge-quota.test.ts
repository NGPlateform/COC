import test from "node:test"
import assert from "node:assert/strict"
import { ChallengeQuota } from "./challenge-quota.ts"

const quota = new ChallengeQuota({
  maxPerEpoch: { U: 2, S: 1, R: 1 },
  minIntervalMs: { U: 1000, S: 1000, R: 1000 },
})

const nodeId = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

test("quota enforces per-epoch cap", () => {
  const c1 = quota.canIssue(nodeId, 1n, "U", 1000n)
  assert.equal(c1.ok, true)
  quota.commitIssue(nodeId, 1n, "U", 1000n)

  const c2 = quota.canIssue(nodeId, 1n, "U", 2500n)
  assert.equal(c2.ok, true)
  quota.commitIssue(nodeId, 1n, "U", 2500n)

  const c3 = quota.canIssue(nodeId, 1n, "U", 4000n)
  assert.equal(c3.ok, false)
  assert.equal(c3.reason, "quota exceeded")
})

test("quota enforces rate limit", () => {
  const q = new ChallengeQuota({
    maxPerEpoch: { U: 10, S: 10, R: 10 },
    minIntervalMs: { U: 1000, S: 1000, R: 1000 },
  })
  assert.equal(q.canIssue(nodeId, 2n, "S", 1000n).ok, true)
  q.commitIssue(nodeId, 2n, "S", 1000n)

  const blocked = q.canIssue(nodeId, 2n, "S", 1500n)
  assert.equal(blocked.ok, false)
  assert.equal(blocked.reason, "rate limited")
})
