import test from "node:test"
import assert from "node:assert/strict"
import { ChainEngine } from "./chain-engine.ts"
import { EvmChain } from "./evm.ts"
import { hashBlockPayload, zeroHash } from "./hash.ts"
import type { ChainBlock, ChainSnapshot, Hex } from "./blockchain-types.ts"

const NODE_ID = "node-1"

async function createTestEngine(): Promise<{ engine: ChainEngine; evm: EvmChain }> {
  const evm = await EvmChain.create(18780)
  await evm.prefund([{ address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", balanceWei: "10000000000000000000000" }])
  const engine = new ChainEngine(
    { dataDir: "/tmp/coc-consensus-test-" + Date.now(), nodeId: NODE_ID, validators: [NODE_ID], finalityDepth: 3, maxTxPerBlock: 50, minGasPriceWei: 1n },
    evm,
  )
  return { engine, evm }
}

test("snapshot with forged block hash is rejected", async () => {
  const { engine: engine1 } = await createTestEngine()
  const { engine: engine2 } = await createTestEngine()

  // Build valid chain
  for (let i = 0; i < 3; i++) {
    await engine1.proposeNextBlock()
  }

  const snapshot = engine1.makeSnapshot()
  // Forge a block hash
  snapshot.blocks[1].hash = "0x" + "ff".repeat(32) as Hex

  const adopted = await engine2.maybeAdoptSnapshot(snapshot)
  assert.equal(adopted, false)
  assert.equal(engine2.getHeight(), 0n)
})

test("snapshot with broken parent chain is rejected", async () => {
  const { engine: engine1 } = await createTestEngine()
  const { engine: engine2 } = await createTestEngine()

  for (let i = 0; i < 3; i++) {
    await engine1.proposeNextBlock()
  }

  const snapshot = engine1.makeSnapshot()
  // Break parent hash link
  snapshot.blocks[2].parentHash = "0x" + "aa".repeat(32) as Hex

  const adopted = await engine2.maybeAdoptSnapshot(snapshot)
  assert.equal(adopted, false)
})

test("snapshot with wrong block number sequence is rejected", async () => {
  const { engine: engine1 } = await createTestEngine()
  const { engine: engine2 } = await createTestEngine()

  for (let i = 0; i < 3; i++) {
    await engine1.proposeNextBlock()
  }

  const snapshot = engine1.makeSnapshot()
  // Skip a block number
  snapshot.blocks[1] = { ...snapshot.blocks[1], number: 5n }

  const adopted = await engine2.maybeAdoptSnapshot(snapshot)
  assert.equal(adopted, false)
})

test("valid snapshot is accepted", async () => {
  const { engine: engine1 } = await createTestEngine()
  const { engine: engine2 } = await createTestEngine()

  for (let i = 0; i < 5; i++) {
    await engine1.proposeNextBlock()
  }

  const snapshot = engine1.makeSnapshot()
  const adopted = await engine2.maybeAdoptSnapshot(snapshot)
  assert.equal(adopted, true)
  assert.equal(engine2.getHeight(), 5n)
})

test("empty snapshot is rejected", async () => {
  const { engine } = await createTestEngine()
  const emptySnapshot: ChainSnapshot = { blocks: [], updatedAtMs: Date.now() }
  const adopted = await engine.maybeAdoptSnapshot(emptySnapshot)
  assert.equal(adopted, false)
})

test("proposer produces blocks in round-robin", async () => {
  const evm1 = await EvmChain.create(18780)
  const engine1 = new ChainEngine(
    { dataDir: "/tmp/coc-consensus-rr-" + Date.now(), nodeId: "v1", validators: ["v1", "v2"], finalityDepth: 3, maxTxPerBlock: 50, minGasPriceWei: 1n },
    evm1,
  )

  // v1 should propose block 1
  const b1 = await engine1.proposeNextBlock()
  assert.ok(b1)
  assert.equal(b1.proposer, "v1")

  // v1 should NOT propose block 2 (it's v2's turn)
  const b2 = await engine1.proposeNextBlock()
  assert.equal(b2, null)
})
