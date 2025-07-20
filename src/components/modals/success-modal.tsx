"use client"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface SuccessModalProps {
  amount: string
  onClose: () => void
}

export function SuccessModal({ amount, onClose }: SuccessModalProps) {
  return (
    <Card className="w-[340px] rounded-3xl text-center">
      <CardContent className="p-8 flex flex-col items-center">
        <CheckCircle2 className="h-20 w-20 text-success-green bg-green-100 rounded-full p-2 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Payment Success!</h2>
        <p className="text-4xl font-bold text-gray-800 mb-4">R${amount}</p>
        <p className="text-gray-500 text-sm">
          You may need to wait for the process to complete for the amount to be deposited in your account.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onClose}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg"
        >
          Done
        </Button>
      </CardFooter>
    </Card>
  )
}
