/**
 * Production-ready React hooks for BRLA/stBRLA contract interactions
 * 
 * Features:
 * - Automatic Polygon network switching
 * - Comprehensive error handling
 * - Performance optimized with memoization
 * - Type-safe transaction handling
 */
import { useAccount, useReadContract, useWriteContract, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useConnect } from 'wagmi'
import { formatUnits, parseUnits, encodeFunctionData } from 'viem'
import { CONTRACTS, ERC20_ABI, STAKED_BRLA_ABI, MAX_UINT256, TARGET_CHAIN_ID } from './contracts'
import { createContractError } from './errors'
import { useState, useMemo, useCallback } from 'react'

// Types for hook return values
export interface TransactionState {
  hash: string | null
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  isLoading: boolean
  error: Error | null
}

export interface ApprovalHookReturn extends TransactionState {
  approve: (amount?: string) => Promise<string>
  approveInfinite: () => Promise<string>
  hasEvmConnector: boolean
  isOnPolygon: boolean
}

export interface StakingHookReturn extends TransactionState {
  stake: (amount: string) => Promise<string>
  hasEvmConnector: boolean
  isOnPolygon: boolean
}

// Custom hook to ensure user is on Polygon
export function useEnsurePolygonNetwork() {
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const isOnPolygon = chainId === TARGET_CHAIN_ID
  const needsSwitch = chainId && chainId !== TARGET_CHAIN_ID

  const switchToPolygon = () => {
    if (needsSwitch && switchChain) {
      switchChain({ chainId: TARGET_CHAIN_ID })
    }
  }

  return {
    isOnPolygon,
    needsSwitch: !!needsSwitch,
    switchToPolygon,
  }
}

/**
 * Hook to get BRLA balance for connected wallet
 * Only works on Polygon network
 */
export function useBRLABalance() {
  const { address, chainId } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BRLA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: !!address && chainId === TARGET_CHAIN_ID,
    },
  })

  return {
    balance: balance ? formatUnits(balance as bigint, CONTRACTS.BRLA.decimals) : '0',
    balanceRaw: balance as bigint || 0n,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get stBRLA balance for connected wallet
 * Only works on Polygon network
 */
export function useStBRLABalance() {
  const { address, chainId } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
    abi: STAKED_BRLA_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: !!address && chainId === TARGET_CHAIN_ID,
    },
  })

  return {
    balance: balance ? formatUnits(balance as bigint, CONTRACTS.STAKED_BRLA.decimals) : '0',
    balanceRaw: balance as bigint || 0n,
    isLoading,
    refetch,
  }
}

/**
 * Hook to check BRLA allowance for stBRLA contract
 * Only works on Polygon network
 */
export function useBRLAAllowance() {
  const { address, chainId } = useAccount()

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BRLA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.STAKED_BRLA.address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: !!address && chainId === TARGET_CHAIN_ID,
    },
  })

  const hasInfiniteApproval = allowance ? (allowance as bigint) >= parseUnits('1000000000', CONTRACTS.BRLA.decimals) : false

  return {
    allowance: allowance ? formatUnits(allowance as bigint, CONTRACTS.BRLA.decimals) : '0',
    allowanceRaw: allowance as bigint || 0n,
    hasInfiniteApproval,
    isLoading,
    refetch,
  }
}

/**
 * Hook to approve BRLA for stBRLA contract
 * Automatically switches to Polygon network if needed
 * Requires EVM wallet (Coinbase, MetaMask, etc.)
 */
