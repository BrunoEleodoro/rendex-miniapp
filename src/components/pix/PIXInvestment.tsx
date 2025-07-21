"use client"

import { useState } from "react"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/input"
import { Card } from "~/components/ui/card"
import { motion } from "framer-motion"
import { DollarSign, QrCode, ArrowRight, Loader2 } from "lucide-react"

interface PIXInvestmentProps {
  userId: string;
  onSuccess?: (result: any) => void;
}

interface _BeneficiaryWallet {
  id: string;
  alias: string;
  walletAddress: string;
  walletChain: string;
}

export function PIXInvestment({ userId, onSuccess }: PIXInvestmentProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [showPixCode, setShowPixCode] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  
  // External wallet transfer state
  const [sendToExternal, setSendToExternal] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletChain, setWalletChain] = useState('POLYGON')
  const [isTransferring, setIsTransferring] = useState(false)

  const handleCreatePIXPayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.warn('[PIXInvestment] Invalid amount provided');
      return;
    }

    console.log('[PIXInvestment] Creating PIX payment for amount:', amount);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/avenia/pix/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          outputAmount: Number(amount), // Amount in BRLA
          walletAddress: sendToExternal ? walletAddress : undefined // Send to wallet if external option enabled
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('[PIXInvestment] PIX payment created successfully:', data);
        setPixCode(data.brCode);
        setQuote(data.quote);
        setShowPixCode(true);
        
        if (onSuccess) {
          onSuccess(data);
        }

        // If sending to external wallet, initiate transfer after PIX payment
        if (sendToExternal && walletAddress && walletChain) {
          handleExternalTransfer(data.quote.outputAmount);
        }
      } else {
        console.error('[PIXInvestment] Failed to create PIX payment:', data.error);
      }
    } catch (error) {
      console.error('[PIXInvestment] Error creating PIX payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExternalTransfer = async (brlaAmount: number) => {
    console.log('[PIXInvestment] Starting external wallet transfer...');
    setIsTransferring(true);

    try {
      // For now, we'll just show a message. The actual implementation would be:
      // 1. Wait for PIX payment to be confirmed
      // 2. Create beneficiary wallet
      // 3. Transfer to external wallet
      
      console.log(`[PIXInvestment] Would transfer ${brlaAmount} BRLA to ${walletAddress} on ${walletChain}`);
      
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[PIXInvestment] External transfer simulation completed');
      
    } catch (error) {
      console.error('[PIXInvestment] External transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    console.log('[PIXInvestment] PIX code copied to clipboard');
  };

  if (showPixCode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-800">PIX Payment Ready!</h3>
              <p className="text-sm text-green-600 mt-1">
                Pay R$ {quote?.inputAmount} to receive {amount} BRLA
              </p>
            </div>

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">PIX Code:</p>
              <div className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">
                {pixCode}
              </div>
              <Button
                onClick={copyPixCode}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                Copy PIX Code
              </Button>
            </div>

            <div className="text-xs text-green-600 space-y-1">
              <p>• Open your bank app</p>
              <p>• Go to PIX → Pay with Code</p>
              <p>• Paste the code above</p>
              <p>• Confirm the payment</p>
            </div>

            <Button
              onClick={() => {
                setShowPixCode(false);
                setAmount('');
                setPixCode('');
                setQuote(null);
              }}
              variant="outline"
              className="w-full"
            >
              Create Another Payment
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">PIX to BRLA</h3>
            <p className="text-sm text-gray-600">
              Convert Brazilian Reais to BRLA stablecoin via PIX
            </p>
          </div>

                      <div className="space-y-3">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (BRLA)
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount in BRLA"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll pay in Brazilian Reais via PIX
                </p>
              </div>

              {/* External Wallet Option */}
              <div className="border-t pt-3">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="sendExternal"
                    checked={sendToExternal}
                    onChange={(e) => setSendToExternal(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="sendExternal" className="text-sm font-medium text-gray-700">
                    Send BRLA to external wallet
                  </label>
                </div>

                {sendToExternal && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Wallet Address
                      </label>
                      <Input
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Blockchain Network
                      </label>
                      <select
                        value={walletChain}
                        onChange={(e) => setWalletChain(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="POLYGON">Polygon</option>
                        <option value="ETHEREUM">Ethereum</option>
                        <option value="CELO">Celo</option>
                        <option value="GNOSIS">Gnosis</option>
                        <option value="MOONBEAM">Moonbeam</option>
                        <option value="TRON">Tron</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

            <Button
              onClick={handleCreatePIXPayment}
              disabled={
                !amount || 
                isProcessing || 
                isNaN(Number(amount)) || 
                Number(amount) <= 0 ||
                (sendToExternal && (!walletAddress || !walletChain))
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating PIX Payment...
                </>
              ) : isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring to External Wallet...
                </>
              ) : (
                <>
                  {sendToExternal ? 'Generate PIX & Send to Wallet' : 'Generate PIX Code'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <p>• PIX codes expire in 24 hours</p>
            <p>• {sendToExternal ? 'BRLA will be sent to your external wallet' : 'BRLA tokens will be credited to your account'}</p>
            <p>• Payment is processed instantly</p>
            {sendToExternal && (
              <p className="text-amber-600">• External transfer may take a few minutes</p>
            )}
          </div>
        </div>
      </Card>

      {/* QR Code Display */}
      {showPixCode && pixCode && (
        <Card className="w-full max-w-md mx-auto p-6 mt-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                PIX Code Generated!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan the QR code or copy the PIX code below to complete your payment
              </p>
            </div>

            {/* QR Code - You can integrate a QR code library here */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">Use your bank app</p>
                </div>
              </div>
            </div>

            {/* PIX Code Text */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  PIX Copia e Cola
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    value={pixCode}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md bg-gray-50 text-gray-900 font-mono"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(pixCode);
                      // You could add a toast notification here
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {quote && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">You&apos;ll pay:</span>
                      <span className="font-medium">R$ {parseFloat(quote.inputAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">You&apos;ll receive:</span>
                      <span className="font-medium">{parseFloat(quote.outputAmount).toFixed(2)} BRLA</span>
                    </div>
                                         {quote.appliedFees && quote.appliedFees.length > 0 && (
                       <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Fees:</span>
                         <span className="text-gray-500">
                           {quote.appliedFees.map((fee: any) => `${fee.amount} ${fee.currency}`).join(', ')}
                         </span>
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p>• Complete the payment within 24 hours</p>
              <p>• BRLA will be credited automatically after payment</p>
              <p>• Keep this page open until payment is confirmed</p>
            </div>

            <Button
              onClick={() => {
                setShowPixCode(false);
                setPixCode('');
                setAmount('');
                setQuote(null);
              }}
              variant="outline"
              className="w-full"
            >
              Create New Payment
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}