import test from "node:test"
import assert from "node:assert/strict"
import { EvmChain } from "./evm.ts"

const FUNDED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const UNFUNDED_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

test("EvmChain.create initializes with block number 0", async () => {
  const evm = await EvmChain.create(18780)
  assert.equal(evm.getBlockNumber(), 0n)
})

test("prefund sets account balance", async () => {
  const evm = await EvmChain.create(18780)
  await evm.prefund([{ address: FUNDED_ADDRESS, balanceWei: "5000000000000000000" }])
  const balance = await evm.getBalance(FUNDED_ADDRESS)
  assert.equal(balance, 5000000000000000000n)
})

test("unfunded account has zero balance", async () => {
  const evm = await EvmChain.create(18780)
  const balance = await evm.getBalance(UNFUNDED_ADDRESS)
  assert.equal(balance, 0n)
})

test("unfunded account has zero nonce", async () => {
  const evm = await EvmChain.create(18780)
  const nonce = await evm.getNonce(UNFUNDED_ADDRESS)
  assert.equal(nonce, 0n)
})

test("getReceipt returns null for unknown hash", async () => {
  const evm = await EvmChain.create(18780)
  const receipt = evm.getReceipt("0x" + "ab".repeat(32))
  assert.equal(receipt, null)
})

test("getTransaction returns null for unknown hash", async () => {
  const evm = await EvmChain.create(18780)
  const tx = evm.getTransaction("0x" + "ab".repeat(32))
  assert.equal(tx, null)
})

test("resetExecution clears state and restores prefund", async () => {
  const evm = await EvmChain.create(18780)
  await evm.prefund([{ address: FUNDED_ADDRESS, balanceWei: "1000" }])

  const balanceBefore = await evm.getBalance(FUNDED_ADDRESS)
  assert.equal(balanceBefore, 1000n)

  await evm.resetExecution()

  // After reset, prefund should be restored
  const balanceAfter = await evm.getBalance(FUNDED_ADDRESS)
  assert.equal(balanceAfter, 1000n)

  // Block number should be reset
  assert.equal(evm.getBlockNumber(), 0n)
})

test("resetExecution clears receipts and txs", async () => {
  const evm = await EvmChain.create(18780)
  await evm.prefund([{ address: FUNDED_ADDRESS, balanceWei: "1000" }])
  await evm.resetExecution()

  // Receipts and txs should be empty
  assert.equal(evm.getReceipt("0x" + "00".repeat(32)), null)
  assert.equal(evm.getTransaction("0x" + "00".repeat(32)), null)
})

test("multiple prefund accounts", async () => {
  const evm = await EvmChain.create(18780)
  await evm.prefund([
    { address: FUNDED_ADDRESS, balanceWei: "1000" },
    { address: UNFUNDED_ADDRESS, balanceWei: "2000" },
  ])

  const b1 = await evm.getBalance(FUNDED_ADDRESS)
  const b2 = await evm.getBalance(UNFUNDED_ADDRESS)
  assert.equal(b1, 1000n)
  assert.equal(b2, 2000n)
})