export function useApproveBRLA(): ApprovalHookReturn {
  const [approveTransactionHash, setApproveTransactionHash] = useState<string | null>(null)
  const { connectors } = useConnect()
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  
  const { sendTransaction, error, isPending } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: approveTransactionHash as `0x${string}`,
    chainId: TARGET_CHAIN_ID,
  })

  // Memoize connector checks for performance
  const hasEvmConnector = useMemo(() => 
    connectors.some(c => 
      c.name.toLowerCase().includes('coinbase') || 
      c.name.toLowerCase().includes('metamask') ||
      c.name.toLowerCase().includes('wallet')
    ), [connectors]
  )

  const isOnPolygon = useMemo(() => chainId === TARGET_CHAIN_ID, [chainId])

  const approve = useCallback(async (amount?: string) => {
    if (!hasEvmConnector) {
      throw createContractError('EVM_WALLET_REQUIRED', 'EVM wallet required. Please connect with Coinbase Wallet or MetaMask.')
    }

    // Auto-switch to Polygon network if needed
    if (!isOnPolygon) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID })
        await new Promise(resolve => setTimeout(resolve, 1500)) // Allow network switch to complete
      } catch (error) {
        throw createContractError('NETWORK_SWITCH_FAILED', 'Failed to switch to Polygon network. Please switch manually.', error instanceof Error ? error : undefined)
      }
    }

    const approvalAmount = amount ? parseUnits(amount, CONTRACTS.BRLA.decimals) : MAX_UINT256
    
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.STAKED_BRLA.address, approvalAmount],
    })
    
    return new Promise<string>((resolve, reject) => {
      try {
        sendTransaction(
          {
            to: CONTRACTS.BRLA.address as `0x${string}`,
            data,
            chainId: TARGET_CHAIN_ID,
            gas: 100000n,
          },
          {
            onSuccess: (hash) => {
              setApproveTransactionHash(hash)
              resolve(hash)
            },
            onError: (error) => {
              reject(createContractError('TRANSACTION_FAILED', `Transaction failed: ${error.message || 'Unknown error'}`, error instanceof Error ? error : undefined))
            },
          }
        )
      } catch (error) {
        reject(createContractError('TRANSACTION_FAILED', `Failed to submit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined))
      }
    })
  }, [hasEvmConnector, isOnPolygon, switchChain, sendTransaction, setApproveTransactionHash])

  const approveInfinite = useCallback(async () => await approve(), [approve])

  return {
    approve,
    approveInfinite,
    hash: approveTransactionHash,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
    error,
    hasEvmConnector,
    isOnPolygon,
  }
}

/**
 * Hook to stake BRLA for stBRLA
 * Automatically switches to Polygon network if needed
 * Requires EVM wallet (Coinbase, MetaMask, etc.)
 */
export function useStakeBRLA(): StakingHookReturn {
  const { address, chainId } = useAccount()
  const [stakeTransactionHash, setStakeTransactionHash] = useState<string | null>(null)
  const { connectors } = useConnect()
  const { switchChain } = useSwitchChain()
  
  const { sendTransaction, error, isPending } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: stakeTransactionHash as `0x${string}`,
    chainId: TARGET_CHAIN_ID,
  })

  // Memoize connector checks for performance
  const hasEvmConnector = useMemo(() => 
    connectors.some(c => 
      c.name.toLowerCase().includes('coinbase') || 
      c.name.toLowerCase().includes('metamask') ||
      c.name.toLowerCase().includes('wallet')
    ), [connectors]
  )

  const isOnPolygon = useMemo(() => chainId === TARGET_CHAIN_ID, [chainId])

  const stake = useCallback(async (amount: string) => {
    if (!address) {
      throw createContractError('WALLET_NOT_CONNECTED', 'Wallet not connected')
    }

    if (!hasEvmConnector) {
      throw createContractError('EVM_WALLET_REQUIRED', 'EVM wallet required. Please connect with Coinbase Wallet or MetaMask.')
    }

    // Auto-switch to Polygon network if needed
    if (!isOnPolygon) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID })
        await new Promise(resolve => setTimeout(resolve, 1500)) // Allow network switch to complete
      } catch (error) {
        throw createContractError('NETWORK_SWITCH_FAILED', 'Failed to switch to Polygon network. Please switch manually.', error instanceof Error ? error : undefined)
      }
    }

    const stakeAmount = parseUnits(amount, CONTRACTS.BRLA.decimals)
    
    const data = encodeFunctionData({
      abi: STAKED_BRLA_ABI,
      functionName: 'stake',
      args: [address, stakeAmount],
    })
    
    return new Promise<string>((resolve, reject) => {
      try {
        sendTransaction(
          {
            to: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
            data,
            chainId: TARGET_CHAIN_ID,
            gas: 200000n,
          },
          {
            onSuccess: (hash) => {
              setStakeTransactionHash(hash)
              resolve(hash)
            },
            onError: (error) => {
              reject(createContractError('TRANSACTION_FAILED', `Transaction failed: ${error.message || 'Unknown error'}`, error instanceof Error ? error : undefined))
            },
          }
        )
      } catch (error) {
        reject(createContractError('TRANSACTION_FAILED', `Failed to submit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined))
      }
    })
  }, [address, hasEvmConnector, isOnPolygon, switchChain, sendTransaction, setStakeTransactionHash])

  return {
    stake,
    hash: stakeTransactionHash,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
    error,
    hasEvmConnector,
    isOnPolygon,
  }
}

// Hook to unstake stBRLA for BRLA
export function useUnstakeBRLA() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: TARGET_CHAIN_ID,
  })

  const unstake = (amount: string) => {
    if (!address) return

    const unstakeAmount = parseUnits(amount, CONTRACTS.STAKED_BRLA.decimals)
    
    const payload = {
      address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
      abi: STAKED_BRLA_ABI,
      functionName: 'unstake',
      args: [address, address, unstakeAmount], // from, to, stBrlaAmount
      chainId: TARGET_CHAIN_ID,
    }
    
    console.log('🔍 [DEBUG] Unstake transaction payload:', {
      contractAddress: payload.address,
      userAddress: address,
      unstakeAmount: unstakeAmount.toString(),
      unstakeAmountFormatted: amount,
      chainId: payload.chainId
    })
    
    writeContract(payload)
  }

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
  }
}

// Hook to get stBRLA current price from contract
export function useStBRLAPrice() {
  const { chainId } = useAccount()

  const { data: price, isLoading, refetch } = useReadContract({
    address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
    abi: STAKED_BRLA_ABI,
    functionName: '_currentPrice',
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  })

  return {
    price,
    isLoading,
    refetch,
  }
}

// Hook to get total stBRLA supply
export function useStBRLATotalSupply() {
  const { chainId } = useAccount()

  const { data: totalSupply, isLoading, refetch } = useReadContract({
    address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
    abi: STAKED_BRLA_ABI,
    functionName: 'totalSupply',
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  })

  return {
    totalSupply: totalSupply ? formatUnits(totalSupply as bigint, CONTRACTS.STAKED_BRLA.decimals) : '0',
    totalSupplyRaw: totalSupply as bigint || 0n,
    isLoading,
    refetch,
  }
}