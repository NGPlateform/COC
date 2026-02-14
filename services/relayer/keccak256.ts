const MASK_64 = 0xffffffffffffffffn

const ROTATION_OFFSETS = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
] as const

const ROUND_CONSTANTS = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n,
] as const

function rotl64(x: bigint, shift: number): bigint {
  const s = BigInt(shift % 64)
  if (s === 0n) return x & MASK_64
  return ((x << s) | (x >> (64n - s))) & MASK_64
}

function readLaneLE(bytes: Uint8Array, offset: number): bigint {
  let out = 0n
  for (let i = 0; i < 8; i++) {
    out |= BigInt(bytes[offset + i] ?? 0) << BigInt(i * 8)
  }
  return out
}

function writeLaneLE(out: Uint8Array, offset: number, lane: bigint): void {
  let v = lane & MASK_64
  for (let i = 0; i < 8; i++) {
    out[offset + i] = Number(v & 0xffn)
    v >>= 8n
  }
}

function keccakF1600(state: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    const c = new Array<bigint>(5)
    for (let x = 0; x < 5; x++) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]
    }

    const d = new Array<bigint>(5)
    for (let x = 0; x < 5; x++) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1)
    }

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = x + 5 * y
        state[idx] = (state[idx] ^ d[x]) & MASK_64
      }
    }

    const b = new Array<bigint>(25).fill(0n)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = x + 5 * y
        const shift = ROTATION_OFFSETS[idx]
        const newX = y
        const newY = (2 * x + 3 * y) % 5
        b[newX + 5 * newY] = rotl64(state[idx], shift)
      }
    }

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = x + 5 * y
        state[idx] = (b[idx] ^ ((~b[((x + 1) % 5) + 5 * y]) & b[((x + 2) % 5) + 5 * y])) & MASK_64
      }
    }

    state[0] = (state[0] ^ ROUND_CONSTANTS[round]) & MASK_64
  }
}

export function keccak256Bytes(input: Uint8Array): Uint8Array {
  const rateBytes = 136
  const outputBytes = 32
  const state = new Array<bigint>(25).fill(0n)

  let offset = 0
  while (offset + rateBytes <= input.length) {
    for (let lane = 0; lane < rateBytes / 8; lane++) {
      state[lane] ^= readLaneLE(input, offset + lane * 8)
      state[lane] &= MASK_64
    }
    keccakF1600(state)
    offset += rateBytes
  }

  const remaining = input.length - offset
  const block = new Uint8Array(rateBytes)
  if (remaining > 0) {
    block.set(input.subarray(offset))
  }
  block[remaining] ^= 0x01
  block[rateBytes - 1] ^= 0x80

  for (let lane = 0; lane < rateBytes / 8; lane++) {
    state[lane] ^= readLaneLE(block, lane * 8)
    state[lane] &= MASK_64
  }
  keccakF1600(state)

  const out = new Uint8Array(outputBytes)
  for (let lane = 0; lane < outputBytes / 8; lane++) {
    writeLaneLE(out, lane * 8, state[lane])
  }
  return out
}

export function keccak256Hex(input: Uint8Array): string {
  return Buffer.from(keccak256Bytes(input)).toString("hex")
}
