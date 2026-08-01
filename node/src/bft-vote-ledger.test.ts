import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BftVoteLedger } from "./bft-vote-ledger.ts"
import type { Hex } from "./blockchain-types.ts"

function tmpPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "bft-ledger-"))
  return join(dir, "sub", "bft-vote-ledger.json") // nested dir tests mkdirSync
}

const HASH_A = ("0x" + "a".repeat(64)) as Hex
const HASH_B = ("0x" + "b".repeat(64)) as Hex

test("records and reads prepare/commit commitments in-memory", () => {
  const l = new BftVoteLedger(null)
  l.recordPrepared(10n, HASH_A)
  l.recordCommitted(10n, HASH_A)
  assert.equal(l.getPrepared(10n), HASH_A)
  assert.equal(l.getCommitted(10n), HASH_A)
  assert.equal(l.getPrepared(11n), undefined)
})

test("persists across a simulated restart (durability)", () => {
  const path = tmpPath()
  const l1 = new BftVoteLedger(path)
  l1.recordPrepared(100n, HASH_A)
  l1.recordCommitted(100n, HASH_A)
  l1.recordPrepared(101n, HASH_B)
  assert.ok(existsSync(path), "ledger file written")

  // simulate process restart: brand new instance, same path
  const l2 = new BftVoteLedger(path)
  assert.equal(l2.getPrepared(100n), HASH_A, "prepare survives restart")
  assert.equal(l2.getCommitted(100n), HASH_A, "commit survives restart")
  assert.equal(l2.getPrepared(101n), HASH_B)
  // the snapshot maps rehydrate the coordinator's in-memory copies
  assert.equal(l2.snapshotPrepared().get(100n), HASH_A)
  assert.equal(l2.snapshotCommitted().get(100n), HASH_A)
  rmSync(join(path, "..", ".."), { recursive: true, force: true })
})

test("this is exactly the no-double-vote-on-restart guard the coordinator needs", () => {
  const path = tmpPath()
  // Node prepares height 200 with block A, then crashes.
  const before = new BftVoteLedger(path)
  before.recordPrepared(200n, HASH_A)

  // Restart: coordinator rehydrates localPreparedAt from the ledger.
  const after = new BftVoteLedger(path)
  const localPreparedAt = after.snapshotPrepared()
  const previouslyPrepared = localPreparedAt.get(200n)

  // The Phase R guard: a freshly-built candidate (block B) at the same height
  // must be refused because we already committed to A — no self-equivocation.
  assert.equal(previouslyPrepared, HASH_A)
  assert.notEqual(previouslyPrepared, HASH_B)
  rmSync(join(path, "..", ".."), { recursive: true, force: true })
})

test("prune drops entries at or below finalized height", () => {
  const path = tmpPath()
  const l = new BftVoteLedger(path)
  l.recordPrepared(5n, HASH_A)
  l.recordPrepared(6n, HASH_A)
  l.recordPrepared(7n, HASH_B)
  l.prune(6n)
  assert.equal(l.getPrepared(5n), undefined)
  assert.equal(l.getPrepared(6n), undefined)
  assert.equal(l.getPrepared(7n), HASH_B, "above-finalized entry retained")

  // pruning persists too
  const reloaded = new BftVoteLedger(path)
  assert.equal(reloaded.getPrepared(6n), undefined)
  assert.equal(reloaded.getPrepared(7n), HASH_B)
  rmSync(join(path, "..", ".."), { recursive: true, force: true })
})

test("clearAll wipes on validator-set change and persists", () => {
  const path = tmpPath()
  const l = new BftVoteLedger(path)
  l.recordPrepared(9n, HASH_A)
  l.recordCommitted(9n, HASH_A)
  l.clearAll()
  assert.equal(l.getPrepared(9n), undefined)
  assert.equal(l.getCommitted(9n), undefined)
  const reloaded = new BftVoteLedger(path)
  assert.equal(reloaded.snapshotPrepared().size, 0)
  assert.equal(reloaded.snapshotCommitted().size, 0)
  rmSync(join(path, "..", ".."), { recursive: true, force: true })
})

test("idempotent record of the same hash is a no-op (allows re-broadcast)", () => {
  const l = new BftVoteLedger(null)
  l.recordPrepared(1n, HASH_A)
  l.recordPrepared(1n, HASH_A) // must not throw / must stay A
  assert.equal(l.getPrepared(1n), HASH_A)
})

test("corrupt ledger file starts empty instead of crashing", () => {
  const path = tmpPath()
  mkdirSync(join(path, ".."), { recursive: true })
  writeFileSync(path, "{ this is not json")
  const l = new BftVoteLedger(path)
  assert.equal(l.snapshotPrepared().size, 0, "corrupt file → empty, no throw")
  rmSync(join(path, "..", ".."), { recursive: true, force: true })
})
