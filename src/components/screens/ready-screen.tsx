"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { motion } from "framer-motion"

interface ScreenProps {
  onNext?: () => void
}

interface User {
  id: string;
  email: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function ReadyScreen({ onNext }: ScreenProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  // Check user status
  useEffect(() => {
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[ReadyScreen] Found user with KYC status:', userData.kycStatus);
        setUser(userData);
        
        // KYC paused - redirect to dashboard
        console.log('[ReadyScreen] KYC paused, redirecting to dashboard');
        router.push("/dashboard");
      } catch (error) {
        console.error('[ReadyScreen] Failed to parse saved user:', error);
        router.push("/welcome");
      }
    } else {
      console.log('[ReadyScreen] No user found, redirecting to welcome');
      router.push("/welcome");
    }
  }, [router]);
  
  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      router.push("/notifications")
    }
  }
  return (
    <motion.div 
      className="min-h-screen w-full bg-[#D6EDF8] flex flex-col justify-between items-center text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="w-full flex-grow"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <Image
          src="/images/lighthouse-bg.png"
          alt="Lighthouse illustration"
          width={375}
          height={550}
          className="object-cover w-full"
        />
      </motion.div>
      <motion.div 
        className="bg-white w-full p-8 rounded-t-3xl -mt-20 z-10"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <motion.h1 
          className="text-4xl font-serif text-gray-800 mb-2"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Identity Verified! 🎉
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs mx-auto mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Your Avenia account is verified and ready! You can now access PIX payments, investments, and all RendeX features.
        </motion.p>
        
        {user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="bg-green-100 border border-green-300 rounded-lg p-3 mb-6 max-w-xs mx-auto"
          >
            <p className="text-sm text-green-800">
              <strong>Account:</strong> {user.email}
            </p>
            <p className="text-sm text-green-800">
              <strong>Status:</strong> Verified ✓
            </p>
          </motion.div>
        )}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleNext}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            Let&apos;s go
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
