'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { 
  useBRLABalance, 
  useBRLAAllowance, 
  useApproveBRLA, 
  useStakeBRLA,
  useStBRLAAPY,
  useStakingRewardsEstimate,
  useEnsurePolygonNetwork
} from '../../lib/contracts';
import { useContractDebugInfo, logContractDebugInfo } from '../../lib/contracts/debug';
import { NetworkIndicator } from '../ui/NetworkIndicator';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StakingStep = 'input' | 'approve' | 'approving' | 'stake' | 'staking' | 'success';

export const StakingModal = ({ isOpen, onClose }: StakingModalProps) => {
  const [step, setStep] = useState<StakingStep>('input');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Network management
  const { isOnPolygon: _isOnPolygon, needsSwitch: _needsSwitch } = useEnsurePolygonNetwork();

  // Contract hooks
  const { balance: brlaBalance, balanceRaw: _brlaBalanceRaw } = useBRLABalance();
  const { hasInfiniteApproval, refetch: refetchAllowance } = useBRLAAllowance();
  const { approveInfinite, isLoading: isApproving, hash: approveHash, error: approveError } = useApproveBRLA();
  const { stake, isLoading: isStaking, hash: stakeHash } = useStakeBRLA();
  
  // APY and rewards hooks
  const { currentAPY, isLoading: apyLoading } = useStBRLAAPY();
  const rewardsEstimate = useStakingRewardsEstimate(amount);

  // Debug info
  const debugInfo = useContractDebugInfo();

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  // Handle approval completion
  useEffect(() => {
    if (approveHash && step === 'approving') {
      setStep('stake');
      refetchAllowance();
    }
  }, [approveHash, step, refetchAllowance]);

  // Handle staking completion
  useEffect(() => {
    if (stakeHash && step === 'staking') {
      setStep('success');
    }
  }, [stakeHash, step]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');
    
    // Validate amount
    const numAmount = parseFloat(value);
    const maxBalance = parseFloat(brlaBalance);
    
    if (numAmount > maxBalance) {
      setError(`Insufficient BRLA balance. Maximum: ${brlaBalance}`);
    } else if (numAmount <= 0) {
      setError('Amount must be greater than 0');
    }
  };

  const handleMaxClick = () => {
    setAmount(brlaBalance);
    setError('');
  };

  const handleApprove = async () => {
    setStep('approving');
    setError('');
    
    // Log debug info before attempting approval
    console.log('🚀 Starting approval process...');
    logContractDebugInfo(debugInfo);
    
    try {
      await approveInfinite();
    } catch (err: any) {
      console.error('❌ Approval failed:', err);
      console.error('❌ Wagmi error object:', approveError);
      console.log('💡 Debug info at time of failure:');
      logContractDebugInfo(debugInfo);
      
      let errorMessage = 'Approval failed. Please try again.';
      
      if (err?.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (err?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else if (err?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Also check the wagmi error
      if (approveError?.message) {
        console.error('❌ Wagmi error message:', approveError.message);
        errorMessage += ` (${approveError.message})`;
      }
      
      setError(errorMessage);
      setStep('approve');
    }
  };

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setStep('staking');
    setError('');
    try {
      await stake(amount);
    } catch (err: any) {
      console.error('Staking failed:', err);
      let errorMessage = 'Staking failed. Please try again.';
      
      if (err?.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (err?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else if (err?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err?.message?.includes('allowance')) {
        errorMessage = 'Insufficient allowance. Please approve first.';
      }
      
      setError(errorMessage);
      setStep('stake');
    }
  };

  const handleContinue = () => {
    if (step === 'input') {
      if (hasInfiniteApproval) {
        setStep('stake');
      } else {
        setStep('approve');
      }
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stake BRLA</h2>
              <p className="text-gray-600">
                Stake your BRLA tokens to earn rewards with stBRLA
              </p>
            </div>

            <div className="space-y-4">
              {/* APY Display */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {apyLoading ? 'Loading...' : `${currentAPY.toFixed(1)}%`}
                </div>
                <div className="text-sm text-gray-600">Current APY</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Stake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 font-medium text-sm hover:text-blue-600"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Available: {brlaBalance} BRLA</span>
                  <span>≈ R$ {(parseFloat(amount || '0') * 1).toFixed(2)}</span>
                </div>
              </div>

              {/* Rewards Estimate */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Estimated Rewards</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Daily:</span>
                      <span className="font-medium ml-1 text-gray-700">R$ {rewardsEstimate.daily.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly:</span>
                      <span className="font-medium ml-1 text-gray-700">R$ {rewardsEstimate.monthly.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Weekly:</span>
                      <span className="font-medium ml-1 text-gray-700">R$ {rewardsEstimate.weekly.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Yearly:</span>
                      <span className="font-medium ml-1 text-gray-700">R$ {rewardsEstimate.yearly.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0 || !!error || parseFloat(amount) > parseFloat(brlaBalance)}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Continue
            </Button>
          </div>
        );

      case 'approve':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Approve BRLA</h2>
              <p className="text-gray-600">
                First, you need to approve BRLA tokens for staking. This is a one-time approval.
              </p>
            </div>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full bg-yellow-500 hover:bg-yellow-600"
            >
              {isApproving ? 'Approving...' : 'Approve BRLA'}
            </Button>
            
            {/* Debug Button */}
            <button
              onClick={() => {
                console.log('🔍 Manual Debug Info Request:');
                logContractDebugInfo(debugInfo);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 p-2 border border-gray-200 rounded"
            >
              Debug Contract Info
            </button>
          </div>
        );

      case 'approving':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto animate-spin">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Approving...</h2>
              <p className="text-gray-600">
                Please confirm the approval transaction in your wallet.
              </p>
            </div>
          </div>
        );

      case 'stake':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Stake</h2>
              <p className="text-gray-600 mb-4">
                You&apos;re about to stake {amount} BRLA tokens.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-700">{amount} BRLA</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">You'll receive:</span>
                  <span className="font-medium text-gray-700">≈ {amount} stBRLA</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleStake}
              disabled={isStaking}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isStaking ? 'Staking...' : 'Stake Now'}
            </Button>
          </div>
        );

      case 'staking':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Staking...</h2>
              <p className="text-gray-600">
                Please confirm the staking transaction in your wallet.
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Staking Successful!</h2>
              <p className="text-gray-600 mb-4">
                You&apos;ve successfully staked {amount} BRLA tokens.
              </p>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Staked:</span>
                  <span className="font-medium text-green-600">{amount} BRLA</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Received:</span>
                  <span className="font-medium text-green-600">≈ {amount} stBRLA</span>
                </div>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Done
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 w-full max-w-md"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              {['input', 'approve', 'stake', 'success'].map((s, _i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${
                    (step === s || 
                     (s === 'approve' && (step === 'approving' || step === 'stake' || step === 'staking' || step === 'success')) ||
                     (s === 'stake' && (step === 'staking' || step === 'success')) ||
                     (s === 'success' && step === 'success')) 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={step === 'approving' || step === 'staking'}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Network Indicator */}
          <div className="mb-4">
            <NetworkIndicator />
          </div>

          {renderStepContent()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
