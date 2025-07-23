import { polygon } from 'wagmi/chains';

// Contract addresses and configurations for BRLA/stBRLA on Polygon
export const CONTRACTS = {
  BRLA: {
    address: '0xe6a537a407488807f0bbeb0038b79004f19dddfb',
    decimals: 18,
    chainId: polygon.id, // 137
  },
  STAKED_BRLA: {
    address: '0x2305256fb0a361a4751f6c9a490768f24cccbba0',
    decimals: 18,
    chainId: polygon.id, // 137
  },
} as const

// Target chain configuration
export const TARGET_CHAIN = polygon;
export const TARGET_CHAIN_ID = polygon.id;

// Standard ERC20 ABI for BRLA token
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const

// Import stBRLA ABI from JSON file
export { default as STAKED_BRLA_ABI } from './staked-brla-abi.json'

// Maximum uint256 value for infinite approval
export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'