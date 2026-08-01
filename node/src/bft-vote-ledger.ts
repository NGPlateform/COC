import {
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  existsSync,
  readFileSync,
  renameSync,
  mkdirSync,
} from "node:fs"
import { dirname } from "node:path"
import type { Hex } from "./blockchain-types.ts"
import { createLogger } from "./logger.ts"

const log = createLogger("bft-vote-ledger")

interface VoteLedgerSnapshot {
  prepared: Record<string, Hex>
  committed: Record<string, Hex>
}

/**
 * Durable, fsync'd record of which `(height → blockHash)` this validator has
 * already voted `prepare` / `commit` on.
 *
 * Why this exists: BFT round state (the in-memory `localPreparedAt` /
 * `localCommittedAt` maps in bft-coordinator.ts) is lost on process restart.
 * A validator that restarts mid-round — before the in-progress height was
 * finalized — used to come back with an empty ledger and re-`prepare` a
 * *freshly-built* candidate for that same unfinalized height (a different
 * `blockHash`). Peers' `EquivocationDetector` correctly flags that as
 * double-signing and drop both votes, deadlocking consensus until a manual
 * atomic restart. This was the root cause of the recurring 88780 stalls.
 *
 * This ledger closes that gap: each commitment is persisted with `fsync`
 * **write-ahead** (before the vote is broadcast), and rehydrated on startup,
 * so a restarted validator refuses to sign a conflicting vote for a height it
 * already voted on. Safety (no equivocation) is preserved across crashes.
 *
 * Storage: a single small JSON file rewritten atomically (temp file → fsync →
 * rename). It only ever holds *unfinalized* heights (pruned on finalize), so
 * it stays tiny — a handful of entries at most.
 *
 * When constructed with `path = null` (e.g. unit tests, or a node without a
 * data dir) it operates purely in-memory — same behavior as before this fix,
 * minus the durability.
 */
export class BftVoteLedger {
  private readonly prepared = new Map<bigint, Hex>()
  private readonly committed = new Map<bigint, Hex>()
  private readonly path: string | null

  constructor(path: string | null) {
    this.path = path
    if (path) this.load()
  }

  private load(): void {
    if (!this.path || !existsSync(this.path)) return
    try {
      const snap = JSON.parse(readFileSync(this.path, "utf8")) as VoteLedgerSnapshot
      for (const [h, hash] of Object.entries(snap.prepared ?? {})) this.prepared.set(BigInt(h), hash)
      for (const [h, hash] of Object.entries(snap.committed ?? {})) this.committed.set(BigInt(h), hash)
      log.info("BFT vote ledger rehydrated", {
        preparedHeights: this.prepared.size,
        committedHeights: this.committed.size,
      })
    } catch (err) {
      // Corrupt/unreadable file: start empty. Safety degrades to the
      // pre-fix (in-memory only) behavior for THIS restart, no worse.
      log.warn("BFT vote ledger unreadable — starting empty", { error: String(err) })
    }
  }

  getPrepared(height: bigint): Hex | undefined {
    return this.prepared.get(height)
  }

  getCommitted(height: bigint): Hex | undefined {
    return this.committed.get(height)
  }

  /** Persist a prepare commitment (fsync). Call BEFORE broadcasting the vote. */
  recordPrepared(height: bigint, blockHash: Hex): void {
    const prev = this.prepared.get(height)
    if (prev === blockHash) return // idempotent
    this.prepared.set(height, blockHash)
    this.flush()
  }

  /** Persist a commit commitment (fsync). Call BEFORE broadcasting the vote. */
  recordCommitted(height: bigint, blockHash: Hex): void {
    const prev = this.committed.get(height)
    if (prev === blockHash) return // idempotent
    this.committed.set(height, blockHash)
    this.flush()
  }

  /** Drop all entries at or below a finalized height (they are dead weight). */
  prune(finalizedHeight: bigint): void {
    let changed = false
    for (const h of this.prepared.keys()) if (h <= finalizedHeight) { this.prepared.delete(h); changed = true }
    for (const h of this.committed.keys()) if (h <= finalizedHeight) { this.committed.delete(h); changed = true }
    if (changed) this.flush()
  }

  /** Wipe everything (validator-set change: prior votes were under stale rotation). */
  clearAll(): void {
    if (this.prepared.size === 0 && this.committed.size === 0) return
    this.prepared.clear()
    this.committed.clear()
    this.flush()
  }

  /** Snapshot for rehydrating the coordinator's in-memory working copies. */
  snapshotPrepared(): Map<bigint, Hex> {
    return new Map(this.prepared)
  }

  snapshotCommitted(): Map<bigint, Hex> {
    return new Map(this.committed)
  }

  private flush(): void {
    if (!this.path) return // in-memory mode
    const snap: VoteLedgerSnapshot = { prepared: {}, committed: {} }
    for (const [h, hash] of this.prepared) snap.prepared[h.toString()] = hash
    for (const [h, hash] of this.committed) snap.committed[h.toString()] = hash
    const tmp = `${this.path}.tmp`
    try {
      mkdirSync(dirname(this.path), { recursive: true })
      const fd = openSync(tmp, "w")
      try {
        writeSync(fd, JSON.stringify(snap))
        fsyncSync(fd) // durability: survive a crash after this returns
      } finally {
        closeSync(fd)
      }
      renameSync(tmp, this.path) // atomic swap into place
    } catch (err) {
      // A failed flush must NOT crash consensus. Worst case we lose durability
      // for this write and fall back to in-memory guard for a restart.
      log.warn("BFT vote ledger flush failed", { error: String(err) })
    }
  }
}
