import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Making test deposit with account:", user.address);

  const deploymentPath = path.join(__dirname, "../deployments/v3-testnet.json");
  const v3 = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const vaultAddr = v3.contracts.weaveVaultV3;
  const usdcAddr = v3.contracts.mockUSDC;

  const usdc = await ethers.getContractAt("IERC20", usdcAddr);
  const vault = await ethers.getContractAt("WeaveVault", vaultAddr);

  const amount = ethers.parseUnits("100", 6);

  console.log("Approving 100 mUSDC...");
  const tx1 = await usdc.approve(vaultAddr, amount);
  await tx1.wait();

  console.log("Depositing 100 mUSDC...");
  const tx2 = await (vault as any).deposit(amount);
  await tx2.wait();

  const shares = await (vault as any).balanceOf(user.address);
  const balance = await (vault as any).balanceOf(user.address);
  
  console.log("✅ Deposit Successful!");
  console.log("Shares Minted:", ethers.formatUnits(shares, 6)); // shares 1:1 if 1.0 price
  console.log("Balance Of:", ethers.formatUnits(balance, 18)); // returns scaled decimals
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
