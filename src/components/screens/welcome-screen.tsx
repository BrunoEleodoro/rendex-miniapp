"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"

import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { WalletConnect } from "~/components/wallet/WalletConnect"

interface ScreenProps {
  onNext?: () => void
}

interface User {
  id: string;
  email: string;
  walletAddress?: string;
  subaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function WelcomeScreen({ onNext }: ScreenProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    console.log('[WelcomeScreen] Checking for existing user session');
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[WelcomeScreen] Found existing user:', {
          id: userData.id,
          email: userData.email,
          subaccountId: userData.subaccountId,
          kycStatus: userData.kycStatus
        });
        setUser(userData);
        setIsWalletConnected(!!userData.subaccountId);
        
        // Go directly to dashboard regardless of KYC status (KYC paused)
        console.log('[WelcomeScreen] User exists, redirecting to dashboard (KYC paused)');
        router.push('/dashboard');
      } catch (error) {
        console.error('[WelcomeScreen] Failed to parse saved user:', error);
        localStorage.removeItem('rendex_user');
      }
    }
  }, [router]);

  const handleWalletConnected = (result: {
    userId: string;
    subaccountId: string;
    kycStatus: string;
    isNewUser: boolean;
  }) => {
    console.log('[WelcomeScreen] Wallet connected successfully:', result);
    
    // Create user session
    const newUser: User = {
      id: result.userId,
      email: 'wallet@rendex.app',
      subaccountId: result.subaccountId,
      kycStatus: result.kycStatus as 'not_started' | 'in_progress' | 'completed' | 'rejected'
    };
    
    setUser(newUser);
    setIsWalletConnected(true);
    localStorage.setItem('rendex_user', JSON.stringify(newUser));
    
    // Navigate directly to dashboard (KYC paused)
    console.log('[WelcomeScreen] Wallet connected, going directly to dashboard (KYC paused)');
    router.push('/dashboard');
  };

  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      // Navigate to dashboard if wallet is connected (KYC paused)
      if (user && user.subaccountId) {
        router.push('/dashboard');
      }
    }
  }
  return (
    <motion.div 
      className="min-h-screen w-full bg-light-blue flex flex-col justify-between items-center text-center p-8 bg-[url('/images/cloud-bg.png')] bg-cover bg-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-grow flex flex-col items-center justify-center pt-16">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
        >
          <Image
            src="/images/flying-pig.png"
            alt="RendeX Mascot - a flying pig"
            width={200}
            height={200}
            className="mb-8"
          />
        </motion.div>
        <motion.h1 
          className="text-4xl font-serif text-gray-800 mb-2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Welcome to RendeX
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs mb-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          With the wind at your back, your earnings go beyond borders
        </motion.p>

        {!isWalletConnected && !user && (
          <WalletConnect onWalletConnected={handleWalletConnected} />
        )}
      </div>
      {(isWalletConnected || user) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-full"
        >
          <Button
            onClick={handleNext}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            {user?.kycStatus === 'completed' ? (
              <>
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Start KYC Process
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
