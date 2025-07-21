"use client"

import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"
import { motion } from "framer-motion"
import { Bell } from "lucide-react"

interface ScreenProps {
  onNext?: () => void
}

export function NotificationsScreen({ onNext }: ScreenProps = {}) {
  const router = useRouter()
  
  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      router.push("/dashboard")
    }
  }
  return (
    <motion.div 
      className="min-h-screen w-full bg-light-blue flex flex-col justify-center items-center text-center p-8"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="max-w-xs"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="bg-primary-blue/10 p-6 rounded-full"
          >
            <Bell className="h-12 w-12 text-primary-blue" />
          </motion.div>
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-serif text-gray-800 mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Keep up with your account
        </motion.h1>
        <motion.p 
          className="text-gray-600 mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Turn on notifications to track your account activity, plus find out about new features and rewards.
        </motion.p>
        <motion.div 
          className="space-y-4"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleNext}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
            >
              Turn on notifications
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleNext}
              variant="outline"
              className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10 hover:text-primary-blue rounded-xl h-14 text-lg bg-transparent"
            >
              Maybe later
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
