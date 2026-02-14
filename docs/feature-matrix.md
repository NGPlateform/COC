# COC Feature Matrix (English)

This matrix lists features by domain, with current status and primary code references.

## Execution & RPC
- **EVM execution engine** — Partial — `COC/node/src/evm.ts`
- **RPC: basic chain info** — Implemented — `COC/node/src/rpc.ts`
- **RPC: block/tx queries** — Implemented — `COC/node/src/rpc.ts`
- **RPC: logs + filters** — Implemented (minimal) — `COC/node/src/rpc.ts`
- **RPC: web3_sha3** — Implemented — `COC/node/src/rpc.ts`
- **RPC: full EVM parity** — Missing

## Consensus & Chain
- **Proposer rotation** — Implemented — `COC/node/src/chain-engine.ts`
- **Finality depth** — Implemented (simple) — `COC/node/src/chain-engine.ts`
- **Fork choice / reorg** — Partial — `COC/node/src/chain-engine.ts`
- **Validator governance** — Missing

## Networking
- **Tx gossip** — Implemented — `COC/node/src/p2p.ts`
- **Block gossip** — Implemented — `COC/node/src/p2p.ts`
- **Snapshot sync** — Implemented — `COC/node/src/p2p.ts`
- **Peer discovery / scoring** — Missing

## Storage
- **Chain snapshot persistence** — Implemented — `COC/node/src/storage.ts`
- **User file storage (IPFS-compatible)** — Implemented (core APIs) — `COC/node/src/ipfs-http.ts`
- **IPFS gateway** — Implemented (basic) — `COC/node/src/ipfs-http.ts`
- **Block DB / state DB** — Missing
- **Log indexing** — Missing

## Mempool
- **Gas‑price ordering** — Implemented — `COC/node/src/mempool.ts`
- **Nonce continuity** — Implemented — `COC/node/src/mempool.ts`
- **Fee market (EIP‑1559)** — Missing

## PoSe (Off‑chain)
- **Challenge factory** — Implemented — `COC/services/challenger/*`
- **Receipt verification** — Implemented — `COC/services/verifier/*`
- **Batch aggregation** — Implemented — `COC/services/aggregator/*`
- **Reward scoring** — Implemented — `COC/services/verifier/scoring.ts`
- **Storage proofs** — Implemented (Merkle path) — `COC/runtime/coc-node.ts`

## PoSe (On‑chain)
- **PoSeManager contract** — Implemented — `COC/contracts/settlement/PoSeManager.sol`
- **Batch challenge + finalize** — Implemented — `COC/contracts/settlement/PoSeManager.sol`
- **Slashing** — Implemented — `COC/contracts/settlement/PoSeManager.sol`

## Runtime Services
- **coc-node HTTP endpoints** — Implemented — `COC/runtime/coc-node.ts`
- **coc-agent automation** — Implemented — `COC/runtime/coc-agent.ts`
- **coc-relayer automation** — Implemented — `COC/runtime/coc-relayer.ts`

## Tooling
- **Wallet CLI** — Implemented — `COC/wallet/bin/coc-wallet.js`
- **Devnet scripts (3/5/7)** — Implemented — `COC/scripts/*.sh`
