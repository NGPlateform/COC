const { ethers } = require("hardhat")
const A = {
  mesh: "0x6654C8d09491BD7aEF42B7DB3e2Bc55079897f49",
  srm: "0x0b617777E93e42adA37E753BD33fACBAE2A46D67",
  vesting: "0x5BDe4055E2A20FD614a68F7433207694ab6E5D35",
  multisig: "0x3c055D83a9aA12Bba4a2ed53F8970DF4081eBC7E",
  pose: "0x256eb949C50d5F2af8699191b1Bc043203263549",
  deployer: "0xB4E943F5F34b763fC78598a9e528995B4CDe786a",
}
async function main() {
  const mesh = await ethers.getContractAt("MeshToken", A.mesh)
  const srm = await ethers.getContractAt("StorageRewardManager", A.srm)
  const v = await ethers.getContractAt("MeshVesting", A.vesting)
  const f = ethers.formatEther

  console.log("MeshToken", `${await mesh.name()} / ${await mesh.symbol()} / dec ${await mesh.decimals()}`)
  console.log("  totalSupply", f(await mesh.totalSupply()), "(expect 600M genesis)")
  console.log("  minter     ", await mesh.minter(), "(expect SRM", A.srm + ")")
  console.log("  owner      ", await mesh.owner(), "(expect multisig)")
  console.log("  bal(multisig)", f(await mesh.balanceOf(A.multisig)), "(expect 400M = eco+liq)")
  console.log("  bal(vesting) ", f(await mesh.balanceOf(A.vesting)), "(expect 200M team)")
  console.log("SRM  owner", await srm.owner())
  console.log("  emissionPerEpoch", f(await srm.emissionPerEpoch()))
  console.log("  meshToken", await srm.meshToken(), "poseRegistry", await srm.poseRegistry())
  console.log("  relayer(deployer)?", await srm.relayers(A.deployer), " treasury", await srm.treasury())
  console.log("  MAX_EMISSION", f(await srm.MAX_EMISSION_PER_EPOCH()), " STORAGE_POOL", f(await srm.STORAGE_REWARD_POOL()))
  console.log("Vesting owner", await v.owner(), "meshToken", await v.meshToken())
}
main().catch((e) => { console.error(e); process.exitCode = 1 })
