import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockUSDC
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // 2. Deploy MockINIT
  const mockINIT = await MockERC20.deploy("Mock INIT", "INIT", 6);
  await mockINIT.waitForDeployment();
  const mockINITAddress = await mockINIT.getAddress();
  console.log("MockINIT deployed to:", mockINITAddress);

  // 3. Deploy WeaveVault
  const WeaveVault = await ethers.getContractFactory("WeaveVault");
  const weaveVault = await WeaveVault.deploy(mockUSDCAddress);
  await weaveVault.waitForDeployment();
  const weaveVaultAddress = await weaveVault.getAddress();
  console.log("WeaveVault deployed to:", weaveVaultAddress);

  // 4. Deploy WeaveZapIn
  const WeaveZapIn = await ethers.getContractFactory("WeaveZapIn");
  const weaveZapIn = await WeaveZapIn.deploy(weaveVaultAddress, mockUSDCAddress);
  await weaveZapIn.waitForDeployment();
  const weaveZapInAddress = await weaveZapIn.getAddress();
  console.log("WeaveZapIn deployed to:", weaveZapInAddress);

  // 5. Mint 100,000 USDC to deployer for testing
  const mintAmount = ethers.parseUnits("100000", 6);
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("Minted 100,000 USDC to deployer");

  // 6. Save addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentData = {
    network: "initiaTestnet",
    weaveVault: weaveVaultAddress,
    weaveZapIn: weaveZapInAddress,
    mockUSDC: mockUSDCAddress,
    mockINIT: mockINITAddress,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "testnet.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Deployment data saved to deployments/testnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
