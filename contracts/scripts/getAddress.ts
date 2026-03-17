import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════");
  console.log("Your deployer address:");
  console.log(deployer.address);
  console.log("Current INIT balance:", ethers.formatEther(balance));

  if (balance === 0n) {
    console.log("⚠️ BALANCE IS ZERO");
    console.log("Fund this address at:");
    console.log("https://faucet.testnet.initia.xyz");
  } else {
    console.log("✅ Ready to deploy");
  }
  console.log("═══════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
