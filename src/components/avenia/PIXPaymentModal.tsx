'use client';

import { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAvenia } from '../../hooks/useAvenia';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface PIXPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export const PIXPaymentModal = ({ isOpen, onClose, userId, onSuccess }: PIXPaymentModalProps) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [brCode, setBrCode] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  const [expiration, setExpiration] = useState('');
  const [realTimeMessage, setRealTimeMessage] = useState<string>('');
  
  const { createPixPayment, loading } = useAvenia();

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

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    console.log(`[PIXPaymentModal] Creating PIX payment for user: ${userId}, amount: ${amountNum}`);
    
    try {
      const payment = await createPixPayment(userId, amountNum);
      setBrCode(payment.brCode);
      setTicketId(payment.ticketId);
      setExpiration(payment.expiration);
      setStep('payment');
      
      console.log(`[PIXPaymentModal] PIX payment created - ticket: ${payment.ticketId}, waiting for webhook completion via real-time updates`);
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
    setTicketId('');
    setError('');
    setExpiration('');
    setRealTimeMessage('');
    onClose();
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
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

          {connectionError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              Real-time updates disconnected: {connectionError}
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
                <Label htmlFor="amount">Amount (BRLA)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  You will receive {amount || '0'} BRLA stablecoins
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating Payment...' : `Create PIX Payment - ${formatCurrency(amount)}`}
              </Button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  {/* QR Code would go here - you'd need a QR code library */}
                  <div className="w-48 h-48 bg-gray-300 mx-auto rounded flex items-center justify-center">
                    <span className="text-gray-600">QR Code</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Scan the QR code with your banking app or copy the PIX code below:
                </p>
                
                <div className="bg-gray-50 p-3 rounded border text-xs break-all">
                  {brCode}
                </div>
                
                <Button
                  onClick={copyBrCode}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Copy PIX Code
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Payment Details:</h4>
                <div className="text-sm space-y-1 text-blue-800">
                  <p>Amount: {formatCurrency(amount)}</p>
                  <p>You&apos;ll receive: {amount} BRLA</p>
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
                You have successfully converted {formatCurrency(amount)} to {amount} BRLA stablecoins.
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