import { keccak256Hex } from "../relayer/keccak256.ts"

export interface RoleAssignment {
  challenger: string
  aggregator: string
}

export function assignEpochRoles(
  epochId: bigint,
  blockHash: string,
  validators: readonly string[],
): RoleAssignment {
  if (validators.length === 0) {
    throw new Error("validators list must not be empty")
  }
  if (validators.length === 1) {
    return { challenger: validators[0], aggregator: validators[0] }
  }

  const seed = computeSeed(epochId, blockHash)
  const challengerIdx = Number(seed % BigInt(validators.length))
  // Aggregator must differ from challenger
  const aggregatorIdx = Number((seed / BigInt(validators.length)) % BigInt(validators.length - 1))
  const adjustedAggIdx = aggregatorIdx >= challengerIdx ? aggregatorIdx + 1 : aggregatorIdx

  return {
    challenger: validators[challengerIdx],
    aggregator: validators[adjustedAggIdx % validators.length],
  }
}

export function canRunForRole(
  nodeId: string,
  role: "challenger" | "aggregator",
  epochId: bigint,
  blockHash: string,
  validators: readonly string[],
): boolean {
  const assignment = assignEpochRoles(epochId, blockHash, validators)
  return assignment[role] === nodeId
}

function computeSeed(epochId: bigint, blockHash: string): bigint {
  const input = `${epochId.toString(16)}:${blockHash}`
  const hash = keccak256Hex(Buffer.from(input, "utf-8"))
  // Use first 8 bytes of hash as seed
  return BigInt("0x" + hash.slice(0, 16))
}
