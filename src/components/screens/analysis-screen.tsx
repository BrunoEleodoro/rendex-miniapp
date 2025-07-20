"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

interface ScreenProps {
  onNext: () => void
}

export function AnalysisScreen({ onNext }: ScreenProps) {
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
          Account in Analysis
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Please wait a moment while we approve your account. With us, the sky's the limit for your money.
        </motion.p>
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
          onClick={onNext}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
