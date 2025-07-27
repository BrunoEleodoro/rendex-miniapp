'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/Button';
import { useAvenia } from '../../hooks/useAvenia';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import QRCode from 'qrcode';

interface PIXPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  walletAddress?: string; // Optional wallet address for external transfers
}

export const PIXPaymentModal = ({ isOpen, onClose, userId, onSuccess, walletAddress }: PIXPaymentModalProps) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [brCode, setBrCode] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  const [expiration, setExpiration] = useState('');
  const [realTimeMessage, setRealTimeMessage] = useState<string>('');
  
  const { createPixPayment, loading } = useAvenia();

  // Generate QR code when brCode changes
  useEffect(() => {
    if (brCode) {
      QRCode.toDataURL(brCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      }).then((dataURL) => {
        setQrCodeDataURL(dataURL);
      }).catch((err) => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [brCode]);

  // Set up real-time updates via SSE
  const { isConnected, connectionError } = useRealTimeUpdates({
    userId,
    onPaymentUpdate: (update) => {
      console.log(`[PIXPaymentModal] Real-time payment update received:`, update);
      
      if (update.message) {
        setRealTimeMessage(update.message);
        console.log(`[PIXPaymentModal] Real-time message: ${update.message}`);
      }
      
      // Handle payment completion
      if (update.type === 'payment_completed' && update.data?.ticketId === ticketId) {
        console.log(`[PIXPaymentModal] Payment completed via real-time update for ticket: ${ticketId}`);
        setStep('success');
        setError('');
      }
      
      // Handle payment failure
      if (update.type === 'payment_failed' && update.data?.ticketId === ticketId) {
        console.log(`[PIXPaymentModal] Payment failed via real-time update for ticket: ${ticketId}`);
        setError(`Payment failed: ${update.data.reason || 'Unknown error'}`);
      }
    },
    autoReconnect: true
  });

  const normalizeAmount = (value: string) => {
    // Remove any non-numeric characters except dots and commas
    let cleaned = value.replace(/[^\d.,]/g, '');
    
    // Replace comma with dot for decimal separator
    cleaned = cleaned.replace(/,/g, '.');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalized = normalizeAmount(value);
    setAmount(normalized);
  };

  const getNumericAmount = () => {
    const normalized = normalizeAmount(amount);
    return parseFloat(normalized) || 0;
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amountNum = getNumericAmount();
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    console.log(`[PIXPaymentModal] Creating PIX payment for user: ${userId}, amount: ${amountNum}, wallet: ${walletAddress || 'internal'}`);
    
    try {
      const payment = await createPixPayment(userId, amountNum, walletAddress);
      setBrCode(payment.brCode);
      setTicketId(payment.ticketId);
      setExpiration(payment.expiration);
      setStep('payment');
      
      console.log(`[PIXPaymentModal] PIX payment created - ticket: ${payment.ticketId}, wallet: ${walletAddress ? 'external' : 'internal'}, waiting for webhook completion via real-time updates`);
    } catch (err: any) {
      console.error(`[PIXPaymentModal] PIX payment creation failed:`, err.message);
      setError(err.message || 'Failed to create PIX payment');
    }
  };

  const copyBrCode = () => {
    navigator.clipboard.writeText(brCode);
    // You could add a toast notification here
  };

  const handleClose = () => {
    setStep('amount');
    setAmount('');
    setBrCode('');
    setQrCodeDataURL('');
    setTicketId('');
    setError('');
    setExpiration('');
    setRealTimeMessage('');
    onClose();
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? getNumericAmount() : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const displayAmount = getNumericAmount().toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'amount' && 'PIX to BRLA'}
              {step === 'payment' && 'Complete Payment'}
              {step === 'success' && 'Payment Successful'}
            </h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {realTimeMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {realTimeMessage}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
            </span>
          </div>

          {step === 'amount' && (
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label htmlFor="amount" className="text-base font-semibold mb-3 block text-gray-800">Amount (BRLA)</label>
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  required
                  className="text-black text-3xl font-bold py-6 px-4 text-center h-20 w-full border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
                />
                <p className="text-sm text-gray-600 mt-3 text-center">
                  You will receive {displayAmount} BRLA stablecoins
                </p>
              </div>

              <Button type="submit" disabled={loading || getNumericAmount() <= 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating Payment...' : `Create PIX Payment - ${formatCurrency(amount)}`}
              </Button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  {qrCodeDataURL ? (
                    <img 
                      src={qrCodeDataURL} 
                      alt="PIX QR Code" 
                      className="w-48 h-48 mx-auto rounded"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-300 mx-auto rounded flex items-center justify-center">
                      <span className="text-gray-600">Generating QR Code...</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Scan the QR code with your banking app or copy the PIX code below:
                </p>
                
                {walletAddress && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>BRLA will be transferred to:</strong><br />
                      <span className="font-mono text-xs break-all">{walletAddress}</span><br />
                      <span className="text-xs text-blue-600 mt-1 block">📍 POLYGON Network</span>
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded border text-xs break-all text-gray-900 font-mono">
                  {brCode}
                </div>
                
                <Button
                  onClick={copyBrCode}
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  Copy PIX Code
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Payment Details:</h4>
                <div className="text-sm space-y-1 text-blue-800">
                  <p>Amount: {formatCurrency(getNumericAmount())}</p>
                  <p>You&apos;ll receive: {displayAmount} BRLA</p>
                  <p>Expires: {new Date(expiration).toLocaleTimeString()}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Complete the payment and this page will update automatically via real-time webhooks.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-gray-600">
                You have successfully converted {formatCurrency(getNumericAmount())} to {displayAmount} BRLA stablecoins.
              </p>
              
              <Button onClick={() => { onSuccess(); handleClose(); }} className="w-full">
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
