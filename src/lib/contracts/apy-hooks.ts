// React hooks for APY calculations
import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, ERC20_ABI, STAKED_BRLA_ABI, TARGET_CHAIN_ID } from './contracts';
import { apyCalculator } from './apy-calculator';

// Hook to get stBRLA price and APY data
export function useStBRLAAPY() {
  const { chainId } = useAccount()
  const [apyData, setApyData] = useState<{
    currentAPY: number;
    estimatedAPY: number;
    isLoading: boolean;
  }>({
    currentAPY: 0,
    estimatedAPY: 0,
    isLoading: true,
  });

  // Get total supply of stBRLA
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
    abi: STAKED_BRLA_ABI,
    functionName: 'totalSupply',
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  });

  // Get BRLA balance of stBRLA contract
  const { data: brlaBalance } = useReadContract({
    address: CONTRACTS.BRLA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.STAKED_BRLA.address],
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  });

  // Calculate estimated APY (simplified version)
  const estimatedAPY = useMemo(() => {
    // For demo purposes, showing a static 12% APY
    // In reality, this would be calculated from historical data
    return 12.0; 
  }, []);

  // Take snapshot and calculate APY (this would normally be done periodically)
  useEffect(() => {
    if (totalSupply && brlaBalance && typeof totalSupply === 'bigint' && typeof brlaBalance === 'bigint') {
      try {
        // Take initial snapshot if none exists
        if (apyCalculator.getSnapshotCount() === 0) {
          apyCalculator.takeSnapshot(totalSupply, brlaBalance, 'initial');
        }

        // For demo, simulate some historical data
        const _mockHistoricalPrice = apyCalculator.calculateCurrentPrice(totalSupply, brlaBalance);
        
        setApyData({
          currentAPY: estimatedAPY,
          estimatedAPY: estimatedAPY,
          isLoading: false,
        });
      } catch (error) {
        console.error('APY calculation error:', error);
        setApyData({
          currentAPY: 0,
          estimatedAPY: 0,
          isLoading: false,
        });
      }
    }
  }, [totalSupply, brlaBalance, estimatedAPY]);

  return apyData;
}

// Hook to get current stBRLA/BRLA exchange rate
export function useStBRLAExchangeRate() {
  const { chainId } = useAccount()

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.STAKED_BRLA.address as `0x${string}`,
    abi: STAKED_BRLA_ABI,
    functionName: 'totalSupply',
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  });

  const { data: brlaBalance } = useReadContract({
    address: CONTRACTS.BRLA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.STAKED_BRLA.address],
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: chainId === TARGET_CHAIN_ID,
    },
  });

  const exchangeRate = useMemo(() => {
    if (!totalSupply || !brlaBalance || totalSupply === 0n) {
      return 1.0; // 1:1 ratio when no staking exists
    }

    const rate = Number(brlaBalance) / Number(totalSupply);
    return rate;
  }, [totalSupply, brlaBalance]);

  return {
    rate: exchangeRate,
    isLoading: !totalSupply || !brlaBalance,
  };
}

// Hook to estimate rewards for a given amount
export function useStakingRewardsEstimate(stakeAmount: string) {
  const { currentAPY } = useStBRLAAPY();
  
  const estimates = useMemo(() => {
    const amount = parseFloat(stakeAmount) || 0;
    if (amount === 0 || currentAPY === 0) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
      };
    }

    const dailyRate = currentAPY / 100 / 365;
    const daily = amount * dailyRate;
    
    return {
      daily,
      weekly: daily * 7,
      monthly: daily * 30,
      yearly: amount * (currentAPY / 100),
    };
  }, [stakeAmount, currentAPY]);

  return estimates;
}