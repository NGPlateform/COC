import type { CrossLayerEnvelope, RelayResult } from "./message-types.ts"
import { ReplayGuard } from "./replay-guard.ts"

export interface RelaySink {
  forward(envelope: CrossLayerEnvelope): Promise<void>
}

export class RelayEngine {
  private readonly guard: ReplayGuard
  private readonly sink: RelaySink

  constructor(guard: ReplayGuard, sink: RelaySink) {
    this.guard = guard
    this.sink = sink
  }

  async relay(envelope: CrossLayerEnvelope): Promise<RelayResult> {
    const check = this.guard.validate(envelope)
    if (!check.ok) {
      return { accepted: false, reason: check.reason }
    }

    try {
      await this.sink.forward(envelope)
      this.guard.commit(envelope, check.replayKey)
      return { accepted: true }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "relay failed"
      return { accepted: false, reason }
    }
  }
}
