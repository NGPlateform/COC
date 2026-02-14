import type { ChainEngine } from "./chain-engine.ts"
import type { P2PNode } from "./p2p.ts"
import { createLogger } from "./logger.ts"

const log = createLogger("consensus")

export interface ConsensusConfig {
  blockTimeMs: number
  syncIntervalMs: number
}

export class ConsensusEngine {
  private readonly chain: ChainEngine
  private readonly p2p: P2PNode
  private readonly cfg: ConsensusConfig

  constructor(chain: ChainEngine, p2p: P2PNode, cfg: ConsensusConfig) {
    this.chain = chain
    this.p2p = p2p
    this.cfg = cfg
  }

  start(): void {
    setInterval(() => void this.tryPropose(), this.cfg.blockTimeMs)
    setInterval(() => void this.trySync(), this.cfg.syncIntervalMs)
    void this.trySync()
  }

  private async tryPropose(): Promise<void> {
    try {
      const block = await this.chain.proposeNextBlock()
      if (!block) {
        return
      }
      await this.p2p.receiveBlock(block)
    } catch (error) {
      log.error("propose failed", { error: String(error) })
    }
  }

  private async trySync(): Promise<void> {
    try {
      const snapshots = await this.p2p.fetchSnapshots()
      let adopted = false
      for (const snapshot of snapshots) {
        const ok = await this.chain.maybeAdoptSnapshot(snapshot)
        adopted = adopted || ok
      }
      if (adopted) {
        log.info("sync adopted new tip", { height: this.chain.getHeight().toString() })
      }
    } catch (error) {
      log.error("sync failed", { error: String(error) })
    }
  }
}
