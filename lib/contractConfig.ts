import { defineChain } from 'viem';

export const initiaTestnet = defineChain({
  id: 1515,
  name: 'Initia Testnet',
  network: 'initia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Initia',
    symbol: 'INIT',
  },
  rpcUrls: {
    default: {
      http: ['https://json-rpc.testnet.initia.xyz'],
    },
    public: {
      http: ['https://json-rpc.testnet.initia.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'InitiaScan', url: 'https://scan.testnet.initia.xyz' },
  },
  testnet: true,
});
