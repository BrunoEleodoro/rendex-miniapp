"use client"

import { Button } from "~/components/ui/Button"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

interface SuccessModalProps {
  amount: string
  onClose: () => void
}

export function SuccessModal({ amount, onClose }: SuccessModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="w-[340px] rounded-3xl text-center">
        <CardContent className="p-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
            >
              <CheckCircle2 className="h-20 w-20 text-success-green bg-green-100 rounded-full p-2 mb-4" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-semibold mb-2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Payment Success!
          </motion.h2>
          
          <motion.p 
            className="text-4xl font-bold text-gray-800 mb-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 150 }}
          >
            <motion.span
              animate={{ 
                color: ["#1f2937", "#22c55e", "#1f2937"]
              }}
              transition={{ 
                duration: 1.5,
                repeat: 2,
                delay: 1
              }}
            >
              R${amount}
            </motion.span>
          </motion.p>
          
          <motion.p 
            className="text-gray-500 text-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            You may need to wait for the process to complete for the amount to be deposited in your account.
          </motion.p>
        </CardContent>
        <CardFooter>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              onClick={onClose}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg"
            >
              Done
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
