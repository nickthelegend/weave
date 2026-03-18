import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    initiaTestnet: {
      url: "https://rpc.testnet.initia.xyz",
      chainId: 1515,
      accounts: [PRIVATE_KEY],
      gasPrice: 1500000000,
    },
    minievm: {
      url: "https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz",
      chainId: 2124225178762456,
      accounts: [PRIVATE_KEY],
      gasPrice: 1500000000,
    },
    weaveLocal: {
      url: "http://140.245.243.150:8545",
      chainId: 1072375175819285, // eth_chainId of weave-3 on VPS
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
