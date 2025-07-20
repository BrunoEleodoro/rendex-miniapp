"use client"

import { Button } from "~/components/ui/button"

interface ScreenProps {
  onNext: () => void
}

export function NotificationsScreen({ onNext }: ScreenProps) {
  return (
    <div className="min-h-screen w-full bg-light-blue flex flex-col justify-center items-center text-center p-8">
      <div className="max-w-xs">
        <h1 className="text-4xl font-serif text-gray-800 mb-4">Keep up with your account</h1>
        <p className="text-gray-600 mb-12">
          Turn on notifications to track your account activity, plus find out about new features and rewards.
        </p>
        <div className="space-y-4">
          <Button
            onClick={onNext}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            Turn on notifications
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10 hover:text-primary-blue rounded-xl h-14 text-lg bg-transparent"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  )
}
