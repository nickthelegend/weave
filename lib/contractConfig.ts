import { createPublicClient, http } from "viem"

export const initiaTestnet = {
  id: 1515,
  name: "Initia Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://json-rpc.testnet.initia.xyz"] }
  },
  blockExplorers: {
    default: { name: "InitiaScan", url: "https://scan.testnet.initia.xyz" }
  }
}

export const publicClient = createPublicClient({
  chain: initiaTestnet,
  transport: http()
})

export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`
export const ZAP_ADDRESS = process.env.NEXT_PUBLIC_ZAP_ADDRESS as `0x${string}`
export const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`
export const MOCK_INIT_ADDRESS = process.env.NEXT_PUBLIC_MOCK_INIT_ADDRESS as `0x${string}`
