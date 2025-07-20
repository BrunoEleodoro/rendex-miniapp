"use client"

import Image from "next/image"
import { Button } from "~/components/ui/button"
import { User, Flame, RefreshCw } from "lucide-react"

interface DashboardProps {
  onInvest: () => void
  onWithdraw: () => void
}

export function DashboardScreen({ onInvest, onWithdraw }: DashboardProps) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="bg-dark-navy text-white p-4 pt-8 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="font-serif text-xl tracking-widest">LOGO/MARCA</h1>
          <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center">
            <User className="h-5 w-5 text-white/80" />
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-white/60 font-serif">Balance</p>
            <p className="text-xs text-white/60 font-serif">Total</p>
          </div>
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
            <span className="text-sm">R$</span>
            <Image src="/images/brazil-flag.png" alt="Brazil Flag" width={20} height={20} />
          </div>
        </div>
        <div className="text-center my-4">
          <p className="text-6xl font-serif text-white/80 flex items-center justify-center gap-4">
            $200
            <RefreshCw className="h-6 w-6 text-white/30" />
          </p>
        </div>
      </div>
      <div className="flex-grow bg-light-blue rounded-t-[40px] -mt-8 p-6 flex flex-col justify-between items-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 border-[16px] border-white/50 rounded-full" />
          <div
            className="absolute inset-0 border-[16px] border-transparent border-t-primary-blue rounded-full transform -rotate-45"
            style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)" }}
          />
          <div
            className="absolute inset-0 border-[16px] border-transparent border-b-primary-blue rounded-full transform rotate-[100deg]"
            style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
          />
          <div className="bg-white w-52 h-52 rounded-full flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-3xl font-bold text-primary-blue">R$200,10</p>
            <p className="text-xl font-bold text-success-green">+3,5%</p>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Flame className="h-4 w-4 text-orange-500 mr-1" />0 days Streak
            </div>
          </div>
        </div>
        <div className="w-full space-y-4">
          <Button
            onClick={onInvest}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            PIX INVEST
          </Button>
          <div className="relative">
            <Button
              onClick={onWithdraw}
              variant="outline"
              className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10 hover:text-primary-blue rounded-xl h-14 text-lg bg-transparent"
            >
              Withdraw
            </Button>
            <div className="absolute -top-2 -right-2 bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-md transform rotate-12">
              Soon
            </div>
          </div>
        </div>
        <Button variant="link" className="text-gray-500">
          Save frame
        </Button>
      </div>
    </div>
  )
}
