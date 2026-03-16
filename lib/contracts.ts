import deployment from '../contracts/deployments/testnet.json';
import WeaveVaultABI from '../contracts/artifacts/contracts/WeaveVault.sol/WeaveVault.json';
import WeaveZapInABI from '../contracts/artifacts/contracts/WeaveZapIn.sol/WeaveZapIn.json';
import MockERC20ABI from '../contracts/artifacts/contracts/MockERC20.sol/MockERC20.json';
import { Address } from 'viem';

export const CONTRACT_ADDRESSES = {
  weaveVault: deployment.contracts.weaveVault as Address,
  weaveZapIn: deployment.contracts.weaveZapIn as Address,
  mockUSDC: deployment.contracts.mockUSDC as Address,
  mockINIT: deployment.contracts.mockINIT as Address,
};

export const ABIS = {
  weaveVault: WeaveVaultABI.abi,
  weaveZapIn: WeaveZapInABI.abi,
  mockERC20: MockERC20ABI.abi,
};
