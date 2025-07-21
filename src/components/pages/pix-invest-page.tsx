"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PIXPaymentModal } from "~/components/avenia/PIXPaymentModal";

interface User {
  id: string;
  email: string;
  subaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function PixInvestPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check user status - KYC paused
  useEffect(() => {
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[PixInvestPage] Found user:', userData.id, '(KYC bypassed)');
        setUser(userData);
      } catch (error) {
        console.error('[PixInvestPage] Failed to parse saved user:', error);
        router.push("/welcome");
      }
    } else {
      console.log('[PixInvestPage] No user found, redirecting to welcome');
      router.push("/welcome");
    }
  }, [router]);

  const handlePaymentSuccess = () => {
    console.log('[PixInvestPage] PIX payment completed successfully');
    router.push("/transaction-success?type=pix-invest");
  };

  const handleClose = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {showModal && (
        <PIXPaymentModal
          isOpen={showModal}
          onClose={handleClose}
          userId={user.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}