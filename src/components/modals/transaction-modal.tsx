"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"

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
    <Card className="w-[340px] rounded-3xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold">{type}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="number"
          placeholder="Insert the amount"
          className="bg-gray-100 border-none rounded-xl h-12 text-center"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input type="text" placeholder="CPF" className="bg-gray-100 border-none rounded-xl h-12 text-center" />
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleNext}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg"
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  )
}
