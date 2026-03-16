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
      url: "https://json-rpc.testnet.initia.xyz",
      chainId: 1515,
      accounts: [PRIVATE_KEY],
      gasPrice: 1500000000,
    },
  },
};

export default config;
