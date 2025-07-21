"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TransactionModal } from "~/components/modals/transaction-modal";

export function WithdrawPage() {
  const router = useRouter();
  const _searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(true);

  const handleTransaction = (amount: string) => {
    router.push(`/transaction-success?amount=${encodeURIComponent(amount)}&type=withdraw`);
  };

  const handleClose = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <TransactionModal 
            type="Withdraw" 
            onNext={handleTransaction} 
            onClose={handleClose} 
          />
        </div>
      )}
    </div>
  );
}