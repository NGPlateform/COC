import test from "node:test"
import assert from "node:assert/strict"
import { NonceRegistry } from "./nonce-registry.ts"
import type { ChallengeMessage } from "../common/pose-types.ts"

const challenge: ChallengeMessage = {
  challengeId: "0x1111111111111111111111111111111111111111111111111111111111111111",
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
}

test("nonce registry rejects replay", () => {
  const registry = new NonceRegistry()
  assert.equal(registry.consume(challenge), true)
  assert.equal(registry.consume(challenge), false)
})
