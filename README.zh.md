# COC（ChainOfClaw）

COC 是一个 EVM 兼容的区块链原型，包含 PoSe（Proof-of-Service）结算与 IPFS 兼容的存储接口。

## 目录结构

- `docs/`：白皮书与技术文档
- `specs/`：协议/经济/路线规范
- `contracts/`：PoSe 结算合约
- `services/`：链下挑战/验证/聚合/中继
- `runtime/`：coc-node / coc-agent / coc-relayer
- `node/`：链引擎 + RPC + P2P + 存储
- `wallet/`：简易 CLI 钱包
- `tests/`：集成与端到端测试
- `scripts/`：devnet 与验证脚本
- `explorer/`：区块链浏览器前端
- `website/`：项目网站
- `nodeops/`：节点运维与策略引擎

## 当前进展

- 链引擎：出块、mempool、快照、基础最终性
- P2P：HTTP gossip + 快照同步
- EVM：内存执行与最小 RPC
- PoSe：挑战/回执流水线、批次聚合、链上 PoSeManager
- 存储：IPFS 兼容 add/cat/get/block/pin/ls/stat/id/version + 网关
- 运行时：coc-node 端点 + coc-agent/relayer 自动化
- 工具：钱包 CLI 与 3/5/7 节点 devnet 脚本
- 浏览器：Next.js 区块链浏览器，支持区块/交易/地址查看

## 快速开始

### 运行本地节点

```bash
cd node
npm install
npm start
```

### 部署 PoSe 合约

```bash
cd contracts
npm install
npm run compile
npm run deploy:local
```

### 运行开发网络

```bash
bash scripts/devnet-3.sh  # 3 节点网络
bash scripts/devnet-5.sh  # 5 节点网络
bash scripts/devnet-7.sh  # 7 节点网络
```

### 启动浏览器

```bash
cd explorer
npm install
npm run dev
# 打开 http://localhost:3000
```

## 质量门禁

```bash
bash scripts/quality-gate.sh
```

## 文档

- 实现状态：`docs/implementation-status.md`
- 功能矩阵：`docs/feature-matrix.md`
- 系统架构：`docs/system-architecture.zh.md`
- 核心算法：`docs/core-algorithms.zh.md`

## 许可证

MIT 许可证 - 详见 LICENSE 文件

---

English version: [README.md](./README.md)
