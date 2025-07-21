'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { useAvenia } from '../../hooks/useAvenia';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface BalanceCardProps {
  userId: string;
  onPixPayment: () => void;
  onConvert: (currency: 'USDC' | 'USDT') => void;
}

interface Balances {
  BRLA: string;
  USDC: string;
  USDT: string;
  USDM: string;
}

export const BalanceCard = ({ userId, onPixPayment, onConvert }: BalanceCardProps) => {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [realTimeMessage, setRealTimeMessage] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const { getBalances, loading } = useAvenia();

  // Set up real-time updates for balance changes
  const { isConnected, connectionError } = useRealTimeUpdates({
    userId,
    onPaymentUpdate: (update) => {
      console.log(`[BalanceCard] Real-time payment update received:`, update);
      
      if (update.message) {
        setRealTimeMessage(update.message);
        console.log(`[BalanceCard] Real-time message: ${update.message}`);
        
        // Auto-clear message after 5 seconds
        setTimeout(() => setRealTimeMessage(''), 5000);
      }
      
      // Refresh balances when payment is completed
      if (update.type === 'payment_completed') {
        console.log(`[BalanceCard] Payment completed, refreshing balances`);
        loadBalances();
      }
    },
    autoReconnect: true
  });

  const loadBalances = useCallback(async () => {
    console.log(`[BalanceCard] Loading balances for user: ${userId}`);
    setRefreshing(true);
    
    try {
      const userBalances = await getBalances(userId);
      setBalances(userBalances);
      console.log(`[BalanceCard] Balances loaded successfully for user: ${userId}`, userBalances);
    } catch (error) {
      console.error(`[BalanceCard] Failed to load balances for user ${userId}:`, error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, getBalances]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const formatBalance = (balance: string, currency: string) => {
    const num = parseFloat(balance) || 0;
    
    if (currency === 'BRLA') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BRLA':
        return '🇧🇷';
      case 'USDC':
        return '💰';
      case 'USDT':
        return '🏦';
      default:
        return '💎';
    }
  };

  const getTotalValueInBRL = () => {
    if (!balances) return 0;
    
    // Simplified calculation - in reality you'd need exchange rates
    const brlaValue = parseFloat(balances.BRLA) || 0;
    const usdcValue = (parseFloat(balances.USDC) || 0) * 5.5; // Approximate BRL rate
    const usdtValue = (parseFloat(balances.USDT) || 0) * 5.5; // Approximate BRL rate
    
    return brlaValue + usdcValue + usdtValue;
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold">Your Portfolio</h2>
        <Button
          onClick={loadBalances}
          disabled={loading || refreshing}
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-white hover:text-blue-600"
        >
          {(loading || refreshing) ? '↻' : '⟳'}
        </Button>
      </div>

      {realTimeMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {realTimeMessage}
        </div>
      )}

      {connectionError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Real-time updates disconnected: {connectionError}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-sm opacity-80">
          {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-sm opacity-80">Total Value</p>
        <p className="text-3xl font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(getTotalValueInBRL())}
        </p>
      </div>

      {balances ? (
        <div className="space-y-3 mb-6">
          {Object.entries(balances).map(([currency, balance]) => (
            <div key={currency} className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCurrencyIcon(currency)}</span>
                <span className="font-medium">{currency}</span>
              </div>
              <span className="font-semibold">
                {formatBalance(balance, currency)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          <div className="animate-pulse bg-white/20 h-6 rounded"></div>
          <div className="animate-pulse bg-white/20 h-6 rounded"></div>
          <div className="animate-pulse bg-white/20 h-6 rounded"></div>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={onPixPayment}
          className="w-full bg-white text-blue-600 hover:bg-gray-100"
        >
          💳 Add Money via PIX
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => onConvert('USDC')}
            variant="outline"
            size="sm"
            className="text-white border-white hover:bg-white hover:text-blue-600"
            disabled={!balances || parseFloat(balances.BRLA) <= 0}
          >
            Convert to USDC
          </Button>
          <Button
            onClick={() => onConvert('USDT')}
            variant="outline"
            size="sm"
            className="text-white border-white hover:bg-white hover:text-blue-600"
            disabled={!balances || parseFloat(balances.BRLA) <= 0}
          >
            Convert to USDT
          </Button>
        </div>
      </div>

      {balances && parseFloat(balances.BRLA) <= 0 && (
        <p className="text-xs opacity-80 mt-2 text-center">
          Add BRLA to enable currency conversion
        </p>
      )}

      <p className="text-xs opacity-60 mt-4 text-center">
        Balances update automatically via real-time webhooks when transactions complete.
      </p>
    </div>
  );
};