'use client';

import { useState, useEffect } from 'react';
import { AveniaLoginModal } from './AveniaLoginModal';
import { KYCFlow } from './KYCFlow';
import { PIXPaymentModal } from './PIXPaymentModal';
import { BalanceCard } from './BalanceCard';
import { Button } from '../ui/Button';

interface User {
  id: string;
  email: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  farcasterFid?: string;
  walletAddress?: string;
}

export const AveniaIntegration = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [_selectedConversion, setSelectedConversion] = useState<'USDC' | 'USDT' | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    console.log('[AveniaIntegration] Component mounted, checking for saved user');
    const savedUser = localStorage.getItem('avenia_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[AveniaIntegration] Found saved user:', {
          id: userData.id,
          email: userData.email,
          kycStatus: userData.kycStatus
        });
        setUser(userData);
      } catch (error) {
        console.error('[AveniaIntegration] Failed to parse saved user:', error);
        localStorage.removeItem('avenia_user');
      }
    } else {
      console.log('[AveniaIntegration] No saved user found');
    }
  }, []);

  const handleLoginSuccess = (userData: User) => {
    console.log('[AveniaIntegration] Login successful, saving user data:', {
      id: userData.id,
      email: userData.email,
      kycStatus: userData.kycStatus
    });
    setUser(userData);
    localStorage.setItem('avenia_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('[AveniaIntegration] User logout initiated');
    if (user) {
      console.log('[AveniaIntegration] Logging out user:', user.email);
    }
    setUser(null);
    localStorage.removeItem('avenia_user');
    console.log('[AveniaIntegration] User data cleared from localStorage');
  };

  const handleKYCComplete = () => {
    if (user) {
      console.log('[AveniaIntegration] KYC completed for user:', user.id);
      const updatedUser = { ...user, kycStatus: 'completed' as const };
      setUser(updatedUser);
      localStorage.setItem('avenia_user', JSON.stringify(updatedUser));
      console.log('[AveniaIntegration] User KYC status updated to completed');
    } else {
      console.warn('[AveniaIntegration] KYC completion called but no user found');
    }
  };

  const handlePixPaymentSuccess = () => {
    console.log('[AveniaIntegration] PIX payment completed successfully for user:', user?.id);
    // Refresh user data or balances
    // In a real implementation, you might refresh balances here
  };

  const handleConversion = (currency: 'USDC' | 'USDT') => {
    console.log(`[AveniaIntegration] Conversion requested: BRLA to ${currency} for user:`, user?.id);
    setSelectedConversion(currency);
    // In a real implementation, you would open a conversion modal here
    console.log(`[AveniaIntegration] Starting BRLA to ${currency} conversion flow`);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🏦</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to RendeX Financial Services
          </h2>
          
          <p className="text-gray-600">
            Connect your Avenia account to access PIX payments, stablecoin conversions, 
            and investment features.
          </p>
          
          <Button 
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Connect Avenia Account
          </Button>
        </div>

        <AveniaLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  if (user.kycStatus !== 'completed') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Account Setup</h2>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            Logout
          </Button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Logged in as:</strong> {user.email}
          </p>
        </div>

        <KYCFlow
          userId={user.id}
          onKYCComplete={handleKYCComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">RendeX Wallet</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
        >
          Logout
        </Button>
      </div>

      {/* KYC Status Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">
            Account Verified
          </span>
        </div>
      </div>

      {/* Balance Card */}
      <BalanceCard
        userId={user.id}
        onPixPayment={() => setShowPixModal(true)}
        onConvert={handleConversion}
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowPixModal(true)}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <span className="text-2xl mb-1">💳</span>
            <span className="text-sm">Add Money</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => console.log('Invest feature coming soon')}
          >
            <span className="text-2xl mb-1">📈</span>
            <span className="text-sm">Invest</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <p className="text-sm text-gray-600 text-center py-4">
          Your recent transactions will appear here
        </p>
      </div>

      {/* Modals */}
      <PIXPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        userId={user.id}
        onSuccess={handlePixPaymentSuccess}
      />
    </div>
  );
};