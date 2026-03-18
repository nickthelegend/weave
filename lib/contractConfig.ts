import { createPublicClient, http } from "viem"

export const minievm = {
  id: 1610154616031844,
  name: "Minievm",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] }
  },
  blockExplorers: {
    default: { name: "InitiaScan", url: "https://scan.testnet.initia.xyz" }
  }
}

export const publicClient = createPublicClient({
  chain: minievm as any,
  transport: http()
})

export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`
export const ZAP_ADDRESS = process.env.NEXT_PUBLIC_ZAP_ADDRESS as `0x${string}`
export const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`
export const MOCK_INIT_ADDRESS = process.env.NEXT_PUBLIC_MOCK_INIT_ADDRESS as `0x${string}`
