"use client"

import Image from "next/image"
import { Button } from "~/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { motion } from "framer-motion"

interface InvestModalProps {
  onClose: () => void
  onPixInvest: () => void
}

export function InvestModal({ onClose: _onClose, onPixInvest }: InvestModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
    >
      <Card className="w-[340px] rounded-3xl text-center overflow-hidden p-0 relative">
        <CardHeader className="p-0">
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Image
              src="/images/coins-bg.png"
              alt="Falling coins"
              width={340}
              height={200}
              className="w-full object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <CardTitle className="text-4xl font-serif text-gray-800 absolute top-16 left-1/2 -translate-x-1/2">
              Invista Agora!
            </CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="p-6 pb-2">
          <motion.p 
            className="text-gray-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Pronto para desbloquear seus ganhos? Faça seu primeiro investimento para ativar as funcionalidades e começar a fazer seu dinheiro crescer com facilidade e segurança.
          </motion.p>
        </CardContent>
        <CardFooter className="flex flex-col p-6 pt-2">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              onClick={onPixInvest}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg mb-2"
            >
              INVESTIR VIA PIX
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
