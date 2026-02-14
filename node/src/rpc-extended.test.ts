import test from "node:test"
import assert from "node:assert/strict"
import { ChainEngine } from "./chain-engine.ts"
import { EvmChain } from "./evm.ts"
import { startRpcServer } from "./rpc.ts"
import { P2PNode } from "./p2p.ts"

async function rpcCall(port: number, method: string, params?: unknown[]) {
  const response = await fetch(`http://127.0.0.1:${port}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] }),
  })
  const json = await response.json()
  if (json.error) throw new Error(json.error.message)
  return json.result
}

test("RPC Extended Methods", async (t) => {
  const chainId = 18780
  const chain = await ChainEngine.create(chainId)
  const evm = await EvmChain.create(chainId)
  const p2p = { receiveTx: async () => {} } as P2PNode
  const port = 18790 + Math.floor(Math.random() * 100)

  startRpcServer("127.0.0.1", port, chainId, evm, chain, p2p)

  // 等待服务器启动
  await new Promise((resolve) => setTimeout(resolve, 100))

  await t.test("eth_accounts returns test accounts", async () => {
    const accounts = await rpcCall(port, "eth_accounts")
    assert.ok(Array.isArray(accounts))
    assert.ok(accounts.length === 10)
    assert.ok(accounts[0].startsWith("0x"))
  })

  await t.test("eth_sign signs message", async () => {
    const accounts = await rpcCall(port, "eth_accounts")
    const message = "0x48656c6c6f" // "Hello" in hex

    const signature = await rpcCall(port, "eth_sign", [accounts[0], message])
    assert.ok(typeof signature === "string")
    assert.ok(signature.startsWith("0x"))
    assert.ok(signature.length === 132) // 65 bytes * 2 + 0x
  })

  await t.test("eth_signTypedData_v4 signs typed data", async () => {
    const accounts = await rpcCall(port, "eth_accounts")
    const typedData = {
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
      },
      primaryType: "Person",
      domain: { name: "Test", version: "1", chainId: 1 },
      message: { name: "Alice", wallet: accounts[0] },
    }

    const signature = await rpcCall(port, "eth_signTypedData_v4", [accounts[0], typedData])
    assert.ok(typeof signature === "string")
    assert.ok(signature.startsWith("0x"))
  })

  await t.test("eth_createAccessList returns access list", async () => {
    const result = await rpcCall(port, "eth_createAccessList", [
      {
        from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        data: "0x",
      },
    ])

    assert.ok(typeof result === "object")
    assert.ok(Array.isArray(result.accessList))
    assert.ok(typeof result.gasUsed === "string")
  })

  await t.test("eth_sendTransaction sends signed transaction", async () => {
    const accounts = await rpcCall(port, "eth_accounts")

    const txHash = await rpcCall(port, "eth_sendTransaction", [
      {
        from: accounts[0],
        to: accounts[1],
        value: "0x1000",
        gas: "0x5208", // 21000
      },
    ])

    assert.ok(typeof txHash === "string")
    assert.ok(txHash.startsWith("0x"))
    assert.ok(txHash.length === 66) // 32 bytes * 2 + 0x
  })
})
