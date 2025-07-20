"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"

interface InvestModalProps {
  onClose: () => void
  onPixInvest: () => void
}

export function InvestModal({ onClose, onPixInvest }: InvestModalProps) {
  return (
    <Card className="w-[340px] rounded-3xl text-center overflow-hidden p-0 relative">
      <CardHeader className="p-0">
        <Image
          src="/images/coins-bg.png"
          alt="Falling coins"
          width={340}
          height={200}
          className="w-full object-cover"
        />
        <CardTitle className="text-4xl font-serif text-gray-800 absolute top-16 left-1/2 -translate-x-1/2">
          Invest Now!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pb-2">
        <p className="text-gray-600">
          Ready to unlock your earnings? Make your first investment to activate the features and start growing your
          money with ease and security.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col p-6 pt-2">
        <Button
          onClick={onPixInvest}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 text-lg mb-2"
        >
          PIX INVEST
        </Button>
      </CardFooter>
    </Card>
  )
}
