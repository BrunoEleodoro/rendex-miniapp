"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { motion } from "framer-motion"

interface TransactionModalProps {
  type: "Amount" | "Withdraw"
  onClose: () => void
  onNext: (amount: string) => void
}

export function TransactionModal({ type, onClose, onNext }: TransactionModalProps) {
  const [amount, setAmount] = useState("")

  const handleNext = () => {
    if (amount) {
      onNext(Number.parseFloat(amount).toFixed(2).replace(".", ","))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="w-[340px] rounded-3xl">
        <CardHeader>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="text-center text-2xl font-semibold">{type}</CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Input
              type="number"
              placeholder="Insert the amount"
              className="bg-gray-100 border-none rounded-xl h-12 text-center transition-all duration-200 focus:scale-105"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </motion.div>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Input 
              type="text" 
              placeholder="CPF" 
              className="bg-gray-100 border-none rounded-xl h-12 text-center transition-all duration-200 focus:scale-105" 
            />
          </motion.div>
        </CardContent>
        <CardFooter>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              onClick={handleNext}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg"
            >
              Next
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
