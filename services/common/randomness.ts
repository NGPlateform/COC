import { keccak256Hex } from "../relayer/keccak256.ts"
import type { Hex32 } from "./pose-types.ts"

function encodeU64(value: bigint): Buffer {
  if (value < 0n || value > 0xffffffffffffffffn) {
    throw new Error("u64 out of range")
  }
  const out = Buffer.alloc(8)
  out.writeBigUInt64BE(value)
  return out
}

function encodeHex32(hex: Hex32): Buffer {
  return Buffer.from(hex.slice(2), "hex")
}

export function deriveEpochSeed(randSeed: Hex32, epochId: bigint): Hex32 {
  const raw = Buffer.concat([encodeHex32(randSeed), encodeU64(epochId)])
  return `0x${keccak256Hex(raw)}` as Hex32
}

export function drawDeterministicIndexes(seed: Hex32, total: number, count: number): number[] {
  if (total <= 0) {
    throw new Error("total must be positive")
  }
  const target = Math.min(total, Math.max(0, count))
  const selected = new Set<number>()

  let cursor = 0
  while (selected.size < target) {
    const cursorBuf = Buffer.alloc(8)
    cursorBuf.writeBigUInt64BE(BigInt(cursor))
    const digest = keccak256Hex(Buffer.concat([Buffer.from(seed.slice(2), "hex"), cursorBuf]))
    const idx = Number(BigInt(`0x${digest}`) % BigInt(total))
    selected.add(idx)
    cursor += 1
  }

  return [...selected].sort((a, b) => a - b)
}
