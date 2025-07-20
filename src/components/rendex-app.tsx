"use client"

import { useState } from "react"
import { WelcomeScreen } from "~/components/screens/welcome-screen"
import { AnalysisScreen } from "~/components/screens/analysis-screen"
import { ReadyScreen } from "~/components/screens/ready-screen"
import { NotificationsScreen } from "~/components/screens/notifications-screen"
import { DashboardScreen } from "~/components/screens/dashboard-screen"
import { InvestModal } from "~/components/modals/invest-modal"
import { TransactionModal } from "~/components/modals/transaction-modal"
import { SuccessModal } from "~/components/modals/success-modal"

type Screen = "welcome" | "analysis" | "ready" | "notifications" | "dashboard"
type Modal = "none" | "invest" | "withdraw" | "pix_invest" | "success"

export function RendexApp() {
  const [screen, setScreen] = useState<Screen>("welcome")
  const [modal, setModal] = useState<Modal>("none")
  const [transactionAmount, setTransactionAmount] = useState("200,00")

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen onNext={() => setScreen("analysis")} />
      case "analysis":
        return <AnalysisScreen onNext={() => setScreen("ready")} />
      case "ready":
        return <ReadyScreen onNext={() => setScreen("notifications")} />
      case "notifications":
        return <NotificationsScreen onNext={() => setScreen("dashboard")} />
      case "dashboard":
        return <DashboardScreen onInvest={() => setModal("invest")} onWithdraw={() => setModal("withdraw")} />
      default:
        return <WelcomeScreen onNext={() => setScreen("analysis")} />
    }
  }

  const handleTransaction = (amount: string) => {
    setTransactionAmount(amount)
    setModal("success")
  }

  const renderModal = () => {
    switch (modal) {
      case "invest":
        return <InvestModal onPixInvest={() => setModal("pix_invest")} onClose={() => setModal("none")} />
      case "withdraw":
        return <TransactionModal type="Withdraw" onNext={handleTransaction} onClose={() => setModal("none")} />
      case "pix_invest":
        return <TransactionModal type="Amount" onNext={handleTransaction} onClose={() => setModal("none")} />
      case "success":
        return <SuccessModal amount={transactionAmount} onClose={() => setModal("none")} />
      default:
        return null
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-white">
      {renderScreen()}
      {modal !== "none" && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">{renderModal()}</div>
      )}
    </div>
  )
}
