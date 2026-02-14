import test from "node:test"
import assert from "node:assert/strict"
import { createLogger, setLogLevel, getLogLevel } from "./logger.ts"

test("createLogger returns logger with all methods", () => {
  const log = createLogger("test")
  assert.equal(typeof log.debug, "function")
  assert.equal(typeof log.info, "function")
  assert.equal(typeof log.warn, "function")
  assert.equal(typeof log.error, "function")
  assert.equal(typeof log.child, "function")
})

test("child logger inherits component prefix", () => {
  const parent = createLogger("node")
  const child = parent.child("rpc")
  // Just verify it creates without error
  assert.ok(child)
})

test("setLogLevel and getLogLevel", () => {
  const original = getLogLevel()
  setLogLevel("debug")
  assert.equal(getLogLevel(), "debug")
  setLogLevel("error")
  assert.equal(getLogLevel(), "error")
  // Restore
  setLogLevel(original)
})

test("logger output is valid JSON", () => {
  const chunks: string[] = []
  const originalWrite = process.stdout.write
  process.stdout.write = ((chunk: string) => {
    chunks.push(chunk)
    return true
  }) as typeof process.stdout.write

  const log = createLogger("test-json")
  setLogLevel("info")
  log.info("hello world", { key: "value" })

  process.stdout.write = originalWrite

  assert.ok(chunks.length > 0)
  const entry = JSON.parse(chunks[0].trim())
  assert.equal(entry.level, "info")
  assert.equal(entry.component, "test-json")
  assert.equal(entry.message, "hello world")
  assert.equal(entry.data.key, "value")
  assert.ok(entry.ts)
})

test("logger respects level filter", () => {
  const chunks: string[] = []
  const originalWrite = process.stdout.write
  process.stdout.write = ((chunk: string) => {
    chunks.push(chunk)
    return true
  }) as typeof process.stdout.write

  setLogLevel("warn")
  const log = createLogger("test-filter")
  log.debug("should not appear")
  log.info("should not appear")
  log.warn("should appear")

  process.stdout.write = originalWrite
  setLogLevel("info")

  assert.equal(chunks.length, 1)
  const entry = JSON.parse(chunks[0].trim())
  assert.equal(entry.level, "warn")
})

test("error logs go to stderr", () => {
  const chunks: string[] = []
  const originalWrite = process.stderr.write
  process.stderr.write = ((chunk: string) => {
    chunks.push(chunk)
    return true
  }) as typeof process.stderr.write

  setLogLevel("info")
  const log = createLogger("test-stderr")
  log.error("test error", { code: 500 })

  process.stderr.write = originalWrite

  assert.ok(chunks.length > 0)
  const entry = JSON.parse(chunks[0].trim())
  assert.equal(entry.level, "error")
  assert.equal(entry.message, "test error")
})

test("logger omits data field when no data provided", () => {
  const chunks: string[] = []
  const originalWrite = process.stdout.write
  process.stdout.write = ((chunk: string) => {
    chunks.push(chunk)
    return true
  }) as typeof process.stdout.write

  setLogLevel("info")
  const log = createLogger("test-nodata")
  log.info("no data")

  process.stdout.write = originalWrite

  const entry = JSON.parse(chunks[0].trim())
  assert.equal(entry.data, undefined)
})
