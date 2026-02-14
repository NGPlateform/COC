import test from "node:test"
import assert from "node:assert/strict"
import { AntiCheatPolicy, EvidenceReason } from "./anti-cheat-policy.ts"
import type { ChallengeMessage } from "../common/pose-types.ts"

const challenge: ChallengeMessage = {
  challengeId: "0x1111111111111111111111111111111111111111111111111111111111111111",
  epochId: 9n,
  nodeId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  challengeType: "S",
  nonce: "0x1234567890abcdef1234567890abcdef",
  randSeed: "0x3333333333333333333333333333333333333333333333333333333333333333",
  issuedAtMs: 1000n,
  deadlineMs: 6000,
  querySpec: { chunkId: "x" },
  challengerId: "0x4444444444444444444444444444444444444444444444444444444444444444",
  challengerSig: "0xabc",
}

test("anti-cheat evidence is deterministic", () => {
  const policy = new AntiCheatPolicy()
  const a = policy.buildEvidence(EvidenceReason.StorageProofInvalid, challenge, undefined, { proof: "bad" })
  const b = policy.buildEvidence(EvidenceReason.StorageProofInvalid, challenge, undefined, { proof: "bad" })
  assert.equal(a.evidenceHash, b.evidenceHash)
  assert.equal(a.reasonCode, EvidenceReason.StorageProofInvalid)
})
