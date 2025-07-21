"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvestModal } from "~/components/modals/invest-modal";

export function InvestPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handlePixInvest = () => {
    router.push("/pix-invest");
  };

  const handleClose = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <InvestModal 
            onPixInvest={handlePixInvest} 
            onClose={handleClose} 
          />
        </div>
      )}
    </div>
  );
}