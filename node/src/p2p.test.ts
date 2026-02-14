import test from "node:test"
import assert from "node:assert/strict"
import { BoundedSet } from "./p2p.ts"

test("BoundedSet add and has", () => {
  const set = new BoundedSet<string>(5)
  set.add("a")
  set.add("b")
  assert.equal(set.has("a"), true)
  assert.equal(set.has("b"), true)
  assert.equal(set.has("c"), false)
  assert.equal(set.size, 2)
})

test("BoundedSet deduplicates", () => {
  const set = new BoundedSet<string>(5)
  set.add("a")
  set.add("a")
  set.add("a")
  assert.equal(set.size, 1)
})

test("BoundedSet evicts oldest when full", () => {
  const set = new BoundedSet<string>(3)
  set.add("a")
  set.add("b")
  set.add("c")
  assert.equal(set.size, 3)

  // Adding fourth item should evict "a"
  set.add("d")
  assert.equal(set.size, 3)
  assert.equal(set.has("a"), false)
  assert.equal(set.has("b"), true)
  assert.equal(set.has("c"), true)
  assert.equal(set.has("d"), true)
})

test("BoundedSet handles 100k insertions without growing beyond limit", () => {
  const limit = 1000
  const set = new BoundedSet<string>(limit)

  for (let i = 0; i < 100_000; i++) {
    set.add(`0x${i.toString(16).padStart(64, "0")}`)
  }

  assert.equal(set.size, limit)
  // Most recent items should still be present
  assert.equal(set.has(`0x${(99_999).toString(16).padStart(64, "0")}`), true)
  // Old items should be evicted
  assert.equal(set.has(`0x${"0".padStart(64, "0")}`), false)
})

test("BoundedSet eviction order is FIFO", () => {
  const set = new BoundedSet<number>(3)
  set.add(1)
  set.add(2)
  set.add(3)
  set.add(4) // evicts 1
  set.add(5) // evicts 2

  assert.equal(set.has(1), false)
  assert.equal(set.has(2), false)
  assert.equal(set.has(3), true)
  assert.equal(set.has(4), true)
  assert.equal(set.has(5), true)
})

test("BoundedSet with size 1", () => {
  const set = new BoundedSet<string>(1)
  set.add("a")
  assert.equal(set.has("a"), true)
  set.add("b")
  assert.equal(set.has("a"), false)
  assert.equal(set.has("b"), true)
  assert.equal(set.size, 1)
})
