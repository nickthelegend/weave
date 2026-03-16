import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments/testnet.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run deploy script first.");
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log("Verifying deployment on network:", deployment.network);

  // Verify Vault
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const vault = WeaveVault.attach(deployment.contracts.weaveVault) as any;
  const pps = await vault.getPricePerShare();
  console.log("Vault PPS:", ethers.formatUnits(pps, 6));

  // Verify Mock USDC
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(deployment.contracts.mockUSDC) as any;
  const name = await usdc.name();
  const decimals = await usdc.decimals();
  console.log("Token Name:", name);
  console.log("Token Decimals:", decimals.toString());

  console.log("✅ Deployment verification complete. Status: GOOD");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
