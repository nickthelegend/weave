import pkg from 'hardhat';
const { ethers } = pkg;
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey === "0000000000000000000000000000000000000000000000000000000000000000") {
    console.log("═══════════════════════════════════════");
    console.log("❌ ERROR: No private key found");
    console.log("═══════════════════════════════════════");
    console.log("Create contracts/.env with:");
    console.log("PRIVATE_KEY=your_private_key_here");
    console.log("");
    console.log("To generate a new wallet:");
    console.log("Run: node -e \"const {ethers} = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey)\"");
    console.log("═══════════════════════════════════════");
    return;
  }

  const [deployer] = await ethers.getSigners();

  let balance = BigInt(0);
  try {
    balance = await ethers.provider.getBalance(deployer.address);
  } catch (e) {
    // Silently handle connectivity issues during formatted print
  }

  console.log("═══════════════════════════════════════");
  console.log("WEAVE DEPLOYER ADDRESS");
  console.log("═══════════════════════════════════════");
  console.log("");
  console.log("Your address:");
  console.log(deployer.address);
  console.log("");
  console.log("INIT Balance:", ethers.formatEther(balance), "INIT");
  console.log("");

  if (balance === BigInt(0)) {
    console.log("⚠️ NEEDS FUNDING");
    console.log("");
    console.log("Go to this URL and paste your address:");
    console.log("https://faucet.testnet.initia.xyz");
    console.log("");
    console.log("Also try:");
    console.log("https://app.testnet.initia.xyz/faucet");
  } else {
    console.log("✅ FUNDED — ready to deploy");
    console.log("");
    console.log("Run:");
    console.log("npx hardhat run scripts/deploy.ts --network initiaTestnet");
  }

  console.log("");
  console.log("InitiaScan (check your address):");
  console.log(`https://scan.testnet.initia.xyz/address/${deployer.address}`);
  console.log("═══════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
