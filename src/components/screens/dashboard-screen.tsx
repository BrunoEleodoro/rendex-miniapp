"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { User, Flame, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface DashboardProps {
  onInvest: () => void
  onWithdraw: () => void
}

export function DashboardScreen({ onInvest, onWithdraw }: DashboardProps) {
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
            $200
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-6 w-6 text-white/30" />
            </motion.div>
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
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, duration: 1, type: "spring", stiffness: 100 }}
        >
          <div className="absolute inset-0 border-[16px] border-white/50 rounded-full" />
          <motion.div
            className="absolute inset-0 border-[16px] border-transparent border-t-primary-blue rounded-full transform -rotate-45"
            style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)" }}
            initial={{ rotate: -45 }}
            animate={{ rotate: 55 }}
            transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 border-[16px] border-transparent border-b-primary-blue rounded-full transform rotate-[100deg]"
            style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
            initial={{ rotate: 100 }}
            animate={{ rotate: 200 }}
            transition={{ delay: 1.4, duration: 1.5, ease: "easeOut" }}
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
              onClick={onInvest}
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
              onClick={onWithdraw}
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
