import test from "node:test"
import assert from "node:assert/strict"
import { ChallengeFactory } from "./challenge-factory.ts"

const signer = (digest: `0x${string}`): `0x${string}` => `0xsig${digest.slice(2, 18)}`

const factory = new ChallengeFactory({
  challengerId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  sign: signer,
})

test("challenge factory issues storage challenge with 6s deadline", () => {
  const c = factory.issue({
    epochId: 7n,
    nodeId: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    challengeType: "Storage",
    randSeed: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    issuedAtMs: 1000n,
    querySpec: { chunkId: "chunk-1" },
  })

  assert.equal(c.deadlineMs, 6000)
  assert.equal(c.challengeType, "S")
  assert.equal(c.nonce.length, 34)
  assert.equal(c.challengeId.length, 66)
})
