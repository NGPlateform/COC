import test from "node:test"
import assert from "node:assert/strict"
import { deriveEpochSeed, drawDeterministicIndexes } from "./randomness.ts"

test("deriveEpochSeed deterministic by epoch", () => {
  const randSeed = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  const s1 = deriveEpochSeed(randSeed, 1n)
  const s1b = deriveEpochSeed(randSeed, 1n)
  const s2 = deriveEpochSeed(randSeed, 2n)
  assert.equal(s1, s1b)
  assert.notEqual(s1, s2)
})

test("drawDeterministicIndexes stable and bounded", () => {
  const seed = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  const a = drawDeterministicIndexes(seed, 10, 4)
  const b = drawDeterministicIndexes(seed, 10, 4)
  assert.deepEqual(a, b)
  assert.equal(a.length, 4)
  assert.equal(a.every((x) => x >= 0 && x < 10), true)
})
