"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { motion } from "framer-motion"

interface ScreenProps {
  onNext: () => void
}

export function ReadyScreen({ onNext }: ScreenProps) {
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
          Your account is ready!
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs mx-auto mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Now you have complete control over your account. It's time to improve yourself and earn money!
        </motion.p>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onNext}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            Let's go
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
