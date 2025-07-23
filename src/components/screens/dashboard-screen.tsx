"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { User, TrendingUp, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { BalanceCard } from "~/components/avenia/BalanceCard"
import { PIXPaymentModal } from "~/components/avenia/PIXPaymentModal"
import { StakingModal } from "~/components/staking/StakingModal"
import { NetworkIndicator } from "~/components/ui/NetworkIndicator"
import { sdk } from "@farcaster/miniapp-sdk"
import { useAccount } from "wagmi"
import { useStBRLABalance, useStBRLAAPY, useBRLABalance } from "~/lib/contracts"

interface DashboardProps {
  onInvest?: () => void
  onWithdraw?: () => void
}

interface User {
  id: string;
  email: string;
  subaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  walletAddress?: string;
}

interface Balances {
  BRLA: string;
  USDC: string;
  USDT: string;
  USDM: string;
}

export function DashboardScreen({ onInvest, onWithdraw }: DashboardProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showPixModal, setShowPixModal] = useState(false)
  const [showStakingModal, setShowStakingModal] = useState(false)
  // Removed balances state - now using direct blockchain hooks
  
  // Get connected wallet address
  const { address: connectedWalletAddress } = useAccount()
  
  // Get stBRLA balance for circular progress display
  const { balance: stBrlaBalance, isLoading: stBrlaLoading } = useStBRLABalance()
  
  // Get BRLA balance 
  const { balance: brlaBalance, isLoading: brlaLoading } = useBRLABalance()
  
  // Get APY data for display
  const { currentAPY, isLoading: apyLoading } = useStBRLAAPY()
  
  // Initialize the app and check user status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Call ready() to hide splash screen and indicate app is loaded
        await sdk.actions.ready();
        await sdk.actions.addFrame();
        await sdk.actions.addMiniApp();
        console.log('[DashboardScreen] App ready called successfully');
      } catch (error) {
        console.error('[DashboardScreen] Failed to call ready():', error);
      }
    };

    initializeApp();

    // Check user status
    console.log('[DashboardScreen] Checking user status');
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[DashboardScreen] Found user:', {
          id: userData.id,
          email: userData.email,
          kycStatus: userData.kycStatus
        });
        setUser(userData);
      } catch (error) {
        console.error('[DashboardScreen] Failed to parse saved user:', error);
        localStorage.removeItem('rendex_user');
      }
    } else {
      console.log('[DashboardScreen] No user found');
    }
  }, []);
  
  const handleInvest = () => {
    if (onInvest) {
      onInvest()
    } else {
      // KYC paused - allow investment for all users with wallet connected
      if (!user) {
        console.log('[DashboardScreen] No user found, redirecting to welcome to connect wallet');
        router.push("/welcome")
      } else {
        // Open PIX payment modal directly (KYC bypassed)
        console.log('[DashboardScreen] Opening PIX investment modal (KYC bypassed)');
        setShowPixModal(true)
      }
    }
  }
  
  const handleWithdraw = () => {
    if (onWithdraw) {
      onWithdraw()
    } else {
      // KYC paused - allow withdrawal for all users with wallet connected
      if (!user) {
        console.log('[DashboardScreen] No user found, redirecting to welcome to connect wallet');
        router.push("/welcome")
      } else {
        console.log('[DashboardScreen] Opening withdrawal flow (KYC bypassed)');
        router.push("/withdraw")
      }
    }
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatStakedBalance = () => {
    if (stBrlaLoading) return 'Loading...';
    if (!stBrlaBalance || stBrlaBalance === '0') return 'R$ 0,00';
    
    const num = parseFloat(stBrlaBalance) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  return (
    <motion.div 
      className="w-full bg-gradient-to-br from-blue-500 to-blue-600 min-h-screen text-white relative overflow-hidden bg-[url('/images/cloud-bg.png')] bg-cover bg-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center p-4 pt-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* User Info - Left Side */}
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
        >
          {user ? (
            <>
              {/* User Avatar */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                {user.id && user.id.includes('farcaster_') ? (
                  <span className="text-lg font-bold text-blue-500">
                    {user.id.replace('farcaster_', '').slice(-2)}
                  </span>
                ) : (
                  <User className="w-6 h-6 text-blue-500" />
                )}
              </div>
              {/* User Info */}
              <div>
                <div className="text-sm font-semibold text-white">
                  Connected Wallet
                </div>
                <div className="text-xs text-white/80">
                  @{user.subaccountId || 'user'}
                </div>
              </div>
            </>
          ) : (
            <motion.div 
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Settings Button - Right Side */}
        <motion.div 
          className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => console.log('[DashboardScreen] Settings clicked')}
        >
          <Settings className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>

      {/* Balance Section */}
      <motion.div 
        className="px-4 mt-4"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h1 className="text-2xl font-light">Staked Balance</h1>
        <p className="text-sm opacity-80">stBRLA Holdings</p>
        
        {/* Currency Toggle */}
        <div className="flex justify-end mt-2">
          <div className="bg-white bg-opacity-20 rounded-full p-1 flex items-center">
            <span className="text-xs px-2">R$</span>
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">$</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Balance Card */}
      <motion.div 
        className="px-4 mt-8 flex justify-center max-w-sm mx-auto"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <div className="relative">
          {/* Circular Background */}
          <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center relative">
            {/* Progress Rings with Animation */}
            <div className="absolute inset-4 border-4 border-blue-500 rounded-full opacity-20"></div>
            <motion.div 
              className="absolute inset-4 border-4 border-blue-500 rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-6 border-2 border-green-500 rounded-full border-r-transparent opacity-60"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Content */}
            <motion.div 
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <motion.div 
                className="text-3xl font-light text-blue-500 mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
              >
{formatStakedBalance()}
              </motion.div>
              <motion.div 
                className="text-green-500 font-semibold text-lg"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                {apyLoading ? 'Loading...' : `+${currentAPY.toFixed(1)}% APY`}
              </motion.div>
              
              {/* Streak */}
              <motion.div 
                className="flex items-center justify-center mt-4 text-gray-400 text-sm"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                <motion.div 
                  className="w-2 h-2 bg-orange-400 rounded-full mr-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>0 days Streak</span>
                <span className="ml-1">›</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Network Indicator */}
      <motion.div
        className="px-4 mt-6 max-w-sm mx-auto flex justify-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <NetworkIndicator />
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="px-4 mt-8 space-y-4 max-w-sm mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        {/* PIX Invest Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleInvest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-colors"
          >
            PIX INVEST
          </Button>
        </motion.div>

        {/* Stake BRLA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowStakingModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-colors"
          >
            🔒 Stake BRLA
          </Button>
        </motion.div>

        {/* Withdraw Button */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleWithdraw}
            className="w-full bg-white text-gray-800 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            Withdraw
          </Button>
          {/* Soon Badge */}
          <motion.div 
            className="absolute -top-2 -right-2 bg-blue-400 text-white text-xs px-3 py-1 rounded-full font-semibold"
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Soon
          </motion.div>
        </motion.div>
      </motion.div>


      {/* Decorative Elements with Animation */}
      <motion.div 
        className="absolute top-20 right-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"
        animate={{ 
          x: [0, 10, 0],
          y: [0, -5, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 left-4 w-16 h-16 bg-white bg-opacity-5 rounded-full"
        animate={{ 
          x: [0, -5, 0],
          y: [0, 5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Note: BalanceCard removed - now using direct blockchain hooks */}

      {/* PIX Payment Modal */}
      {showPixModal && user && (
        <PIXPaymentModal
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          userId={user.subaccountId || user.id}
          walletAddress={connectedWalletAddress || user.walletAddress}
          onSuccess={() => {
            console.log('[DashboardScreen] PIX payment completed successfully');
            setShowPixModal(false);
            // Refresh balances after successful payment
          }}
        />
      )}

      {/* Staking Modal */}
      <StakingModal
        isOpen={showStakingModal}
        onClose={() => setShowStakingModal(false)}
      />
    </motion.div>
  )
}