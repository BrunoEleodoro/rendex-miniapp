"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRealTimeUpdates } from "~/hooks/useRealTimeUpdates"

interface ScreenProps {
  onNext?: () => void
}

interface User {
  id: string;
  email: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function AnalysisScreen({ onNext }: ScreenProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [_isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [kycProgress, setKycProgress] = useState('Initializing verification...')

  // Set up real-time updates for KYC status
  const { isConnected } = useRealTimeUpdates({
    userId: user?.id || '',
    onKYCUpdate: (update) => {
      console.log('[AnalysisScreen] Real-time KYC update received:', update);
      
      if (update.kycStatus && user) {
        const updatedUser = { ...user, kycStatus: update.kycStatus as any };
        setUser(updatedUser);
        localStorage.setItem('rendex_user', JSON.stringify(updatedUser));
        
        // Update progress message
        if (update.kycStatus === 'completed') {
          setKycProgress('Identity verification completed successfully! 🎉');
          // Proceed to ready screen after 2 seconds
          setTimeout(() => {
            if (onNext) {
              onNext();
            } else {
              router.push("/ready");
            }
          }, 2000);
        } else if (update.kycStatus === 'rejected') {
          setKycProgress('Identity verification was not approved. Please contact support.');
        }
      }
      
      if (update.message) {
        setKycProgress(update.message);
      }
    },
    autoReconnect: true
  });

  // Check KYC status when component mounts
  useEffect(() => {
    console.log('[AnalysisScreen] Checking user KYC status');
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[AnalysisScreen] Found user with KYC status:', userData.kycStatus);
        setUser(userData);
        
        // KYC paused - redirect directly to dashboard
        setKycProgress('KYC verification paused. Redirecting to dashboard...');
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
        
        setIsCheckingStatus(false);
      } catch (error) {
        console.error('[AnalysisScreen] Failed to parse saved user:', error);
        localStorage.removeItem('rendex_user');
        setIsCheckingStatus(false);
        router.push("/welcome");
      }
    } else {
      console.log('[AnalysisScreen] No user found, redirecting to welcome');
      router.push("/welcome");
    }
  }, [router, onNext]);
  
  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      router.push("/ready")
    }
  }
  return (
    <motion.div 
      className="min-h-screen w-full bg-light-blue flex flex-col justify-between items-center text-center p-8 bg-[url('/images/cloud-bg.png')] bg-cover bg-center"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-grow flex flex-col items-center justify-center pt-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <Image src="/images/flying-pig.png" alt="RendeX Mascot" width={200} height={200} className="mb-8" />
          </motion.div>
        </motion.div>
        <motion.h1 
          className="text-4xl font-serif text-gray-800 mb-2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {user?.kycStatus === 'completed' ? 'Verification Complete!' : 
           user?.kycStatus === 'in_progress' ? 'Identity Verification' : 
           user?.kycStatus === 'rejected' ? 'Verification Failed' : 
           'Checking Status'}
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {kycProgress}
        </motion.p>

        {/* Real-time connection indicator */}
        {user?.kycStatus === 'in_progress' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-4 flex items-center gap-2 text-sm text-gray-500"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Real-time updates connected' : 'Connecting...'}
          </motion.div>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 1,
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="mt-8"
        >
          <div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </div>
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
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
