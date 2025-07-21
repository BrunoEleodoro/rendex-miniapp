"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { User, Flame, RefreshCw, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { BalanceCard } from "~/components/avenia/BalanceCard"

interface DashboardProps {
  onInvest?: () => void
  onWithdraw?: () => void
}

interface User {
  id: string;
  email: string;
  subaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function DashboardScreen({ onInvest, onWithdraw }: DashboardProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  
  // Check user status
  useEffect(() => {
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
        console.log('[DashboardScreen] Opening PIX investment flow (KYC bypassed)');
        router.push("/pix-invest")
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

  const handleCompleteKYC = () => {
    console.log('[DashboardScreen] Redirecting to complete KYC process');
    router.push("/welcome")
  }
  return (
    <motion.div 
      className="min-h-screen w-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="bg-dark-navy text-white p-4 pt-8 flex-shrink-0"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <motion.div 
          className="flex justify-between items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h1 className="font-serif text-xl tracking-widest">LOGO/MARCA</h1>
          <motion.div 
            className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="h-5 w-5 text-white/80" />
          </motion.div>
        </motion.div>
        <motion.div 
          className="mt-4 flex justify-between items-center"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div>
            <p className="text-sm text-white/60 font-serif">Balance</p>
            <p className="text-xs text-white/60 font-serif">Total</p>
          </div>
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
            <span className="text-sm">R$</span>
            <Image src="/images/brazil-flag.png" alt="Brazil Flag" width={20} height={20} />
          </div>
        </motion.div>
        <motion.div 
          className="text-center my-4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8, type: "spring", stiffness: 150 }}
        >
          <p className="text-6xl font-serif text-white/80 flex items-center justify-center gap-4">
            {user?.kycStatus === 'completed' ? (
              <span className="text-sm">See Real Balance Below</span>
            ) : (
              <>
                $200
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-6 w-6 text-white/30" />
                </motion.div>
              </>
            )}
          </p>
        </motion.div>
      </motion.div>
      <motion.div 
        className="flex-grow bg-light-blue rounded-t-[40px] -mt-8 p-6 flex flex-col justify-between items-center"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <motion.div 
          className="relative w-64 h-64 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.8, type: "spring", stiffness: 100 }}
        >
          {/* Base circle ring */}
          <div className="absolute inset-0 border-[8px] border-white/30 rounded-full" />
          
          {/* Continuous spinning rings to simulate earning */}
          <motion.div
            className="absolute inset-0 border-[8px] border-transparent border-t-success-green border-r-success-green/50 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute inset-3 border-[4px] border-transparent border-l-primary-blue border-b-primary-blue/60 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute inset-6 border-[2px] border-transparent border-r-success-green/40 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="bg-white w-52 h-52 rounded-full flex flex-col items-center justify-center text-center shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <motion.p 
              className="text-3xl font-bold text-primary-blue"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              R$200,10
            </motion.p>
            <motion.p 
              className="text-xl font-bold text-success-green"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 0.6 }}
            >
              +3,5%
            </motion.p>
            <motion.div 
              className="flex items-center text-sm text-gray-500 mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Flame className="h-4 w-4 text-orange-500 mr-1" />
              </motion.div>
              0 days Streak
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div 
          className="w-full space-y-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleInvest}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
            >
              PIX INVEST
            </Button>
          </motion.div>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleWithdraw}
              variant="outline"
              className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10 hover:text-primary-blue rounded-xl h-14 text-lg bg-transparent"
            >
              Withdraw
            </Button>
            <motion.div 
              className="absolute -top-2 -right-2 bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-md transform rotate-12"
              animate={{ 
                rotate: [12, 8, 12],
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

        {/* Wallet Connection Status - KYC paused */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="w-full mb-4"
        >
          <div className={`p-4 rounded-xl border-2 ${
            user ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className={`w-6 h-6 ${
                  user ? 'text-green-600' : 'text-blue-600'
                }`} />
                <div>
                  <h3 className={`font-semibold ${
                    user ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {user ? 'Wallet Connected' : 'Connect Wallet'}
                  </h3>
                  <p className={`text-sm ${
                    user ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {user ? 'Ready for PIX investments (KYC paused)' : 'Connect your wallet to get started'}
                  </p>
                </div>
              </div>
              <Button
                onClick={user ? () => console.log('Account settings') : handleCompleteKYC}
                size="sm"
                variant={user ? 'outline' : 'default'}
                className={user ? 'border-green-300 text-green-700 hover:bg-green-100' : ''}
              >
                {user ? 'Settings' : 'Connect'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Avenia Balance Card - Show for all connected users (KYC paused) */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
            className="w-full mb-4"
          >
            <BalanceCard
              userId={user.id}
              onPixPayment={() => router.push("/pix-invest")}
              onConvert={(currency) => {
                console.log(`[DashboardScreen] Starting ${currency} conversion`);
                // Could navigate to a conversion flow page
              }}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
        >
          <Button variant="link" className="text-gray-500">
            Save frame
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
