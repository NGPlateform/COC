import test from "node:test"
import assert from "node:assert/strict"
import { keccak256Hex } from "./keccak256.ts"

test("keccak256 vectors", () => {
  const empty = keccak256Hex(new Uint8Array())
  assert.equal(empty, "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

  const abc = keccak256Hex(Buffer.from("abc", "utf8"))
  assert.equal(abc, "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45")
})
