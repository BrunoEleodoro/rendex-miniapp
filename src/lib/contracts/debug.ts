// Debug utilities for contract interactions
import { useAccount, useBalance } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useBRLABalance, useBRLAAllowance, useStBRLABalance } from './hooks';
import { TARGET_CHAIN_ID } from './contracts';

export function useContractDebugInfo() {
  const { address, chainId, isConnected } = useAccount();
  const { data: maticBalance, isLoading: maticLoading } = useBalance({
    address,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: !!address && chainId === TARGET_CHAIN_ID,
    },
  });
  const { balance: brlaBalance, balanceRaw: brlaBalanceRaw, isLoading: brlaLoading } = useBRLABalance();
  const { balance: stBrlaBalance, balanceRaw: stBrlaBalanceRaw, isLoading: stBrlaLoading } = useStBRLABalance();
  const { allowance, allowanceRaw, hasInfiniteApproval, isLoading: allowanceLoading } = useBRLAAllowance();

  const debugInfo = {
    // Connection Status
    wallet: {
      address,
      chainId,
      isConnected,
      isOnCorrectChain: chainId === TARGET_CHAIN_ID,
      targetChainId: TARGET_CHAIN_ID,
    },
    // Balances
    balances: {
      matic: {
        formatted: maticBalance ? formatUnits(maticBalance.value, 18) : '0',
        raw: maticBalance?.value?.toString() || '0',
        isLoading: maticLoading,
        hasBalance: maticBalance?.value && maticBalance.value > 0n,
      },
      brla: {
        formatted: brlaBalance,
        raw: brlaBalanceRaw?.toString() || '0',
        isLoading: brlaLoading,
        hasBalance: brlaBalanceRaw && brlaBalanceRaw > 0n,
      },
      stBrla: {
        formatted: stBrlaBalance,
        raw: stBrlaBalanceRaw?.toString() || '0',
        isLoading: stBrlaLoading,
      },
    },
    // Allowance
    allowance: {
      formatted: allowance,
      raw: allowanceRaw?.toString() || '0',
      hasInfiniteApproval,
      isLoading: allowanceLoading,
    },
    // Overall Status
    status: {
      canApprove: !!(address && chainId === TARGET_CHAIN_ID && !allowanceLoading),
      canStake: !!(address && chainId === TARGET_CHAIN_ID && hasInfiniteApproval && brlaBalanceRaw && brlaBalanceRaw > 0n),
      readyForTransactions: !!(address && chainId === TARGET_CHAIN_ID),
      hasGasForTransactions: maticBalance?.value && maticBalance.value > parseUnits('0.001', 18), // At least 0.001 MATIC for gas
    }
  };

  return debugInfo;
}

export function logContractDebugInfo(debugInfo: ReturnType<typeof useContractDebugInfo>) {
  console.group('🔍 Contract Debug Info');
  
  console.log('👤 Wallet:', {
    address: debugInfo.wallet.address,
    chainId: debugInfo.wallet.chainId,
    isConnected: debugInfo.wallet.isConnected,
    isOnCorrectChain: debugInfo.wallet.isOnCorrectChain,
    targetChainId: debugInfo.wallet.targetChainId,
  });
  
  console.log('💰 Balances:', {
    matic: `${debugInfo.balances.matic.formatted} MATIC (${debugInfo.balances.matic.raw})`,
    brla: `${debugInfo.balances.brla.formatted} BRLA (${debugInfo.balances.brla.raw})`,
    stBrla: `${debugInfo.balances.stBrla.formatted} stBRLA (${debugInfo.balances.stBrla.raw})`,
    hasMaticBalance: debugInfo.balances.matic.hasBalance,
    hasBrlaBalance: debugInfo.balances.brla.hasBalance,
  });
  
  console.log('✅ Allowance:', {
    formatted: debugInfo.allowance.formatted,
    raw: debugInfo.allowance.raw,
    hasInfiniteApproval: debugInfo.allowance.hasInfiniteApproval,
  });
  
  console.log('🚦 Status:', debugInfo.status);
  
  console.groupEnd();
}