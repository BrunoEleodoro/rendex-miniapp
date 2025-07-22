"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/Button"

import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useMiniApp } from "@neynar/react"
import { useQuickAuth } from "~/hooks/useQuickAuth"
import { useAccount } from "wagmi"
import { FarcasterSignIn } from "~/components/welcome/FarcasterSignIn"
import { WalletConnect } from "~/components/wallet/WalletConnect"

interface ScreenProps {
  onNext?: () => void
}

interface User {
  id: string;
  email: string;
  walletAddress?: string;
  subaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}

export function WelcomeScreen({ onNext }: ScreenProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [_isConnecting, _setIsConnecting] = useState(false)
  const [neynarUser, setNeynarUser] = useState<any>(null)
  const [fetchingUser, setFetchingUser] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)

  // Farcaster integration
  const { isSDKLoaded, context } = useMiniApp()
  const { authenticatedUser, status: authStatus } = useQuickAuth()
  
  // Wagmi wallet connection
  const { address: connectedWalletAddress, isConnected: _wagmiConnected } = useAccount()

  // Fetch Neynar user data when we have an authenticated user
  useEffect(() => {
    if (authStatus === 'authenticated' && authenticatedUser && !neynarUser && !fetchingUser) {
      const fetchNeynarUser = async () => {
        setFetchingUser(true);
        try {
          console.log('[WelcomeScreen] Fetching Neynar user data for FID:', authenticatedUser.fid);
          const response = await fetch(`/api/users?fids=${authenticatedUser.fid}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.users && data.users.length > 0) {
            console.log('[WelcomeScreen] Successfully fetched Neynar user data:', data.users[0]);
            setNeynarUser(data.users[0]);
          } else {
            console.warn('[WelcomeScreen] No user data returned from API');
          }
        } catch (error) {
          console.error('[WelcomeScreen] Failed to fetch Neynar user:', error);
          // Continue without Neynar data - we can still create an account with just FID
        } finally {
          setFetchingUser(false);
        }
      };

      fetchNeynarUser();
    }
  }, [authStatus, authenticatedUser, neynarUser, fetchingUser]);

  // Check if user is already logged in or if Farcaster user is available
  useEffect(() => {
    console.log('[WelcomeScreen] Checking authentication state:', {
      isSDKLoaded,
      hasContext: !!context,
      authStatus,
      hasAuthenticatedUser: !!authenticatedUser,
      hasFarcasterUser: !!neynarUser,
      fid: authenticatedUser?.fid || context?.user?.fid
    });

    // Check if we already have an existing session for this Farcaster user
    if (isSDKLoaded && authStatus === 'authenticated' && authenticatedUser && !fetchingUser) {
      console.log('[WelcomeScreen] Farcaster user authenticated:', {
        fid: authenticatedUser.fid,
        username: neynarUser?.username,
        displayName: neynarUser?.display_name,
        hasNeynarData: !!neynarUser
      });

      // Check if we already have a session for this username
      const savedUser = localStorage.getItem('rendex_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          const currentUsername = neynarUser?.username || `user${authenticatedUser.fid}`;
          // If the saved user matches this username, auto-authenticate
          if (userData.subaccountId === currentUsername) {
            console.log('[WelcomeScreen] Found existing session for username, auto-authenticating');
            setUser(userData);
            setIsWalletConnected(true);
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          console.error('[WelcomeScreen] Failed to parse saved user:', error);
          localStorage.removeItem('rendex_user');
        }
      }
      
      // If no existing session, show the account form only after we've finished fetching user data
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setShowAccountForm(true);
      }, 500);
      return;
    }
    
    // Fallback to checking for existing local user session
    const savedUser = localStorage.getItem('rendex_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('[WelcomeScreen] Found existing user:', {
          id: userData.id,
          email: userData.email,
          subaccountId: userData.subaccountId,
          kycStatus: userData.kycStatus
        });
        setUser(userData);
        setIsWalletConnected(!!userData.subaccountId);
        
        // Go directly to dashboard regardless of KYC status (KYC paused)
        console.log('[WelcomeScreen] User exists, redirecting to dashboard (KYC paused)');
        router.push('/dashboard');
      } catch (error) {
        console.error('[WelcomeScreen] Failed to parse saved user:', error);
        localStorage.removeItem('rendex_user');
      }
    }
  }, [router, isSDKLoaded, context, neynarUser, authStatus, authenticatedUser, fetchingUser]);

  const handleCreateAccount = async () => {
    if (!authenticatedUser) return;
    
    setIsCreatingAccount(true);
    
    try {
      console.log('[WelcomeScreen] Creating account for Farcaster user with connected wallet:', connectedWalletAddress);
      
      // Create user with available data (Neynar data might not be available)
      const username = neynarUser?.username || `user${authenticatedUser.fid}`;
      const displayName = neynarUser?.display_name || neynarUser?.displayName || username;
      // Use connected wallet address from Wagmi instead of Neynar
      const walletAddress = connectedWalletAddress;
      
      const farcasterUser: User = {
        id: `farcaster_${authenticatedUser.fid}`,
        email: `${username}@farcaster.xyz`,
        walletAddress: walletAddress,
        subaccountId: username, // Use username as subaccount ID
        kycStatus: 'not_started'
      };
      
      setUser(farcasterUser);
      setIsWalletConnected(true);
      localStorage.setItem('rendex_user', JSON.stringify(farcasterUser));
      
      // Call the backend to sync the user data
      await fetch('/api/farcaster/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: authenticatedUser.fid,
          username: username,
          displayName: displayName,
          walletAddress: walletAddress,
          pfpUrl: neynarUser?.pfp_url
        })
      }).catch(error => {
        console.warn('[WelcomeScreen] Backend sync failed (continuing anyway):', error);
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('[WelcomeScreen] Failed to create account:', error);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleWalletConnected = (result: {
    userId: string;
    subaccountId: string;
    kycStatus: string;
    isNewUser: boolean;
  }) => {
    console.log('[WelcomeScreen] Wallet connected successfully:', result);
    
    // Create user session
    const newUser: User = {
      id: result.userId,
      email: 'wallet@rendex.app',
      subaccountId: result.subaccountId,
      kycStatus: result.kycStatus as 'not_started' | 'in_progress' | 'completed' | 'rejected'
    };
    
    setUser(newUser);
    setIsWalletConnected(true);
    localStorage.setItem('rendex_user', JSON.stringify(newUser));
    
    // Navigate directly to dashboard (KYC paused)
    console.log('[WelcomeScreen] Wallet connected, going directly to dashboard (KYC paused)');
    router.push('/dashboard');
  };

  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      // Navigate to dashboard if wallet is connected (KYC paused)
      if (user && user.subaccountId) {
        router.push('/dashboard');
      }
    }
  }
  return (
    <motion.div 
      className="min-h-screen w-full bg-light-blue flex flex-col justify-between items-center text-center p-8 bg-[url('/images/cloud-bg.png')] bg-cover bg-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-grow flex flex-col items-center justify-center pt-16">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
        >
          <Image
            src="/images/flying-pig.png"
            alt="RendeX Mascot - a flying pig"
            width={200}
            height={200}
            className="mb-8"
          />
        </motion.div>
        <motion.h1 
          className="text-4xl font-serif text-gray-800 mb-2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Welcome to RendeX
        </motion.h1>
        <motion.p 
          className="text-gray-600 max-w-xs mb-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          With the wind at your back, your earnings go beyond borders
        </motion.p>

        {!isWalletConnected && !user && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="w-full max-w-sm space-y-4"
          >
            {/* Show loading if Farcaster SDK is still loading */}
            {!isSDKLoaded ? (
              <div className="text-center">
                <div className="spinner h-6 w-6 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading authentication...</p>
              </div>
            ) : (
              <>
                {/* Show Farcaster sign-in if SDK is loaded and we're in a Farcaster context */}
                {context ? (
                  <div className="space-y-4">
                    {/* Show simple create account button if authenticated and ready */}
                    {authStatus === 'authenticated' && authenticatedUser && showAccountForm ? (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          onClick={handleCreateAccount}
                          disabled={isCreatingAccount}
                          className="w-full bg-white/90 hover:bg-white text-gray-800 rounded-2xl h-16 px-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
                        >
                          <div className="flex items-center justify-between w-full">
                            {/* Left side - Avatar */}
                            <div className="flex items-center space-x-3">
                              {neynarUser?.pfp_url ? (
                                <img
                                  src={neynarUser.pfp_url}
                                  alt={`${neynarUser.display_name || neynarUser.displayName || neynarUser.username} avatar`}
                                  className="w-12 h-12 rounded-full ring-2 ring-primary-blue/20"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/default-avatar.png';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary-blue/20 flex items-center justify-center">
                                  <span className="text-lg font-bold text-primary-blue">
                                    {authenticatedUser.fid.toString().slice(-2)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Center - Label and username */}
                              <div className="text-left">
                                <div className="font-semibold text-gray-800">
                                  {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  @{neynarUser?.username || `user${authenticatedUser.fid}`}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Icon */}
                            <div className="flex items-center">
                              {isCreatingAccount ? (
                                <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ArrowRight className="h-5 w-5 text-primary-blue" />
                              )}
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    ) : authStatus === 'authenticated' && authenticatedUser && (fetchingUser || !showAccountForm) ? (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
                      >
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-primary-blue/20 flex items-center justify-center">
                              <span className="text-2xl font-bold text-primary-blue">
                                {authenticatedUser.fid.toString().slice(-2)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Welcome!
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">FID: {authenticatedUser.fid}</p>
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600">
                              {fetchingUser ? 'Loading your profile...' : 'Preparing your account...'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-4">
                            Connect your Farcaster wallet to get started
                          </p>
                        </div>
                        <FarcasterSignIn />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback to traditional wallet connect */
                  <WalletConnect onWalletConnected={handleWalletConnected} />
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
      {(isWalletConnected || user) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-full"
        >
          <Button
            onClick={handleNext}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-14 text-lg"
          >
            {user?.kycStatus === 'completed' ? (
              <>
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Start KYC Process
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
