// React hooks for BRLA/stBRLA contract interactions
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { CONTRACTS, ERC20_ABI, STAKED_BRLA_ABI, MAX_UINT256, TARGET_CHAIN_ID } from './contracts'
import { useEffect } from 'react'

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

// Hook to get BRLA balance for connected wallet
export function useBRLABalance() {
  const { address, chainId } = useAccount()
  const { switchToPolygon } = useEnsurePolygonNetwork()

  // Auto-switch to Polygon if connected to wrong network
  useEffect(() => {
    if (address && chainId && chainId !== TARGET_CHAIN_ID) {
      switchToPolygon()
    }
  }, [address, chainId, switchToPolygon])

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

// Hook to get stBRLA balance for connected wallet
export function useStBRLABalance() {
  const { address, chainId } = useAccount()
  const { switchToPolygon } = useEnsurePolygonNetwork()

  // Auto-switch to Polygon if connected to wrong network
  useEffect(() => {
    if (address && chainId && chainId !== TARGET_CHAIN_ID) {
      switchToPolygon()
    }
  }, [address, chainId, switchToPolygon])

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

// Hook to check BRLA allowance for stBRLA contract
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

// Hook to approve BRLA for stBRLA contract
export function useApproveBRLA() {
  const { writeContract, data: hash, isPending, error } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error('🔍 [DEBUG] useWriteContract onError:', error)
      },
      onSuccess: (data) => {
        console.log('🔍 [DEBUG] useWriteContract onSuccess:', data)
      }
    }
  })

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: TARGET_CHAIN_ID,
  })

  const approve = (amount?: string) => {
    console.log('🔍 [DEBUG] approve() called with amount:', amount)
    
    const approvalAmount = amount ? parseUnits(amount, CONTRACTS.BRLA.decimals) : MAX_UINT256
    
    const payload = {
      address: CONTRACTS.BRLA.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.STAKED_BRLA.address, approvalAmount],
      chainId: TARGET_CHAIN_ID,
    }
    
    console.log('🔍 [DEBUG] Approve transaction payload:', {
      contractAddress: payload.address,
      spender: CONTRACTS.STAKED_BRLA.address,
      amount: approvalAmount.toString(),
      chainId: payload.chainId,
      isInfiniteApproval: !amount,
      MAX_UINT256: MAX_UINT256.toString()
    })
    
    console.log('🔍 [DEBUG] About to call writeContract with payload:', payload)
    
    try {
      // ERC20 approve doesn't need to send any native tokens - NO VALUE FIELD!
      writeContract(payload)
      console.log('🔍 [DEBUG] writeContract call initiated successfully')
    } catch (error) {
      console.error('🔍 [DEBUG] writeContract call failed immediately:', error)
      throw error
    }
  }

  const approveInfinite = () => approve()

  return {
    approve,
    approveInfinite,
    hash,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
    error,
  }
}

// Hook to stake BRLA for stBRLA
export function useStakeBRLA() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: TARGET_CHAIN_ID,
  })

  const stake = (amount: string) => {
    if (!address) return

    const stakeAmount = parseUnits(amount, CONTRACTS.BRLA.decimals)
    
    const payload = {
      address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
      abi: STAKED_BRLA_ABI,
      functionName: 'stake',
      args: [address, stakeAmount],
      chainId: TARGET_CHAIN_ID,
    }
    
    console.log('🔍 [DEBUG] Stake transaction payload:', {
      contractAddress: payload.address,
      userAddress: address,
      stakeAmount: stakeAmount.toString(),
      stakeAmountFormatted: amount,
      chainId: payload.chainId
    })
    
    // Staking also doesn't require sending native tokens - NO VALUE FIELD!
    writeContract(payload)
  }

  return {
    stake,
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