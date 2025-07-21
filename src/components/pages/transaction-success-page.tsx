"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SuccessModal } from "~/components/modals/success-modal";
import { useState, useEffect } from "react";

export function TransactionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(true);
  const [amount, setAmount] = useState("200,00");

  useEffect(() => {
    const amountParam = searchParams.get("amount");
    if (amountParam) {
      setAmount(amountParam);
    }
  }, [searchParams]);

  const handleClose = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <SuccessModal 
            amount={amount} 
            onClose={handleClose} 
          />
        </div>
      )}
    </div>
  );
}