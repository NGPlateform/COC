/**
 * Dual-Engine Comparison Tests
 *
 * Verifies that different EVM engine implementations produce identical results
 * for the same transactions. This is the safety gate for engine migration —
 * all results must be 100% identical before switching the default engine.
 */

import { test, describe } from "node:test"
import assert from "node:assert"
import { createEvmEngine } from "../evm-factory.ts"
import { Wallet, parseEther } from "ethers"

const CHAIN_ID = 18780
const PREFUND_BALANCE = "100000000000000000000000" // 100K ETH

// Returns the revm engine when its WASM artifact is available, or null when
// the optional Rust/wasm-pack build hasn't been run. Tests on machines
// without the Rust toolchain should skip rather than fail — revm is an
// experimental alternate engine, not required for the default stack.
async function tryCreateRevm(): Promise<Awaited<ReturnType<typeof createEvmEngine>> | null> {
  try {
    return await createEvmEngine("revm", CHAIN_ID)
  } catch (err) {
    if (String(err).includes("revm WASM not available")) return null
    throw err
  }
}

describe("Dual-Engine Comparison", () => {
  test("both engines produce identical results for simple ETH transfer", async (t) => {
    const engineB = await tryCreateRevm()
    if (!engineB) {
      t.skip("revm WASM not built — run `cd node/revm-wasm && wasm-pack build --target nodejs --release`")
      return
    }
    const wallet = Wallet.createRandom()
    const recipient = Wallet.createRandom().address
    const prefund = [{ address: wallet.address, balanceWei: PREFUND_BALANCE }]
    const engineA = await createEvmEngine("ethereumjs", CHAIN_ID)

    await engineA.prefund(prefund)
    await engineB.prefund(prefund)

    // Sign a transfer transaction
    const signedTx = await wallet.signTransaction({
      to: recipient,
      value: parseEther("1"),
      gasLimit: 21000,
      gasPrice: 1000000000,
      nonce: 0,
      chainId: CHAIN_ID,
    })

    // Execute on both engines
    const resultA = await engineA.executeRawTx(signedTx, 1n, 0)
    const resultB = await engineB.executeRawTx(signedTx, 1n, 0)

    // Compare results
    assert.strictEqual(resultA.txHash, resultB.txHash, "tx hash mismatch")
    assert.strictEqual(resultA.gasUsed, resultB.gasUsed, "gas used mismatch")
    assert.strictEqual(resultA.success, resultB.success, "success status mismatch")

    // Compare post-execution state
    const balA = await engineA.getBalance(recipient)
    const balB = await engineB.getBalance(recipient)
    assert.strictEqual(balA, balB, "recipient balance mismatch")

    const senderBalA = await engineA.getBalance(wallet.address)
    const senderBalB = await engineB.getBalance(wallet.address)
    assert.strictEqual(senderBalA, senderBalB, "sender balance mismatch")

    const nonceA = await engineA.getNonce(wallet.address)
    const nonceB = await engineB.getNonce(wallet.address)
    assert.strictEqual(nonceA, nonceB, "nonce mismatch")
  })

  test("both engines handle contract deployment identically", async (t) => {
    const engineB = await tryCreateRevm()
    if (!engineB) {
      t.skip("revm WASM not built")
      return
    }
    const wallet = Wallet.createRandom()
    const prefund = [{ address: wallet.address, balanceWei: PREFUND_BALANCE }]
    const engineA = await createEvmEngine("ethereumjs", CHAIN_ID)

    await engineA.prefund(prefund)
    await engineB.prefund(prefund)

    // Simple storage contract: PUSH1 0x42 PUSH1 0x00 SSTORE STOP
    const initCode = "0x60426000555f80fd" // stores 0x42 at slot 0, then reverts (testing failure)
    const deployTx = await wallet.signTransaction({
      data: "0x6042600055600052602060006000f0", // deploy contract that stores 0x42
      gasLimit: 200000,
      gasPrice: 1000000000,
      nonce: 0,
      chainId: CHAIN_ID,
    })

    const resultA = await engineA.executeRawTx(deployTx, 1n, 0)
    const resultB = await engineB.executeRawTx(deployTx, 1n, 0)

    assert.strictEqual(resultA.txHash, resultB.txHash, "deploy tx hash mismatch")
    assert.strictEqual(resultA.gasUsed, resultB.gasUsed, "deploy gas used mismatch")
    assert.strictEqual(resultA.success, resultB.success, "deploy success mismatch")
  })

  test("both engines handle multiple sequential transactions identically", async (t) => {
    const engineB = await tryCreateRevm()
    if (!engineB) {
      t.skip("revm WASM not built")
      return
    }
    const wallet = Wallet.createRandom()
    const recipients = Array.from({ length: 10 }, () => Wallet.createRandom().address)
    const prefund = [{ address: wallet.address, balanceWei: PREFUND_BALANCE }]
    const engineA = await createEvmEngine("ethereumjs", CHAIN_ID)

    await engineA.prefund(prefund)
    await engineB.prefund(prefund)

    for (let i = 0; i < 10; i++) {
      const tx = await wallet.signTransaction({
        to: recipients[i],
        value: parseEther("1"),
        gasLimit: 21000,
        gasPrice: 1000000000,
        nonce: i,
        chainId: CHAIN_ID,
      })

      const resultA = await engineA.executeRawTx(tx, BigInt(i + 1), 0)
      const resultB = await engineB.executeRawTx(tx, BigInt(i + 1), 0)

      assert.strictEqual(resultA.txHash, resultB.txHash, `tx ${i} hash mismatch`)
      assert.strictEqual(resultA.gasUsed, resultB.gasUsed, `tx ${i} gas mismatch`)
      assert.strictEqual(resultA.success, resultB.success, `tx ${i} success mismatch`)
    }

    // Verify final state consistency
    const senderBalA = await engineA.getBalance(wallet.address)
    const senderBalB = await engineB.getBalance(wallet.address)
    assert.strictEqual(senderBalA, senderBalB, "final sender balance mismatch")

    for (let i = 0; i < 10; i++) {
      const balA = await engineA.getBalance(recipients[i])
      const balB = await engineB.getBalance(recipients[i])
      assert.strictEqual(balA, balB, `recipient ${i} balance mismatch`)
    }
  })

  test("engine factory creates correct engine types", async (t) => {
    const engineB = await tryCreateRevm()
    if (!engineB) {
      t.skip("revm WASM not built")
      return
    }
    const engineA = await createEvmEngine("ethereumjs", CHAIN_ID)

    assert.ok(engineA, "ethereumjs engine created")
    assert.ok(engineB, "revm engine created")
    assert.strictEqual(engineA.getChainId(), CHAIN_ID)
    assert.strictEqual(engineB.getChainId(), CHAIN_ID)
  })

  test("engine factory rejects invalid engine type", async () => {
    await assert.rejects(
      () => createEvmEngine("invalid" as any, CHAIN_ID),
      /unsupported EVM engine/,
    )
  })
})
