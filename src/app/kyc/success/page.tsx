'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';

export default function KYCSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const _searchParams = useSearchParams();

  useEffect(() => {
    // In a real implementation, you might want to verify the KYC status
    // For now, we'll just show success
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    // Close the window and notify parent
    if (window.opener) {
      window.opener.postMessage({ type: 'KYC_COMPLETED' }, '*');
      window.close();
    } else {
      // If not opened as popup, redirect to main app
      window.location.href = '/';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Processing Your Verification</h1>
          <p className="text-gray-600">
            Please wait while we verify your information...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold mb-2 text-red-600">Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            There was an issue with your verification. Please try again or contact support.
          </p>
          
          <Button onClick={handleContinue} className="w-full">
            Return to RendeX
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-green-600">Verification Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your identity has been verified successfully. You can now access all RendeX features including PIX payments and investments.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Make PIX deposits to get BRLA stablecoins</li>
            <li>• Convert BRLA to USDC/USDT</li>
            <li>• Access investment opportunities</li>
            <li>• Send funds to external wallets</li>
          </ul>
        </div>
        
        <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
          Continue to RendeX
        </Button>
        
        <p className="text-xs text-gray-500 mt-4">
          This window will close automatically
        </p>
      </div>
    </div>
  );
}