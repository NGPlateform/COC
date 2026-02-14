import { randomBytes } from "node:crypto"
import { keccak256Hex } from "../relayer/keccak256.ts"
import { ChallengeType, type ChallengeMessage, type Hex32 } from "../common/pose-types.ts"

export interface ChallengeFactoryConfig {
  challengerId: Hex32
  sign: (digestHex: Hex32) => `0x${string}`
}

export interface IssueChallengeInput {
  epochId: bigint
  nodeId: Hex32
  challengeType: keyof typeof ChallengeType
  randSeed: Hex32
  issuedAtMs: bigint
  querySpec: Record<string, unknown>
}

export class ChallengeFactory {
  private readonly config: ChallengeFactoryConfig

  constructor(config: ChallengeFactoryConfig) {
    this.config = config
  }

  issue(input: IssueChallengeInput): ChallengeMessage {
    const nonce = `0x${randomBytes(16).toString("hex")}` as `0x${string}`
    const challengeCode = ChallengeType[input.challengeType]
    const deadlineMs = challengeCode === ChallengeType.Storage ? 6000 : 2500

    const digest = this.buildChallengeDigest(input, challengeCode, nonce)
    const challengeId = `0x${keccak256Hex(digest)}` as Hex32

    const signPayload = Buffer.concat([
      digest,
      Buffer.from(challengeId.slice(2), "hex"),
    ])
    const challengerSig = this.config.sign(`0x${keccak256Hex(signPayload)}` as Hex32)

    return {
      challengeId,
      epochId: input.epochId,
      nodeId: input.nodeId,
      challengeType: challengeCode,
      nonce,
      randSeed: input.randSeed,
      issuedAtMs: input.issuedAtMs,
      deadlineMs,
      querySpec: input.querySpec,
      challengerId: this.config.challengerId,
      challengerSig,
    }
  }

  private buildChallengeDigest(input: IssueChallengeInput, challengeCode: string, nonce: `0x${string}`): Buffer {
    return Buffer.concat([
      u64Bytes(input.epochId),
      hex32Bytes(input.nodeId),
      Buffer.from(challengeCode, "utf8"),
      hexSizedBytes(nonce, 16),
      hex32Bytes(this.config.challengerId),
    ])
  }
}

/**
 * Reconstruct the sign payload hash from a ChallengeMessage.
 * Returns the same hex digest that was passed to config.sign() during issuance.
 */
export function buildChallengeVerifyPayload(challenge: ChallengeMessage): Hex32 {
  const digest = Buffer.concat([
    u64Bytes(challenge.epochId),
    hex32Bytes(challenge.nodeId),
    Buffer.from(challenge.challengeType, "utf8"),
    hexSizedBytes(challenge.nonce, 16),
    hex32Bytes(challenge.challengerId),
  ])
  const signPayload = Buffer.concat([
    digest,
    Buffer.from(challenge.challengeId.slice(2), "hex"),
  ])
  return `0x${keccak256Hex(signPayload)}` as Hex32
}

function u64Bytes(value: bigint): Buffer {
  if (value < 0n || value > 0xffffffffffffffffn) {
    throw new Error("epochId out of range")
  }
  const out = Buffer.alloc(8)
  out.writeBigUInt64BE(value)
  return out
}

function hex32Bytes(value: Hex32): Buffer {
  const n = value.slice(2)
  if (!/^[0-9a-fA-F]{64}$/.test(n)) {
    throw new Error("invalid hex32")
  }
  return Buffer.from(n, "hex")
}

function hexSizedBytes(value: `0x${string}`, bytes: number): Buffer {
  const n = value.slice(2)
  if (!new RegExp(`^[0-9a-fA-F]{${bytes * 2}}$`).test(n)) {
    throw new Error(`expected ${bytes} bytes hex`)
  }
  return Buffer.from(n, "hex")
}
