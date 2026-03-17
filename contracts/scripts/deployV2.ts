import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Weave V2 with account:", deployer.address);

  // 1. Deploy WeaveToken (100M supply)
  const WeaveToken = await ethers.getContractFactory("WeaveToken");
  const token = await WeaveToken.deploy(
    deployer.address, // rewardsVault (LP) - placeholder
    deployer.address, // teamVesting - will transfer to WeaveVesting
    deployer.address, // treasury
    deployer.address, // airdrop
    deployer.address  // partners
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("WEAVE Token deployed to:", tokenAddress);

  // 2. Deploy VeWeave
  const VeWeave = await ethers.getContractFactory("VeWeave");
  const veWeave = await VeWeave.deploy(tokenAddress);
  await veWeave.waitForDeployment();
  const veWeaveAddress = await veWeave.getAddress();
  console.log("veWEAVE deployed to:", veWeaveAddress);

  // 3. Deploy WeaveRewards (using MockUSDC address from previous deploy)
  const deploymentPath = path.join(__dirname, "../deployments/testnet.json");
  const v1 = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const WeaveRewards = await ethers.getContractFactory("WeaveRewards");
  const rewards = await WeaveRewards.deploy(v1.contracts.mockUSDC, veWeaveAddress);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("WeaveRewards deployed to:", rewardsAddress);

  // 4. Deploy WeaveGauge
  const WeaveGauge = await ethers.getContractFactory("WeaveGauge");
  const gauge = await WeaveGauge.deploy(veWeaveAddress);
  await gauge.waitForDeployment();
  const gaugeAddress = await gauge.getAddress();
  console.log("WeaveGauge deployed to:", gaugeAddress);

  // 5. Deploy WeaveVesting (20M WEAVE for team)
  const WeaveVesting = await ethers.getContractFactory("WeaveVesting");
  const teamAmount = ethers.parseUnits("20000000", 18);
  const vesting = await WeaveVesting.deploy(tokenAddress, deployer.address, teamAmount);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("WeaveVesting deployed to:", vestingAddress);

  // 6. Setup Vault V2 (Connect rewards)
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const vault = WeaveVault.attach(v1.contracts.weaveVault) as any;
  await vault.setFeeRecipient(rewardsAddress);
  console.log("Vault Fee Recipient set to rewards contract.");

  // Save V2 deployments
  const v2Data = {
    network: "initiaTestnet",
    deployedAt: new Date().toISOString(),
    contracts: {
      ...v1.contracts,
      weaveToken: tokenAddress,
      veWeave: veWeaveAddress,
      weaveRewards: rewardsAddress,
      weaveGauge: gaugeAddress,
      weaveVesting: vestingAddress
    }
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployments/v2-testnet.json"),
    JSON.stringify(v2Data, null, 2)
  );
  console.log("🚀 V2 Deployment data saved to deployments/v2-testnet.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
