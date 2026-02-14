import type { CrossLayerEnvelope } from "./message-types.ts"
import { keccak256Hex } from "./keccak256.ts"

export class ReplayGuard {
  private readonly lastNonceByChannel = new Map<string, bigint>()
  private readonly replayKeys = new Set<string>()

  buildReplayKey(envelope: CrossLayerEnvelope): string {
    const encoded = Buffer.concat([
      encodeU64(envelope.srcChainId),
      encodeU64(envelope.dstChainId),
      encodeBytes32(envelope.channelId),
      encodeU64(envelope.nonce),
      encodeBytes32(envelope.payloadHash),
    ])
    return keccak256Hex(encoded)
  }

  validate(envelope: CrossLayerEnvelope): { ok: boolean; reason?: string; replayKey: string } {
    if (envelope.srcChainId === envelope.dstChainId) {
      return { ok: false, reason: "invalid chain route", replayKey: "" }
    }

    const channelKey = `${envelope.srcChainId}:${envelope.channelId}`
    const last = this.lastNonceByChannel.get(channelKey)
    if (last !== undefined && envelope.nonce <= last) {
      return { ok: false, reason: "nonce not monotonic", replayKey: "" }
    }

    const replayKey = this.buildReplayKey(envelope)
    if (this.replayKeys.has(replayKey)) {
      return { ok: false, reason: "replay key already seen", replayKey }
    }

    return { ok: true, replayKey }
  }

  commit(envelope: CrossLayerEnvelope, replayKey: string): void {
    const channelKey = `${envelope.srcChainId}:${envelope.channelId}`
    this.lastNonceByChannel.set(channelKey, envelope.nonce)
    this.replayKeys.add(replayKey)
  }
}

function encodeU64(value: number | bigint): Buffer {
  const n = typeof value === "bigint" ? value : BigInt(value)
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new Error("u64 out of range")
  }
  const out = Buffer.alloc(8)
  out.writeBigUInt64BE(n)
  return out
}

function encodeBytes32(hex: string): Buffer {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("bytes32 hex required")
  }
  return Buffer.from(normalized, "hex")
}
