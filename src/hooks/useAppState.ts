import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export interface AppState {
  userId?: string;
  kycStatus?: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  isAuthenticated?: boolean;
  currentStep?: number;
  transactionAmount?: string;
  transactionType?: 'invest' | 'withdraw' | 'pix-invest';
}

export function useAppState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current state from URL
  const getState = useCallback((): AppState => {
    return {
      userId: searchParams.get('userId') || undefined,
      kycStatus: (searchParams.get('kycStatus') as AppState['kycStatus']) || undefined,
      isAuthenticated: searchParams.get('auth') === 'true',
      currentStep: searchParams.get('step') ? parseInt(searchParams.get('step')!) : undefined,
      transactionAmount: searchParams.get('amount') || undefined,
      transactionType: (searchParams.get('type') as AppState['transactionType']) || undefined,
    };
  }, [searchParams]);

  // Update state in URL
  const updateState = useCallback((newState: Partial<AppState>, replace: boolean = false) => {
    const current = getState();
    const merged = { ...current, ...newState };
    
    // Clean up undefined values
    const cleanState = Object.fromEntries(
      Object.entries(merged).filter(([_, value]) => value !== undefined)
    );
    
    const params = new URLSearchParams(cleanState as Record<string, string>);
    const newUrl = `${pathname}?${params.toString()}`;
    
    if (replace) {
      router.replace(newUrl);
    } else {
      router.push(newUrl);
    }
  }, [getState, pathname, router]);

  // Navigate with state preservation
  const navigateWithState = useCallback((path: string, additionalState?: Partial<AppState>) => {
    const currentState = getState();
    const mergedState = { ...currentState, ...additionalState };
    
    // Clean up undefined values
    const cleanState = Object.fromEntries(
      Object.entries(mergedState).filter(([_, value]) => value !== undefined)
    );
    
    const params = new URLSearchParams(cleanState as Record<string, string>);
    const newUrl = params.toString() ? `${path}?${params.toString()}` : path;
    
    router.push(newUrl);
  }, [getState, router]);

  // Clear specific state parameters
  const clearState = useCallback((keys: (keyof AppState)[]) => {
    const current = getState();
    const cleaned = { ...current };
    
    keys.forEach(key => {
      delete cleaned[key];
    });
    
    updateState(cleaned, true);
  }, [getState, updateState]);

  return {
    state: getState(),
    updateState,
    navigateWithState,
    clearState,
  };
}

// Preset navigation functions for common flows
export function useAppNavigation() {
  const { navigateWithState, state } = useAppState();

  const startOnboarding = useCallback(() => {
    navigateWithState('/welcome', { currentStep: 1 });
  }, [navigateWithState]);

  const continueToAnalysis = useCallback(() => {
    navigateWithState('/analysis', { currentStep: 2 });
  }, [navigateWithState]);

  const continueToReady = useCallback(() => {
    navigateWithState('/ready', { currentStep: 3 });
  }, [navigateWithState]);

  const continueToNotifications = useCallback(() => {
    navigateWithState('/notifications', { currentStep: 4 });
  }, [navigateWithState]);

  const goToDashboard = useCallback((userId?: string) => {
    navigateWithState('/dashboard', { 
      currentStep: undefined,
      userId,
      isAuthenticated: true 
    });
  }, [navigateWithState]);

  const startInvestment = useCallback((amount?: string) => {
    navigateWithState('/invest', { 
      transactionType: 'invest',
      transactionAmount: amount 
    });
  }, [navigateWithState]);

  const startWithdrawal = useCallback((amount?: string) => {
    navigateWithState('/withdraw', { 
      transactionType: 'withdraw',
      transactionAmount: amount 
    });
  }, [navigateWithState]);

  const startPixInvestment = useCallback((amount?: string) => {
    navigateWithState('/pix-invest', { 
      transactionType: 'pix-invest',
      transactionAmount: amount 
    });
  }, [navigateWithState]);

  const showTransactionSuccess = useCallback((amount: string, type: AppState['transactionType']) => {
    navigateWithState('/transaction-success', { 
      transactionAmount: amount,
      transactionType: type 
    });
  }, [navigateWithState]);

  const connectAvenia = useCallback((userId?: string) => {
    navigateWithState('/avenia', { userId });
  }, [navigateWithState]);

  return {
    state,
    startOnboarding,
    continueToAnalysis,
    continueToReady,
    continueToNotifications,
    goToDashboard,
    startInvestment,
    startWithdrawal,
    startPixInvestment,
    showTransactionSuccess,
    connectAvenia,
  };
}