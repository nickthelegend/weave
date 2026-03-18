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
      url: "http://localhost:8545",
      chainId: 1610154616031844, // eth_chainId of weave-1
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
