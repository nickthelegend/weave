import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Starting Weave V3 Deployment (Final System) with account:", deployer.address);

  const deploymentPath = path.join(__dirname, "../deployments/testnet.json");
  const v1 = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const usdc = v1.contracts.mockUSDC;
  const treasury = deployer.address; // Change to real treasury if needed
  const dex = v1.contracts.weaveZapIn; // Placeholder for Dex

  // 1. Deploy VIPScore
  const VIPScore = await ethers.getContractFactory("VIPScore");
  const vipScore = await VIPScore.deploy();
  await vipScore.waitForDeployment();
  const vipScoreAddr = await vipScore.getAddress();
  console.log("VIPScore deployed to:", vipScoreAddr);

  // 2. Deploy WeaveVault
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const vault = await (WeaveVault as any).deploy(usdc, treasury, dex);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("WeaveVault deployed to:", vaultAddr);

  // 3. Deploy Strategies
  const keeper = deployer.address; // Keeper bot address

  // EchelonStrategy
  const EchelonStrategy = await ethers.getContractFactory("EchelonStrategy");
  const echelon = await EchelonStrategy.deploy(
    usdc,
    vaultAddr,
    treasury,
    "0x3ad1bf95700fab6923cdf1049bea9746c7f2ae91df2139ca57c609fba8fed95a" // USDC market
  );
  await echelon.waitForDeployment();
  const echelonAddr = await echelon.getAddress();
  console.log("EchelonStrategy deployed to:", echelonAddr);

  // InitiaDEXStrategy
  const InitiaDEXStrategy = await ethers.getContractFactory("InitiaDEXStrategy");
  const initiaDex = await InitiaDEXStrategy.deploy(
    usdc,
    vaultAddr,
    treasury,
    keeper
  );
  await initiaDex.waitForDeployment();
  const initiaDexAddr = await initiaDex.getAddress();
  console.log("InitiaDEXStrategy deployed to:", initiaDexAddr);

  // StableLPStrategy
  const StableLPStrategy = await ethers.getContractFactory("StableLPStrategy");
  const stableLp = await StableLPStrategy.deploy(
    usdc,
    vaultAddr,
    treasury,
    keeper
  );
  await stableLp.waitForDeployment();
  const stableLpAddr = await stableLp.getAddress();
  console.log("StableLPStrategy deployed to:", stableLpAddr);

  // 4. Connect Vault to Strategies (Demo uses one primary strategy, but multiple can be tracked)
  await (vault as any).setStrategy(echelonAddr);
  await (vault as any).setKeeper(keeper);
  console.log("Vault configured with Echelon Strategy and Keeper.");

  // Save V3 deployments
  const v3Data = {
    network: "initiaTestnet",
    deployedAt: new Date().toISOString(),
    contracts: {
      ...v1.contracts,
      weaveVaultV3: vaultAddr,
      vipScore: vipScoreAddr,
      echelonStrategy: echelonAddr,
      initiaDEXStrategy: initiaDexAddr,
      stableLPStrategy: stableLpAddr
    }
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployments/v3-testnet.json"),
    JSON.stringify(v3Data, null, 2)
  );
  console.log("✅ V3 Deployment complete! Data saved to deployments/v3-testnet.json");

  // Output .env format for the user
  console.log("\n--- .env Update ---");
  console.log(`WEAVE_VAULT_ADDRESS=${vaultAddr}`);
  console.log(`VIP_SCORE_CONTRACT=${vipScoreAddr}`);
  console.log(`ECHELON_STRATEGY=${echelonAddr}`);
  console.log(`INITIADEX_STRATEGY=${initiaDexAddr}`);
  console.log(`STABLELP_STRATEGY=${stableLpAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
