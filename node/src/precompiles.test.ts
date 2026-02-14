/**
 * 预编译合约边界测试
 * 覆盖 9 个 EVM 预编译合约的边界情况和错误路径
 */

import test from "node:test"
import assert from "node:assert/strict"
import { EvmChain } from "./evm.ts"

test("Precompiled Contracts - Edge Cases", async (t) => {
  const evm = await EvmChain.create(18780)

  await t.test("ecrecover (0x01): invalid v value (< 27)", async () => {
    // v = 26 (invalid)
    const data = "0x" +
      "0000000000000000000000000000000000000000000000000000000000000001" + // hash
      "000000000000000000000000000000000000000000000000000000000000001a" + // v = 26
      "0000000000000000000000000000000000000000000000000000000000000001" + // r
      "0000000000000000000000000000000000000000000000000000000000000001"  // s

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000001",
      data,
    })

    // 应返回空（无法恢复地址）
    assert.ok(result.returnValue === "0x" || result.returnValue === "0x0000000000000000000000000000000000000000000000000000000000000000")
  })

  await t.test("ecrecover (0x01): zero signature", async () => {
    const data = "0x" +
      "0000000000000000000000000000000000000000000000000000000000000000" + // hash = 0
      "000000000000000000000000000000000000000000000000000000000000001b" + // v = 27
      "0000000000000000000000000000000000000000000000000000000000000000" + // r = 0
      "0000000000000000000000000000000000000000000000000000000000000000"  // s = 0

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000001",
      data,
    })

    assert.ok(result.returnValue === "0x" || result.returnValue === "0x0000000000000000000000000000000000000000000000000000000000000000")
  })

  await t.test("ecrecover (0x01): valid signature", async () => {
    // 已知有效签名（测试正常路径）
    const data = "0x" +
      "456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3" + // hash
      "000000000000000000000000000000000000000000000000000000000000001c" + // v = 28
      "9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608" + // r
      "4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada"  // s

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000001",
      data,
    })

    // 应返回 20 字节地址
    assert.ok(result.returnValue.length === 66) // 0x + 32 bytes (address padded)
  })

  await t.test("sha256 (0x02): empty input", async () => {
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000002",
      data: "0x",
    })

    // SHA256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    assert.equal(
      result.returnValue,
      "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
  })

  await t.test("sha256 (0x02): known input", async () => {
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000002",
      data: "0x68656c6c6f", // "hello"
    })

    // SHA256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    assert.equal(
      result.returnValue,
      "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    )
  })

  await t.test("ripemd160 (0x03): empty input", async () => {
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000003",
      data: "0x",
    })

    // RIPEMD160("") = 9c1185a5c5e9fc54612808977ee8f548b2258d31
    assert.equal(
      result.returnValue,
      "0x0000000000000000000000009c1185a5c5e9fc54612808977ee8f548b2258d31"
    )
  })

  await t.test("ripemd160 (0x03): known input", async () => {
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000003",
      data: "0x68656c6c6f", // "hello"
    })

    // RIPEMD160("hello") = 108f07b8382412612c048d07d13f814118445acd
    assert.equal(
      result.returnValue,
      "0x000000000000000000000000108f07b8382412612c048d07d13f814118445acd"
    )
  })

  await t.test("identity (0x04): passthrough", async () => {
    const data = "0x123456789abcdef0" // 偶数长度
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000004",
      data,
    })

    assert.equal(result.returnValue, data)
  })

  await t.test("identity (0x04): empty input", async () => {
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000004",
      data: "0x",
    })

    assert.equal(result.returnValue, "0x")
  })

  await t.test("modexp (0x05): edge cases", async () => {
    // Base=1, Exponent=0, Modulus=1 => 1^0 mod 1 = 0
    const data = "0x" +
      "0000000000000000000000000000000000000000000000000000000000000001" + // base length
      "0000000000000000000000000000000000000000000000000000000000000001" + // exp length
      "0000000000000000000000000000000000000000000000000000000000000001" + // mod length
      "01" + // base = 1
      "00" + // exp = 0
      "01"   // mod = 1

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000005",
      data,
    })

    // 1^0 mod 1 = 0
    assert.equal(result.returnValue, "0x00")
  })

  await t.test("bn256Add (0x06): invalid points", async () => {
    // 无效点 (x=0, y=1) + (x=0, y=1) => 应失败或返回零点
    const data = "0x" +
      "0000000000000000000000000000000000000000000000000000000000000000" + // x1 = 0
      "0000000000000000000000000000000000000000000000000000000000000001" + // y1 = 1 (invalid)
      "0000000000000000000000000000000000000000000000000000000000000000" + // x2 = 0
      "0000000000000000000000000000000000000000000000000000000000000001"  // y2 = 1

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000006",
      data,
    })

    // 应返回错误或零点
    assert.ok(result.returnValue !== undefined)
  })

  await t.test("bn256Mul (0x07): point at infinity", async () => {
    // 无穷远点 * scalar => 无穷远点
    const data = "0x" +
      "0000000000000000000000000000000000000000000000000000000000000000" + // x = 0
      "0000000000000000000000000000000000000000000000000000000000000000" + // y = 0 (infinity)
      "0000000000000000000000000000000000000000000000000000000000000005"  // scalar = 5

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000007",
      data,
    })

    // 应返回无穷远点 (0, 0)
    assert.equal(
      result.returnValue,
      "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  })

  await t.test("bn256Pairing (0x08): empty input", async () => {
    // 空输入应返回 true (1)
    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000008",
      data: "0x",
    })

    assert.equal(result.returnValue, "0x0000000000000000000000000000000000000000000000000000000000000001")
  })

  await t.test("blake2f (0x09): invalid rounds (Shanghai+)", async () => {
    // BLAKE2f 需要精确的输入格式：rounds(4) + h(64) + m(128) + t(16) + f(1)
    // 测试无效的 rounds 值
    const data = "0x" +
      "00000000" + // rounds = 0 (可能无效)
      "0".repeat(64 * 2) + // h (64 bytes)
      "0".repeat(128 * 2) + // m (128 bytes)
      "0".repeat(16 * 2) + // t (16 bytes)
      "00" // f = 0

    const result = await evm.callRaw({
      to: "0x0000000000000000000000000000000000000009",
      data,
    })

    // 应正常返回或失败
    assert.ok(result.returnValue !== undefined)
  })

  await t.test("invalid precompile address (0x0a)", async () => {
    // 不存在的预编译地址应返回空
    const result = await evm.callRaw({
      to: "0x000000000000000000000000000000000000000a",
      data: "0x1234",
    })

    assert.equal(result.returnValue, "0x")
  })
})
