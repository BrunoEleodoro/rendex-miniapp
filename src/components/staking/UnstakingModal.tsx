'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  useStBRLABalance, 
  useUnstakeBRLA,
  useStBRLAAPY,
  useEnsurePolygonNetwork
} from '../../lib/contracts';
import { NetworkIndicator } from '../ui/NetworkIndicator';

interface UnstakingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UnstakingStep = 'input' | 'unstaking' | 'success';

export const UnstakingModal = ({ isOpen, onClose }: UnstakingModalProps) => {
  const [step, setStep] = useState<UnstakingStep>('input');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Network management
  const { isOnPolygon, needsSwitch: _needsSwitch } = useEnsurePolygonNetwork();

  // Contract hooks
  const { balance: stBrlaBalance, balanceRaw: _stBrlaBalanceRaw } = useStBRLABalance();
  const { unstake, isLoading: _isUnstaking, hash: unstakeHash } = useUnstakeBRLA();
  
  // APY hook
  const { currentAPY, isLoading: apyLoading } = useStBRLAAPY();

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  // Handle successful unstaking
  useEffect(() => {
    if (unstakeHash && step === 'unstaking') {
      console.log('[UnstakingModal] Unstaking successful, hash:', unstakeHash);
      setStep('success');
    }
  }, [unstakeHash, step]);

  const validateAmount = (value: string) => {
    if (!value || parseFloat(value) <= 0) {
      setError('Por favor insira um valor válido');
      return false;
    }

    if (parseFloat(value) > parseFloat(stBrlaBalance || '0')) {
      setError(`Saldo stBRLA insuficiente. Máximo: ${stBrlaBalance}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError('');
    }
  };

  const handleMaxClick = () => {
    if (stBrlaBalance) {
      setAmount(stBrlaBalance);
      validateAmount(stBrlaBalance);
    }
  };

  const handleUnstake = async () => {
    if (!validateAmount(amount)) return;
    if (!isOnPolygon) return;

    try {
      setStep('unstaking');
      console.log('[UnstakingModal] Starting unstake process for amount:', amount);
      
      await unstake(amount);
      
    } catch (error) {
      console.error('[UnstakingModal] Unstaking failed:', error);
      setError('Unstaking falhou. Tente novamente.');
      setStep('input');
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Resgatar stBRLA</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Network Warning */}
          {!isOnPolygon && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Por favor mude para a rede Polygon para continuar</span>
              </div>
            </div>
          )}

          {/* Step Content */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Balance Display */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Seu Saldo stBRLA</div>
                <div className="text-xl font-bold text-blue-800">
                  {stBrlaBalance ? `${parseFloat(stBrlaBalance).toFixed(4)} stBRLA` : 'Carregando...'}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  APY Atual: {apyLoading ? 'Carregando...' : `${currentAPY.toFixed(2)}%`}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor para Resgatar
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border border-gray-300 rounded-xl text-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                {error && (
                  <div className="mt-2 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Unstake Button */}
              <Button
                onClick={handleUnstake}
                disabled={!amount || !isOnPolygon || !!error || !stBrlaBalance || parseFloat(stBrlaBalance) === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isOnPolygon ? 'Mudar para Polygon' : 
                 !stBrlaBalance || parseFloat(stBrlaBalance) === 0 ? 'Sem stBRLA para Resgatar' :
                 'Resgatar stBRLA'}
              </Button>

              {/* Network Indicator */}
              <div className="flex justify-center">
                <NetworkIndicator />
              </div>
            </div>
          )}

          {step === 'unstaking' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Resgatando stBRLA</h3>
              <p className="text-gray-600">
                Por favor confirme a transação em sua carteira e aguarde o processamento.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Valor do Resgate</div>
                <div className="text-lg font-bold text-gray-800">{amount} stBRLA</div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Resgate Realizado!</h3>
              <p className="text-gray-600">
                Seu stBRLA foi resgatado com sucesso e convertido de volta para BRLA.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Valor Resgatado</div>
                <div className="text-lg font-bold text-green-800">{amount} stBRLA</div>
              </div>
              <Button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg"
              >
                Pronto
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};