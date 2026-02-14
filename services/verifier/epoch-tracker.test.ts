import test from "node:test"
import assert from "node:assert/strict"
import { EpochTracker } from "./epoch-tracker.ts"
import type { Hex32 } from "../common/pose-types.ts"

const NODE_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hex32

test("new node has zero streaks", () => {
  const tracker = new EpochTracker()
  const streak = tracker.getStreak(NODE_A)
  assert.equal(streak.consecutiveGoodEpochs, 0)
  assert.equal(streak.consecutiveBadEpochs, 0)
})

test("good epoch increments good streak", () => {
  const tracker = new EpochTracker()
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 1n })
  const streak = tracker.getStreak(NODE_A)
  assert.equal(streak.consecutiveGoodEpochs, 1)
  assert.equal(streak.consecutiveBadEpochs, 0)
})

test("bad epoch resets good streak", () => {
  const tracker = new EpochTracker()
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 1n })
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 2n })
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 5000, storageBps: 0, relayBps: 0, epochId: 3n })
  const streak = tracker.getStreak(NODE_A)
  assert.equal(streak.consecutiveGoodEpochs, 0)
  assert.equal(streak.consecutiveBadEpochs, 1)
})

test("consecutive good epochs accumulate", () => {
  const tracker = new EpochTracker()
  for (let i = 1; i <= 5; i++) {
    tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9500, storageBps: 0, relayBps: 0, epochId: BigInt(i) })
  }
  assert.equal(tracker.getStreak(NODE_A).consecutiveGoodEpochs, 5)
})

test("duplicate epoch is ignored", () => {
  const tracker = new EpochTracker()
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 1n })
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 1n })
  assert.equal(tracker.getStreak(NODE_A).consecutiveGoodEpochs, 1)
})

test("delay multiplier is 100 for new node", () => {
  const tracker = new EpochTracker()
  assert.equal(tracker.getDelayMultiplier(NODE_A), 100)
})

test("delay multiplier increases with streak", () => {
  const tracker = new EpochTracker()
  for (let i = 1; i <= 10; i++) {
    tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9500, storageBps: 0, relayBps: 0, epochId: BigInt(i) })
  }
  assert.equal(tracker.getDelayMultiplier(NODE_A), 150) // max after 10 good epochs
})

test("delay multiplier caps at 150", () => {
  const tracker = new EpochTracker()
  for (let i = 1; i <= 20; i++) {
    tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9500, storageBps: 0, relayBps: 0, epochId: BigInt(i) })
  }
  assert.equal(tracker.getDelayMultiplier(NODE_A), 150)
})

test("delay multiplier resets after bad epoch", () => {
  const tracker = new EpochTracker()
  for (let i = 1; i <= 10; i++) {
    tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9500, storageBps: 0, relayBps: 0, epochId: BigInt(i) })
  }
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 3000, storageBps: 0, relayBps: 0, epochId: 11n })
  assert.equal(tracker.getDelayMultiplier(NODE_A), 100)
})

test("applyMultiplier scales reward correctly", () => {
  const tracker = new EpochTracker()
  for (let i = 1; i <= 10; i++) {
    tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9500, storageBps: 0, relayBps: 0, epochId: BigInt(i) })
  }
  const base = 1000n
  const boosted = tracker.applyMultiplier(base, NODE_A)
  assert.equal(boosted, 1500n) // 1.5x
})

test("applyMultiplier returns base for new node", () => {
  const tracker = new EpochTracker()
  const base = 1000n
  assert.equal(tracker.applyMultiplier(base, NODE_A), 1000n)
})

test("getAllStreaks returns all tracked nodes", () => {
  const tracker = new EpochTracker()
  const nodeB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Hex32
  tracker.recordEpoch({ nodeId: NODE_A, uptimeBps: 9000, storageBps: 0, relayBps: 0, epochId: 1n })
  tracker.recordEpoch({ nodeId: nodeB, uptimeBps: 5000, storageBps: 0, relayBps: 0, epochId: 1n })
  const all = tracker.getAllStreaks()
  assert.equal(all.size, 2)
})
