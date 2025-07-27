"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { User, TrendingUp, Settings, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
// import { BalanceCard } from "~/components/avenia/BalanceCard"
import { PIXPaymentModal } from "~/components/avenia/PIXPaymentModal"
import { StakingModal } from "~/components/staking/StakingModal"
import { UnstakingModal } from "~/components/staking/UnstakingModal"
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

// interface Balances {
//   BRLA: string;
//   USDC: string;
//   USDT: string;
//   USDM: string;
// }

export function DashboardScreen({ onInvest, onWithdraw }: DashboardProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showPixModal, setShowPixModal] = useState(false)
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [farcasterProfile, setFarcasterProfile] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Removed balances state - now using direct blockchain hooks
  
  // Get connected wallet address
  const { address: connectedWalletAddress, isConnected: _isConnected } = useAccount()
  
  // Get stBRLA balance for circular progress display
  const { balance: stBrlaBalance, isLoading: stBrlaLoading, refetch: refetchStBRLA } = useStBRLABalance()
  
  // Get BRLA balance 
  const { balance: brlaBalance, isLoading: brlaLoading, refetch: refetchBRLA } = useBRLABalance()
  
  // Get APY data for display
  const { currentAPY, isLoading: apyLoading } = useStBRLAAPY()
  
  // Initialize the app and check user status
  useEffect(() => {
    const fetchFarcasterProfile = async (fid: string) => {
      try {
        console.log('[DashboardScreen] Fetching Farcaster profile for FID:', fid);
        const response = await fetch(`/api/users?fids=${fid}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.users && data.users.length > 0) {
          console.log('[DashboardScreen] Successfully fetched Farcaster profile:', data.users[0]);
          setFarcasterProfile(data.users[0]);
        } else {
          console.warn('[DashboardScreen] No profile data returned from API');
        }
      } catch (error) {
        console.error('[DashboardScreen] Failed to fetch Farcaster profile:', error);
      }
    };

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

    const loadUserData = async () => {
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
          
          // If this is a Farcaster user, fetch their profile data
          if (userData.id && userData.id.includes('farcaster_')) {
            const fid = userData.id.replace('farcaster_', '');
            await fetchFarcasterProfile(fid);
          }
        } catch (error) {
          console.error('[DashboardScreen] Failed to parse saved user:', error);
          localStorage.removeItem('rendex_user');
        }
      } else {
        console.log('[DashboardScreen] No user found');
      }
    };

    // Initialize everything at component mount
    initializeApp();
    loadUserData();
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

  const _formatBalance = (balance: string) => {
    const num = parseFloat(balance) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatBRLABalance = () => {
    if (brlaLoading) return 'Carregando...';
    if (!brlaBalance || brlaBalance === '0') return 'R$ 0,00';
    
    const num = parseFloat(brlaBalance) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatStBRLABalance = () => {
    if (stBrlaLoading) return 'Carregando...';
    if (!stBrlaBalance || stBrlaBalance === '0') return 'R$ 0,00';
    
    const num = parseFloat(stBrlaBalance) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const humanizeAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddressToClipboard = async () => {
    const address = connectedWalletAddress || user?.walletAddress;
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        console.log('[DashboardScreen] Wallet address copied to clipboard');
        // You could add a toast notification here
      } catch (error) {
        console.error('[DashboardScreen] Failed to copy address:', error);
      }
    }
  };

  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      console.log('[DashboardScreen] Refreshing all balances...');
      await Promise.all([
        refetchBRLA(),
        refetchStBRLA()
      ]);
      console.log('[DashboardScreen] All balances refreshed successfully');
    } catch (error) {
      console.error('[DashboardScreen] Failed to refresh balances:', error);
    } finally {
      setIsRefreshing(false);
    }
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
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyAddressToClipboard}
        >
          {user ? (
            <>
              {/* User Avatar */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {farcasterProfile?.pfp_url ? (
                  <img
                    src={farcasterProfile.pfp_url}
                    alt={`${farcasterProfile.display_name || farcasterProfile.username} avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/default-avatar.png';
                    }}
                  />
                ) : user.id && user.id.includes('farcaster_') ? (
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
                  {farcasterProfile?.display_name || farcasterProfile?.username || 'Carteira Conectada'}
                </div>
                <div className="text-xs text-white/80">
                  {connectedWalletAddress ? humanizeAddress(connectedWalletAddress) : 
                   user.walletAddress ? humanizeAddress(user.walletAddress) : 
                   `@${user.subaccountId || 'user'}`}
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
        
        {/* Right Side - Network Indicator, Refresh, and Settings */}
        <div className="flex items-center space-x-3">
          <NetworkIndicator />
          <motion.div 
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshBalances}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </motion.div>
          <motion.div 
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => console.log('[DashboardScreen] Settings clicked')}
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Balance Section */}
      <motion.div 
        className="px-4 mt-4"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h1 className="text-2xl font-light">Saldo BRLA (PIX): <b>{formatBRLABalance()}</b></h1>
        <p className="text-sm opacity-80">Tokens BRLA Disponíveis</p>
        
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
                {formatStBRLABalance()}
              </motion.div>
              <motion.div 
                className="text-green-500 font-semibold text-lg"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                {apyLoading ? 'Carregando...' : `+${currentAPY.toFixed(1)}% APY`}
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
                <span>0 dias Seguidos</span>
                <span className="ml-1">›</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>


      {/* Action Buttons */}
      <motion.div 
        className="px-4 mt-8 space-y-4 max-w-sm mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        {/* PIX Deposit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleInvest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-colors"
          >
            Depósito PIX
          </Button>
        </motion.div>

        {/* Stake BRLA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowStakingModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-colors"
          >
            🔒 Investir BRLA
          </Button>
        </motion.div>

        {/* Unstake stBRLA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowUnstakingModal(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-colors"
          >
            🔓 Resgatar stBRLA
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
            className="w-full bg-transparent border-2 border-white text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-white hover:text-gray-800 transition-colors"
          >
            Sacar
          </Button>
          {/* Soon Badge */}
          <motion.div 
            className="absolute -top-2 -right-2 bg-blue-400 text-white text-xs px-3 py-1 rounded-full font-semibold"
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.05, 1]
            }}
          >
            Em Breve
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Note: BalanceCard removed - now using direct blockchain hooks */}

      {/* PIX Payment Modal */}
      {showPixModal && user && (
        <PIXPaymentModal
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            refreshBalances();
          }}
          userId={user.subaccountId || user.id}
          walletAddress={connectedWalletAddress || user.walletAddress}
          onSuccess={() => {
            console.log('[DashboardScreen] PIX payment completed successfully');
            setShowPixModal(false);
            refreshBalances();
          }}
        />
      )}

      {/* Staking Modal */}
      <StakingModal
        isOpen={showStakingModal}
        onClose={() => {
          setShowStakingModal(false);
          refreshBalances();
        }}
      />

      {/* Unstaking Modal */}
      <UnstakingModal
        isOpen={showUnstakingModal}
        onClose={() => {
          setShowUnstakingModal(false);
          refreshBalances();
        }}
      />
    </motion.div>
  )
}
