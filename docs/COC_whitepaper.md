```md
# COC (ChainOfClaw) Whitepaper (Draft v0.1)
**Subtitle:** An AI-Agent–Operated, Proof-of-Service Blockchain Network (Non-PoS Incentives)  
**Date:** 2026-02-12  
**Status:** Public Draft

---

## Abstract
COC (ChainOfClaw) is a blockchain network designed for **broad, durable node participation** by ordinary users. We observe that:
- **PoW** systems tend to centralize around specialized hardware and cheap power.
- **PoS** systems tend to centralize around capital concentration and delegated operations.

COC introduces **Proof-of-Service (PoSe)**: a verifiable, challenge-response protocol that rewards nodes for providing measurable network services—**uptime/RPC availability**, **data storage & availability**, and **relay support**—rather than rewarding stake ownership.

COC nodes can be operated and maintained by **OpenClaw-class AI agents**, automating installation, monitoring, self-healing, upgrades, safety policies, and resource management. The agent layer is strictly separated from consensus and state transition logic to preserve determinism and auditability.

Rewards are funded by **transaction fees plus inflationary bootstrap subsidies**, distributed per-epoch according to **verifiable service scores**, with **small fixed bonds** used only for anti-fraud penalties (bonds do **not** confer consensus power).

---

## 1. Vision and Goals

### 1.1 Mission
COC aims to make decentralization practical by shifting the core participation bottleneck:
> from “buy hardware + run complex ops”  
> to “run a reliable node with automated agent operations.”

### 1.2 Design Goals
1. **Permissionless participation**: anyone can run a node and earn rewards.
2. **Non-PoS incentives**: earnings are tied to service contribution, not stake.
3. **Ordinary-hardware friendly**: home/edge hardware can compete fairly.
4. **Verifiable & auditable**: service claims are challenge-verified.
5. **Anti-oligopoly**: diminishing returns and caps prevent “winner-takes-most.”
6. **Agent-operated reliability**: AI agents reduce ops burden without compromising determinism.

---

## 2. System Overview

### 2.1 Layered Architecture
1. **Execution Layer (optional EVM)**  
   - Executes transactions and smart contracts; maintains state.  
   - EVM is a *runtime*, not a decentralization mechanism.

2. **Consensus Layer (pluggable)**  
   - Produces blocks, provides finality.  
   - COC’s **incentive model does not require PoS**, but may coexist with various consensus designs.

3. **PoSe Service Layer (core of this paper)**  
   - Node registration & commitments  
   - Random challenges & receipts  
   - Score computation and reward distribution  
   - Fraud proofs and penalties

4. **Agent Operations Layer (OpenClaw-class)**  
   - Automated node lifecycle management  
   - Monitoring, self-healing, upgrades, rate limiting, security hardening  
   - **Does not alter consensus logic or state transitions**

---

## 3. Node Roles

A single operator may run one or multiple roles:

- **FN (Full Node)**: validates blocks/state, serves basic RPC queries.
- **SN (Storage/Archive Node)**: stores historical blocks/state snapshots and proves availability.
- **RN (Relay Node)**: improves propagation of blocks/transactions (light weight, lower reward weight).

COC’s default incentive weights favor **FN uptime/RPC**, so ordinary nodes can earn meaningfully without running archives.

---

## 4. Economic Model (Non-PoS, Ordinary-Hardware Friendly)

### 4.1 Reward Pool
Per epoch:
\[
R_{\text{epoch}} = R_{\text{fees,epoch}} + R_{\text{inflation,epoch}}
\]

- `R_fees_epoch`: collected transaction fees.
- `R_inflation_epoch`: bootstrap subsidies (decays over time).

### 4.2 Epoch Length
Default:
- **Epoch = 1 hour**
- Block time target (example): **1–2 seconds** (configurable, consensus-dependent)

### 4.3 Reward Buckets
COC allocates each epoch’s reward pool into buckets:

- **B1 Uptime/RPC Availability**: **60%**
- **B2 Storage & Data Availability**: **30%**
- **B3 Relay Support**: **10%**

Rationale: maximize inclusivity; storage/relay earn extra, but are not mandatory.

### 4.4 Bond (Non-PoS)
Nodes post a **small fixed bond** `D`:
- Target value: **~50 USDT equivalent** (chain-native amount may float to track target value).
- Unlock delay: **7 days**
- Purpose: **anti-fraud penalties only**  
- Bonds do **not** increase consensus power, do **not** increase rewards directly.

---

## 5. Proof-of-Service (PoSe): Challenges, Receipts, and Settlement

### 5.1 Core Idea
Nodes earn by **passing random, verifiable challenges** over time. Each challenge yields a **receipt** that can be audited. Scores aggregate over an epoch.

PoSe must ensure:
- **Unpredictability** of challenges (via verifiable randomness)
- **Non-replayability** (nonce and unique challenge_id)
- **Verifiability** (responses must be checkable by anyone)
- **Low barrier** for ordinary hardware (avoid CPU/GPU races)

### 5.2 Participants
- **Challenger**: entity authorized (or randomly assigned) to issue challenges.
- **Node**: registered participant responding to challenges.
- **Aggregator (optional)**: collects many receipts, submits a compact commitment to chain.
- **Verifier**: any party who checks receipts, including via dispute mechanisms.

### 5.3 Node Registration
A node registers on chain with:
- `node_id`: derived from node public key (e.g., `keccak(pubkey)`).
- `pubkey_node`: node signing key.
- `service_flags`: bitmap (FN/SN/RN).
- `service_commitment`: commitments required for SN (storage window, snapshot rules, commitment root).
- `endpoint_commitment`: hash of network endpoints (privacy-preserving; endpoints may be revealed selectively).
- `bond_amount`: fixed bond `D`.
- `metadata_hash` (optional): off-chain metadata pointer.

#### Storage Commitment (SN)
An SN declares:
- `store_window_days` (e.g., store last N days of blocks)
- `snapshot_frequency` (e.g., daily)
- `commit_root`: Merkle root (or equivalent) committing to expected stored data set / chunk map

---

## 6. Challenge Protocol and Receipt Formats

This section provides a concrete, implementable spec.

### 6.1 Challenge Types
- **U**: Uptime/RPC challenge (low cost)
- **S**: Storage proof challenge (medium cost)
- **R**: Relay/probe challenge (used cautiously; lowest weight)

### 6.2 Challenge Message (Challenge)
**Fields**
- `challenge_id`:
  `keccak(epoch_id || node_id || challenge_type || nonce || challenger_id)`
- `epoch_id`: current epoch number
- `challenge_type`: `U|S|R`
- `nonce`: 128-bit random value (one-time)
- `rand_ref`: reference to verifiable randomness (e.g., VRF output id, block hash anchor)
- `issued_at`: chain height or timestamp reference
- `deadline_ms`: time limit (e.g., U=2500ms, S=6000ms)
- `query_spec`: type-specific payload  
  - U: `{method, params_hash, expected_rule}`
  - S: `{chunk_id, proof_spec}`
  - R: `{route_tag, hop_spec}`
- `challenger_sig`: signature by challenger over all fields excluding itself

**Signature**
- `challenger_sig = Sign(challenger_sk, H(challenge_fields))`

**Verifiability Requirements**
- `rand_ref` must be derivable/valid from chain state
- `challenge_id` must be recomputable
- `nonce` must be unique per node per epoch

### 6.3 Receipt Message (Receipt)
**Fields**
- `challenge_id`
- `node_id`
- `response_at`: responder timestamp (validated indirectly)
- `response_body`: type-specific content  
  - U: `{result, proof_optional}`
  - S: `{chunk_data_hash, merkle_path, commitment_ref}`
  - R: `{relay_witness_optional}`
- `node_sig`: signature by node over receipt

**Signature**
- `node_sig = Sign(node_sk, H(challenge_id || response_body || response_at))`

**Strong Verifiability Rules**
- U receipts must be checkable by recomputation from chain state where possible.
- S receipts must verify against `commit_root` using `merkle_path`.
- R receipts must have low reward weight unless using robust measurement infra.

---

## 7. On-Chain Submission vs Off-Chain Aggregation

### 7.1 Option A — Direct On-Chain Receipts (Simple, Expensive)
Each challenger submits:
- `submitReceipt(challenge, receipt, observer_attestations[])`

Pros: simplest; fully on-chain.  
Cons: gas heavy; scales poorly.

### 7.2 Option B — Off-Chain Aggregation + On-Chain Commitments (Recommended)
1. Aggregator collects receipts for an epoch.
2. Builds a **Receipt Merkle Tree**.
3. Submits:
   - `epoch_id`
   - `merkle_root_receipts`
   - `summary_hash` (pass rates, score totals, node list hash)
   - `aggregator_sig`
   - optional `k` sample proofs

4. Chain stores the batch root; a **dispute window** opens.

#### Dispute and Sampling
- On-chain random sampling: **k = 32–128** receipts per epoch (configurable).
- Dispute window: **2 epochs**.
- Anyone can challenge a batch leaf:
  - `challengeBatch(batch_id, receipt_leaf, merkle_proof)`
- If fraud is proven:
  - penalize the fraudulent node and/or aggregator (see penalties)
  - adjust epoch scoring (implementation choice: rollback or corrective delta)

This approach balances scalability and auditability.

---

## 8. Challenge Frequency (Ordinary Hardware Defaults)

Per epoch (1 hour):
- **Uptime/RPC**: avg **6 challenges / node / epoch** (~1 per 10 minutes)
- **Storage** (SN only): avg **2 challenges / SN / epoch**
- **Relay** (RN only): avg **2 challenges / RN / epoch**

Timeout thresholds:
- U: **2.5s**
- S: **6s**

Passing thresholds:
- U pass rate ≥ **80%** to qualify for U bucket
- S pass rate ≥ **70%** to qualify for S bucket

---

## 9. Scoring and Reward Formulas

Let node `i` have per-epoch scores:
- `S_u_i`: uptime/RPC score
- `S_s_i`: storage score (0 if not SN)
- `S_r_i`: relay score (0 if not RN)

### 9.1 Uptime/RPC Score
- `u_i = pass_u_i / total_u_i` in [0,1]
- latency factor (small weight to avoid bandwidth arms race):
  \[
  lat_i = clamp\left(\frac{L_{max} - median\_latency_i}{L_{max}-L_{min}}, 0, 1\right)
  \]
  defaults: `L_min=0.2s`, `L_max=2.5s`

\[
S_{u,i} = u_i \cdot (0.85 + 0.15 \cdot lat_i)
\]

### 9.2 Storage Score (SN)
- `s_i = pass_s_i / total_s_i`
- capacity factor with diminishing returns:
  \[
  cap_i = \sqrt{\frac{\min(storedGB_i, GB_{cap})}{GB_{cap}}}
  \]
  default: `GB_cap = 500GB`

\[
S_{s,i} = s_i \cdot cap_i
\]

### 9.3 Relay Score (RN)
\[
S_{r,i} = pass_r_i / total_r_i
\]
(kept low weight due to measurement spoofing risks)

### 9.4 Reward Distribution
Let:
- `U = Σ S_u_j` over eligible nodes
- `S = Σ S_s_j` over eligible SNs
- `R = Σ S_r_j` over eligible RNs

Then:
- `Reward_u_i = B1 * R_epoch * (S_u_i / U)`
- `Reward_s_i = B2 * R_epoch * (S_s_i / S)` (if SN else 0)
- `Reward_r_i = B3 * R_epoch * (S_r_i / R)` (if RN else 0)

Total:
\[
Reward_i = Reward_{u,i} + Reward_{s,i} + Reward_{r,i}
\]

---

## 10. Caps and Diminishing Returns (Anti-Oligopoly)

### 10.1 Per-Node Soft Cap
Limit per-node reward per epoch:
- `Cap_node = k * MedianReward_epoch`, default `k = 5`
Excess beyond cap is redistributed to lower-earning nodes or sent to a protocol treasury.

### 10.2 Storage Diminishing Returns
The `sqrt()` capacity factor ensures the marginal gain of adding more storage decreases sharply beyond `GB_cap`.

### 10.3 Practical Sybil Friction
Even without identity, the combination of:
- fixed bond per node,
- sustained challenge compliance,
- per-node soft cap,
- storage diminishing returns,
creates economic friction against running massive fleets solely to extract rewards.

---

## 11. Penalties (Non-PoS “Slashing-Like”)

Two classes: provable fraud vs instability.

### 11.1 Provable Fraud (Hard Penalties)
Triggers:
- forged storage proofs (Merkle verification fails)
- replay/forged receipts (nonce mismatch, invalid signatures)
- protocol-defined equivocation (if applicable)

Penalties:
- bond slash: **50%–100% of D**
- cooldown: **14 days** (cannot re-register)
- optional public on-chain record of evidence

### 11.2 Service Instability (Soft Penalties)
- If U pass rate < 80%: loses U bucket eligibility for that epoch
- If U pass rate < 80% for 3 consecutive epochs:
  - slash **5% of D**
  - cooldown **3 days**
- If S pass rate < 70%: loses S bucket eligibility for that epoch

This approach is tolerant of home-network volatility while discouraging chronic unreliability.

---

## 12. Threat Model and Anti-Cheat Mitigations

### 12.1 Sybil Attacks
**Threat:** create many identities to capture rewards.  
**Mitigations:**
- fixed bond + unlock delay
- per-node reward soft cap
- diminishing returns for storage commitments
- persistent service requirements (uptime and proof challenges)
- optional hardware attestation as a *bonus*, not a gate (to avoid excluding ordinary users)

### 12.2 Receipt Forgery / Replay
**Threat:** forge receipts or replay old ones.  
**Mitigations:**
- unique `challenge_id` binding epoch/node/type/nonce/challenger
- challenger + node signatures
- per-node per-epoch nonce uniqueness tracking
- verifiable response fields (chain-recomputable U, commitment-verifiable S)

### 12.3 Collusive Witnessing (Challenger–Node Collusion)
**Threat:** challenger claims node passed without real service.  
**Mitigations:**
- challenger set diversification + random assignment/rotation
- public challenge digest broadcasting (optional)
- on-chain sampling + dispute window
- challenger/aggregator bonds and penalties

### 12.4 Probe Corruption / Challenger Capture
**Threat:** attacker controls challengers/probes to bias scores or DoS honest nodes.  
**Mitigations:**
- decentralized challenge source selection via chain randomness
- challenger quotas and per-node challenge rate limits
- challenger reputation metrics and bonded penalties
- transparent statistics: abnormal patterns detectable on chain

### 12.5 NAT / Home Network False Negatives
**Threat:** honest home nodes fail due to NAT, jitter, ISP instability.  
**Mitigations:**
- moderate pass thresholds (80% uptime)
- median-based latency scoring
- “weak pass” tier (optional): partial score for 2.5–5s responses
- gradual penalties (eligibility loss before bond slashing)
- allow relay-assisted connectivity modes (QUIC/TURN/relayer options)
- agent-driven self-healing and reconnection policies

---

## 13. AI Agent Operations: Scope and Constraints

### 13.1 What the Agent Does
- install, configure, and update node software
- monitor health (CPU/disk/net), alert, self-heal
- manage snapshots and storage windows
- apply rate limits and firewall policies
- manage key lifecycle (recommended: TPM/secure enclave, threshold signing)

### 13.2 What the Agent Must Never Do
- modify consensus rules or state transition determinism
- inject non-verifiable “AI decisions” into on-chain execution
- alter transaction validity rules

COC preserves verifiability by keeping AI agents strictly in the **operations layer**.

---

## 14. Inflation Schedule (Bootstrap Subsidy)
COC may use a decaying inflation schedule to bootstrap early participation:
- Year 1: ~8%
- Year 2: ~6%
- Year 3: ~4%
- Year 4: ~3%
- Long-run: ~2% or gradual decline

The protocol’s long-term goal is to rely increasingly on fees and service markets.

---

## 15. Roadmap (High Level)
- **v0.1:** PoSe contracts + node registry + U/S challenges + receipt formats
- **v0.2:** off-chain aggregation + on-chain batch commitments + dispute window
- **v0.3:** decentralized challenger set + bonding + quotas + transparency metrics
- **v0.4:** OpenClaw NodeOps standard + multi-implementation clients

---

## Appendix A — Minimal Contract Interface (Illustrative)
- `registerNode(node_id, pubkey, flags, commitments, endpoint_hash, bond)`
- `updateCommitment(node_id, new_commitment)`
- `submitBatch(epoch_id, merkle_root, summary_hash, samples[])`
- `challengeBatch(batch_id, leaf, proof)`
- `finalizeEpoch(epoch_id)`
- `slash(node_id, evidence)`

---

## Appendix B — Default Parameters (Ordinary Hardware Profile)
- Epoch: **1h**
- U challenges: **6/node/epoch**, timeout **2.5s**, pass ≥ **80%**
- S challenges: **2/SN/epoch**, timeout **6s**, pass ≥ **70%**
- Buckets: **60/30/10**
- Storage cap: `GB_cap=500GB`, diminishing via `sqrt()`
- Per-node soft cap: `5 × median reward`
- Bond target: **~50 USDT eq**, unlock delay **7 days**
- Fraud slash: **50%–100% bond**, cooldown **14 days**
- Chronic instability: slash **5% bond** after 3 bad epochs

---

## Disclaimer
This document is a technical and economic design draft. It is not legal, tax, or investment advice. Regulatory classification may vary by jurisdiction and is not guaranteed by protocol design choices.
```
