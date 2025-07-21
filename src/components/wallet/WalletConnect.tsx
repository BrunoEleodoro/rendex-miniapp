"use client"

import { useState } from "react"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/input"
import { motion } from "framer-motion"
import { Wallet, ArrowRight } from "lucide-react"

interface WalletConnectProps {
  onWalletConnected: (result: {
    userId: string;
    subaccountId: string;
    kycStatus: string;
    isNewUser: boolean;
  }) => void;
}

export function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const [fullName, setFullName] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const connectWallet = async () => {
    console.log('[WalletConnect] Starting wallet connection...');
    
    try {
      // For demo purposes, we'll simulate wallet connection
      // In production, you'd use wagmi, web3modal, or similar
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        console.log('[WalletConnect] Requesting wallet connection...');
        
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          console.log('[WalletConnect] Wallet connected:', address);
          setWalletAddress(address);
          setShowNameInput(true);
          return;
        }
      }
      
      // Fallback for demo
      const demoAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
      console.log('[WalletConnect] Demo wallet address:', demoAddress);
      setWalletAddress(demoAddress);
      setShowNameInput(true);
      
    } catch (error) {
      console.error('[WalletConnect] Failed to connect wallet:', error);
    }
  };

  const handleConnectWithName = async () => {
    if (!fullName.trim() || !walletAddress) {
      console.warn('[WalletConnect] Missing full name or wallet address');
      return;
    }

    console.log('[WalletConnect] Connecting wallet with name:', fullName);
    setIsConnecting(true);

    try {
      // Create a signature message for authentication
      const message = `Welcome to RendeX! Sign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      let signature = '';
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          signature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [message, walletAddress],
          });
        }
      } catch (_signError) {
        console.warn('[WalletConnect] Signature failed, proceeding without signature for demo');
        signature = 'demo_signature';
      }

      console.log('[WalletConnect] Calling wallet connect API...');
      
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          fullName: fullName.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('[WalletConnect] Wallet connected successfully:', data);
        onWalletConnected({
          userId: data.userId,
          subaccountId: data.subaccountId,
          kycStatus: data.kycStatus,
          isNewUser: data.isNewUser
        });
      } else {
        console.error('[WalletConnect] Failed to connect wallet:', data.error);
      }
    } catch (error) {
      console.error('[WalletConnect] Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (showNameInput) {
    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm mb-4">
            <Wallet className="w-4 h-4 mr-2" />
            Wallet Connected
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
          </p>
        </div>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name (for subaccount creation)
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConnectWithName()}
            className="w-full"
          />
        </div>
        
        <Button
          onClick={handleConnectWithName}
          disabled={!fullName.trim() || isConnecting}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12"
        >
          {isConnecting ? (
            <>
              Creating Account...
              <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="w-full max-w-sm"
    >
      <Button
        onClick={connectWallet}
        className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
      >
        <Wallet className="mr-2 h-5 w-5" />
        Connect Wallet
      </Button>
    </motion.div>
  );
}