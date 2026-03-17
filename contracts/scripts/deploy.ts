import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Starting deployment with account:", deployer.address);

  // Connectivity & Balance Check
  const network = await ethers.provider.getNetwork();
  console.log("Connected to chainId:", network.chainId.toString());
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "INIT");

  if (balance === 0n) {
    console.error("❌ ERROR: Deployer has no INIT — get testnet tokens from https://faucet.testnet.initia.xyz");
    process.exit(1);
  }

  // 1. Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

  // 2. Deploy MockINIT
  console.log("Deploying MockINIT...");
  const mockINIT = await MockERC20.deploy("Mock INIT", "mINIT", 6);
  await mockINIT.waitForDeployment();
  const mockINITAddress = await mockINIT.getAddress();
  console.log("✅ MockINIT deployed to:", mockINITAddress);

  // 3. Deploy WeaveVault
  console.log("Deploying WeaveVault...");
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const weaveVault = await WeaveVault.deploy(mockUSDCAddress);
  await weaveVault.waitForDeployment();
  const weaveVaultAddress = await weaveVault.getAddress();
  console.log("✅ WeaveVault deployed to:", weaveVaultAddress);

  // 4. Deploy WeaveZapIn
  console.log("Deploying WeaveZapIn...");
  const WeaveZapIn = await ethers.getContractFactory("WeaveZapIn");
  const weaveZapIn = await WeaveZapIn.deploy();
  await weaveZapIn.waitForDeployment();
  const weaveZapInAddress = await weaveZapIn.getAddress();
  console.log("✅ WeaveZapIn deployed to:", weaveZapInAddress);

  // 5. Setup Keeper
  await weaveVault.setKeeper(deployer.address);
  console.log("✅ Keeper set to:", deployer.address);

  // 6. Mint 1,000,000 USDC to deployer for testing
  await mockUSDC.mint(deployer.address, ethers.parseUnits("1000000", 6));
  console.log("✅ Minted 1,000,000 mUSDC to deployer");

  // 7. Save addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: "initiaTestnet",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      weaveVault: weaveVaultAddress,
      weaveZapIn: weaveZapInAddress,
      mockUSDC: mockUSDCAddress,
      mockINIT: mockINITAddress
    },
    weaveToken: "NOT_DEPLOYED — planned v2"
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "testnet.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("🚀 Deployment data saved to deployments/testnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
