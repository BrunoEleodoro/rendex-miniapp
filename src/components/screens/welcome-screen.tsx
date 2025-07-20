"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { ArrowRight } from "lucide-react"

interface ScreenProps {
  onNext: () => void
}

export function WelcomeScreen({ onNext }: ScreenProps) {
  return (
    <div className="min-h-screen w-full bg-light-blue flex flex-col justify-between items-center text-center p-8 bg-[url('/images/cloud-bg.png')] bg-cover bg-center">
      <div className="flex-grow flex flex-col items-center justify-center pt-16">
        <Image
          src="/images/flying-pig.png"
          alt="RendeX Mascot - a flying pig"
          width={200}
          height={200}
          className="mb-8"
        />
        <h1 className="text-4xl font-serif text-gray-800 mb-2">Welcome to RendeX</h1>
        <p className="text-gray-600 max-w-xs">With the wind at your back, your earnings go beyond borders</p>
      </div>
      <Button
        onClick={onNext}
        className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
      >
        Get Started with the KYC
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )
}
