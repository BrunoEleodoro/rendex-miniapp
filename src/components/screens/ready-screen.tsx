"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"

interface ScreenProps {
  onNext: () => void
}

export function ReadyScreen({ onNext }: ScreenProps) {
  return (
    <div className="min-h-screen w-full bg-[#D6EDF8] flex flex-col justify-between items-center text-center">
      <div className="w-full flex-grow">
        <Image
          src="/images/lighthouse-bg.png"
          alt="Lighthouse illustration"
          width={375}
          height={550}
          className="object-cover w-full"
        />
      </div>
      <div className="bg-white w-full p-8 rounded-t-3xl -mt-20 z-10">
        <h1 className="text-4xl font-serif text-gray-800 mb-2">Your account is ready!</h1>
        <p className="text-gray-600 max-w-xs mx-auto mb-8">
          Now you have complete control over your account. It's time to improve yourself and earn money!
        </p>
        <Button
          onClick={onNext}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
        >
          Let's go
        </Button>
      </div>
    </div>
  )
}
