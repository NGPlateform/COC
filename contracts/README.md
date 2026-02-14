# COC Settlement Contracts

## Quick Start

```bash
cd COC/contracts
npm install
npm run compile
npm test
npm run deploy:local
```

## Included

- Settlement contracts:
  - `settlement/PoSeManager.sol`
  - `settlement/PoSeManagerStorage.sol`
  - `settlement/PoSeTypes.sol`
  - `settlement/MerkleProofLite.sol`
- Hardhat config:
  - `hardhat.config.cjs`
- Deploy script:
  - `scripts/deploy-posemanager.js`
- Contract tests:
  - `test/PoSeManager.test.js`

## Notes

- `deploy:local` deploys to Hardhat in-memory network.
- For persistent networks, add network config and private key env vars before deployment.
