'use client';

import { useCallback, useState } from 'react';
import { SignIn as SignInCore } from '@farcaster/miniapp-sdk';
import { useQuickAuth } from '~/hooks/useQuickAuth';
import { Button } from '~/components/ui/Button';

/**
 * Clean FarcasterSignIn component for the welcome screen.
 * 
 * This component provides Farcaster authentication without showing debug information.
 * It's specifically designed for the welcome page user experience.
 */

interface AuthState {
  signingIn: boolean;
}

export function FarcasterSignIn() {
  // --- State ---
  const [authState, setAuthState] = useState<AuthState>({
    signingIn: false,
  });
  const [signInFailure, setSignInFailure] = useState<string>();

  // --- Hooks ---
  const { status, signIn } = useQuickAuth();

  // --- Handlers ---
  /**
   * Handles the sign-in process using QuickAuth.
   */
  const handleSignIn = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, signingIn: true }));
      setSignInFailure(undefined);

      const success = await signIn();

      if (!success) {
        setSignInFailure('Authentication failed');
      }
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure('Authentication was cancelled');
        return;
      }
      setSignInFailure('Unable to authenticate');
    } finally {
      setAuthState(prev => ({ ...prev, signingIn: false }));
    }
  }, [signIn]);

  // --- Render ---
  if (status === 'authenticated') {
    return null; // Don't render anything if already authenticated
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleSignIn} 
        disabled={authState.signingIn || status === 'loading'}
        className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 font-medium"
      >
        {authState.signingIn || status === 'loading' ? (
          <>
            Signing in...
            <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </>
        ) : (
          'Sign in with Farcaster'
        )}
      </Button>

      {/* Error Display */}
      {signInFailure && !authState.signingIn && (
        <div className="text-center">
          <p className="text-sm text-red-600">
            {signInFailure}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please try again
          </p>
        </div>
      )}
    </div>
  );
}