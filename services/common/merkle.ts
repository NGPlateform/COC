import { keccak256Hex } from "../relayer/keccak256.ts"
import type { Hex32, VerifiedReceipt } from "./pose-types.ts"

function hexToBytes(hex: string): Buffer {
  const n = hex.startsWith("0x") ? hex.slice(2) : hex
  return Buffer.from(n, "hex")
}

function toHex32(hex: string): Hex32 {
  return `0x${hex}`
}

export function hashVerifiedReceipt(item: VerifiedReceipt): Hex32 {
  const encoded = Buffer.concat([
    hexToBytes(item.challenge.challengeId),
    hexToBytes(item.receipt.nodeId),
    Buffer.from(item.receipt.responseAtMs.toString(16).padStart(16, "0"), "hex"),
    hexToBytes(item.responseBodyHash),
  ])
  return toHex32(keccak256Hex(encoded))
}

export function buildMerkleRoot(leaves: Hex32[]): Hex32 {
  if (leaves.length === 0) {
    return toHex32(keccak256Hex(new Uint8Array()))
  }
  if (leaves.length === 1) {
    return parentHash(leaves[0], leaves[0])
  }

  return buildMerkleLayers(leaves).at(-1)![0]
}

export function buildMerkleProof(leaves: Hex32[], index: number): Hex32[] {
  if (leaves.length === 0) {
    throw new Error("empty leaves")
  }
  if (index < 0 || index >= leaves.length) {
    throw new Error("invalid index")
  }
  if (leaves.length === 1) {
    return [leaves[0]]
  }

  const layers = buildMerkleLayers(leaves)
  const proof: Hex32[] = []
  let cursor = index

  for (let depth = 0; depth < layers.length - 1; depth += 1) {
    const layer = layers[depth]
    const siblingIndex = cursor % 2 === 0 ? cursor + 1 : cursor - 1
    const sibling = layer[siblingIndex] ?? layer[cursor]
    proof.push(sibling)
    cursor = Math.floor(cursor / 2)
  }

  return proof
}

function buildMerkleLayers(leaves: Hex32[]): Hex32[][] {
  const layers: Hex32[][] = [leaves.slice()]
  while (layers.at(-1)!.length > 1) {
    const layer = layers.at(-1)!
    const next: Hex32[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = layer[i + 1] ?? layer[i]
      next.push(parentHash(left, right))
    }
    layers.push(next)
  }
  return layers
}

function parentHash(left: Hex32, right: Hex32): Hex32 {
  const [a, b] = left <= right ? [left, right] : [right, left]
  return toHex32(keccak256Hex(Buffer.concat([hexToBytes(a), hexToBytes(b)])))
}
