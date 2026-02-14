import { keccak256Hex } from "../relayer/keccak256.ts"
import type { ChallengeMessage } from "../common/pose-types.ts"

export interface NonceRegistryLike {
  consume(challenge: ChallengeMessage): boolean
}

export class NonceRegistry implements NonceRegistryLike {
  private readonly used = new Set<string>()

  consume(challenge: ChallengeMessage): boolean {
    const key = this.buildKey(challenge)
    if (this.used.has(key)) {
      return false
    }
    this.used.add(key)
    return true
  }

  private buildKey(challenge: ChallengeMessage): string {
    const raw = Buffer.concat([
      Buffer.from(challenge.challengerId.slice(2), "hex"),
      Buffer.from(challenge.nodeId.slice(2), "hex"),
      Buffer.from(challenge.nonce.slice(2), "hex"),
      Buffer.from(challenge.challengeType, "utf8"),
      u64(challenge.epochId),
    ])
    return keccak256Hex(raw)
  }
}

function u64(value: bigint): Buffer {
  const out = Buffer.alloc(8)
  out.writeBigUInt64BE(value)
  return out
}
