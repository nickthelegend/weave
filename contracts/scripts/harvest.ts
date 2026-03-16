import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Read addresses
  const deploymentPath = path.join(__dirname, "../deployments/testnet.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run deploy script first.");
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const vault = WeaveVault.attach(deployment.contracts.weaveVault) as any;
  
  console.log("Harvesting yield for vault:", deployment.contracts.weaveVault);

  // 2. Call harvest (50 USDC)
  const yieldAmount = ethers.parseUnits("50", 6);
  
  // Note: For a real testnet harvest to work, tokens must be in the vault.
  // In this simulation script, we just call the state update.
  const tx = await vault.harvest(yieldAmount);
  await tx.wait();
  
  console.log("Harvest successful!");

  // 3. Log stats
  const price = await vault.getPricePerShare();
  const stats = await vault.getVaultStats();
  
  console.log("New Price Per Share:", ethers.formatUnits(price, 6), "USDC");
  console.log("Total Yield Generated:", ethers.formatUnits(stats._totalYieldGenerated, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
