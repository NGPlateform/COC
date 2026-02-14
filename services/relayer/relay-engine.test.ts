import test from "node:test"
import assert from "node:assert/strict"
import { RelayEngine, type RelaySink } from "./relay-engine.ts"
import { ReplayGuard } from "./replay-guard.ts"
import { CrossLayerMessageType, type CrossLayerEnvelope } from "./message-types.ts"

function envelope(nonce: bigint): CrossLayerEnvelope {
  return {
    srcChainId: 1,
    dstChainId: 10,
    channelId: "0x3333333333333333333333333333333333333333333333333333333333333333",
    nonce,
    payloadHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
    sourceBlockNumber: 120n,
    sourceTxHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    messageType: CrossLayerMessageType.BatchSubmitted,
    payload: { epochId: 1 },
  }
}

test("relay failure does not commit replay guard state", async () => {
  const guard = new ReplayGuard()
  const failingSink: RelaySink = {
    async forward() {
      throw new Error("sink down")
    },
  }
  const engine = new RelayEngine(guard, failingSink)

  const first = await engine.relay(envelope(1n))
  assert.equal(first.accepted, false)

  const retry = await engine.relay(envelope(1n))
  assert.equal(retry.accepted, false)
  assert.equal(retry.reason, "sink down")
})

test("relay success commits and blocks same nonce", async () => {
  const guard = new ReplayGuard()
  const okSink: RelaySink = {
    async forward() {},
  }
  const engine = new RelayEngine(guard, okSink)

  const first = await engine.relay(envelope(2n))
  assert.equal(first.accepted, true)

  const second = await engine.relay(envelope(2n))
  assert.equal(second.accepted, false)
  assert.equal(second.reason, "nonce not monotonic")
})
