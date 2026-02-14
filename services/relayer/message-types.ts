export type Hex32 = `0x${string}`

export const CrossLayerMessageType = {
  NodeRegistered: "NodeRegistered",
  CommitmentUpdated: "CommitmentUpdated",
  BatchSubmitted: "BatchSubmitted",
  BatchChallenged: "BatchChallenged",
  EpochFinalized: "EpochFinalized",
  NodeSlashed: "NodeSlashed",
} as const
export type CrossLayerMessageType = (typeof CrossLayerMessageType)[keyof typeof CrossLayerMessageType]

export interface CrossLayerEnvelope {
  srcChainId: number
  dstChainId: number
  channelId: Hex32
  nonce: bigint
  payloadHash: Hex32
  sourceBlockNumber: bigint
  sourceTxHash: `0x${string}`
  messageType: CrossLayerMessageType
  payload: Record<string, unknown>
}

export interface RelayResult {
  accepted: boolean
  reason?: string
}
