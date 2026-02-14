import test from "node:test"
import assert from "node:assert/strict"
import { assignEpochRoles, canRunForRole } from "./role-registry.ts"

const VALIDATORS = ["v1", "v2", "v3", "v4", "v5"]
const BLOCK_HASH = "0x" + "ab".repeat(32)

test("assignEpochRoles returns different challenger and aggregator", () => {
  const assignment = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  assert.notEqual(assignment.challenger, assignment.aggregator)
  assert.ok(VALIDATORS.includes(assignment.challenger))
  assert.ok(VALIDATORS.includes(assignment.aggregator))
})

test("assignEpochRoles is deterministic for same inputs", () => {
  const a1 = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  const a2 = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  assert.equal(a1.challenger, a2.challenger)
  assert.equal(a1.aggregator, a2.aggregator)
})

test("assignEpochRoles changes with different epoch", () => {
  const assignments = new Set<string>()
  for (let i = 0n; i < 20n; i++) {
    const a = assignEpochRoles(i, BLOCK_HASH, VALIDATORS)
    assignments.add(a.challenger)
  }
  // Over 20 epochs, we should see at least 2 different challengers
  assert.ok(assignments.size >= 2, `expected rotation, got ${assignments.size} unique challengers`)
})

test("assignEpochRoles changes with different block hash", () => {
  const a1 = assignEpochRoles(1n, "0x" + "aa".repeat(32), VALIDATORS)
  const a2 = assignEpochRoles(1n, "0x" + "bb".repeat(32), VALIDATORS)
  // Different seeds should usually produce different assignments
  // (not guaranteed, but with keccak256 should be different for these inputs)
  assert.ok(
    a1.challenger !== a2.challenger || a1.aggregator !== a2.aggregator,
    "expected different assignments for different block hashes",
  )
})

test("assignEpochRoles handles single validator", () => {
  const assignment = assignEpochRoles(1n, BLOCK_HASH, ["v1"])
  assert.equal(assignment.challenger, "v1")
  assert.equal(assignment.aggregator, "v1")
})

test("assignEpochRoles throws on empty validators", () => {
  assert.throws(() => assignEpochRoles(1n, BLOCK_HASH, []), /validators list must not be empty/)
})

test("canRunForRole returns true for assigned challenger", () => {
  const assignment = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  assert.equal(canRunForRole(assignment.challenger, "challenger", 1n, BLOCK_HASH, VALIDATORS), true)
})

test("canRunForRole returns false for non-assigned challenger", () => {
  const assignment = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  const nonChallenger = VALIDATORS.find((v) => v !== assignment.challenger)!
  assert.equal(canRunForRole(nonChallenger, "challenger", 1n, BLOCK_HASH, VALIDATORS), false)
})

test("canRunForRole returns true for assigned aggregator", () => {
  const assignment = assignEpochRoles(1n, BLOCK_HASH, VALIDATORS)
  assert.equal(canRunForRole(assignment.aggregator, "aggregator", 1n, BLOCK_HASH, VALIDATORS), true)
})

test("10 epoch rotation has no overlap (challenger !== aggregator)", () => {
  for (let i = 0n; i < 10n; i++) {
    const a = assignEpochRoles(i, BLOCK_HASH, VALIDATORS)
    assert.notEqual(a.challenger, a.aggregator, `epoch ${i}: challenger and aggregator overlap`)
  }
})

test("roles distribute across validators over many epochs", () => {
  const challengerCounts = new Map<string, number>()
  const aggregatorCounts = new Map<string, number>()
  for (const v of VALIDATORS) {
    challengerCounts.set(v, 0)
    aggregatorCounts.set(v, 0)
  }

  for (let i = 0n; i < 100n; i++) {
    const hash = "0x" + i.toString(16).padStart(64, "0")
    const a = assignEpochRoles(i, hash, VALIDATORS)
    challengerCounts.set(a.challenger, (challengerCounts.get(a.challenger) ?? 0) + 1)
    aggregatorCounts.set(a.aggregator, (aggregatorCounts.get(a.aggregator) ?? 0) + 1)
  }

  // Each validator should have been challenger at least once
  for (const [v, count] of challengerCounts) {
    assert.ok(count > 0, `${v} was never challenger`)
  }
  // Each validator should have been aggregator at least once
  for (const [v, count] of aggregatorCounts) {
    assert.ok(count > 0, `${v} was never aggregator`)
  }
})
