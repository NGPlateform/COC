import type { Hex32 } from "../common/pose-types.ts"

export interface EpochPerformance {
  nodeId: Hex32
  uptimeBps: number
  storageBps: number
  relayBps: number
  epochId: bigint
}

export interface NodeStreak {
  consecutiveGoodEpochs: number
  consecutiveBadEpochs: number
  lastEpochId: bigint
}

const GOOD_THRESHOLD_BPS = 8000
const MAX_MULTIPLIER = 150 // 1.5x in basis points over 100
const STREAK_RAMP_EPOCHS = 10

export class EpochTracker {
  private readonly streaks = new Map<string, NodeStreak>()

  recordEpoch(perf: EpochPerformance): void {
    const key = perf.nodeId
    const prev = this.streaks.get(key) ?? {
      consecutiveGoodEpochs: 0,
      consecutiveBadEpochs: 0,
      lastEpochId: 0n,
    }

    // Ensure epochs are sequential
    if (perf.epochId <= prev.lastEpochId && prev.lastEpochId > 0n) {
      return
    }

    const isGood = perf.uptimeBps >= GOOD_THRESHOLD_BPS

    const next: NodeStreak = {
      consecutiveGoodEpochs: isGood ? prev.consecutiveGoodEpochs + 1 : 0,
      consecutiveBadEpochs: isGood ? 0 : prev.consecutiveBadEpochs + 1,
      lastEpochId: perf.epochId,
    }

    this.streaks.set(key, next)
  }

  getStreak(nodeId: Hex32): NodeStreak {
    return this.streaks.get(nodeId) ?? {
      consecutiveGoodEpochs: 0,
      consecutiveBadEpochs: 0,
      lastEpochId: 0n,
    }
  }

  // Returns a multiplier in basis points (100 = 1x, 150 = 1.5x)
  getDelayMultiplier(nodeId: Hex32): number {
    const streak = this.getStreak(nodeId)
    if (streak.consecutiveGoodEpochs === 0) {
      return 100
    }
    const ramp = Math.min(streak.consecutiveGoodEpochs, STREAK_RAMP_EPOCHS)
    const bonus = Math.floor(((MAX_MULTIPLIER - 100) * ramp) / STREAK_RAMP_EPOCHS)
    return 100 + bonus
  }

  // Apply multiplier to base reward
  applyMultiplier(baseReward: bigint, nodeId: Hex32): bigint {
    const multiplier = this.getDelayMultiplier(nodeId)
    return (baseReward * BigInt(multiplier)) / 100n
  }

  getAllStreaks(): Map<string, NodeStreak> {
    return new Map(this.streaks)
  }
}
