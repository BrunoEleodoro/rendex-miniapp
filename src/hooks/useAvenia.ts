import { useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  farcasterFid?: string;
  walletAddress?: string;
}

interface AveniaBalances {
  BRLA: string;
  USDC: string;
  USDT: string;
  USDM: string;
}

interface PixPayment {
  ticketId: string;
  brCode: string;
  expiration: string;
}

export const useAvenia = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<AveniaBalances | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    console.log(`[useAvenia] Starting login process for: ${email}`);
    setLoading(true);
    
    try {
      console.log(`[useAvenia] Sending login request to API for: ${email}`);
      const response = await fetch('/api/avenia/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(`[useAvenia] Login API response:`, { success: data.success, message: data.message });
      
      if (!response.ok) {
        console.error(`[useAvenia] Login failed with status ${response.status}:`, data.error);
        throw new Error(data.error || 'Login failed');
      }

      console.log(`[useAvenia] Login successful for: ${email}, email token sent`);
      return data;
    } catch (error: any) {
      console.error(`[useAvenia] Login error for ${email}:`, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateLogin = useCallback(async (email: string, emailToken: string) => {
    console.log(`[useAvenia] Starting login validation for: ${email} with token: ${emailToken}`);
    setLoading(true);
    
    try {
      console.log(`[useAvenia] Sending validation request to API for: ${email}`);
      const response = await fetch('/api/avenia/auth/validate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, emailToken }),
      });

      const data = await response.json();
      console.log(`[useAvenia] Validation API response:`, { 
        success: data.success, 
        userId: data.user?.id,
        kycStatus: data.user?.kycStatus 
      });
      
      if (!response.ok) {
        console.error(`[useAvenia] Validation failed with status ${response.status}:`, data.error);
        throw new Error(data.error || 'Login validation failed');
      }

      console.log(`[useAvenia] Login validation successful for user: ${data.user.id} (${email})`);
      console.log(`[useAvenia] User KYC status: ${data.user.kycStatus}`);
      
      setUser(data.user);
      return data.user;
    } catch (error: any) {
      console.error(`[useAvenia] Validation error for ${email}:`, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateKYC = useCallback(async (userId: string, subaccountId?: string) => {
    console.log(`[useAvenia] Initiating KYC for user: ${userId}${subaccountId ? ` (subaccount: ${subaccountId})` : ''}`);
    setLoading(true);
    
    try {
      console.log(`[useAvenia] Sending KYC initiation request to API for user: ${userId}`);
      const response = await fetch('/api/avenia/kyc/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subaccountId }),
      });

      const data = await response.json();
      console.log(`[useAvenia] KYC initiation API response:`, { 
        success: data.success, 
        hasUrl: !!data.kycUrl,
        message: data.message 
      });
      
      if (!response.ok) {
        console.error(`[useAvenia] KYC initiation failed with status ${response.status}:`, data.error);
        throw new Error(data.error || 'KYC initiation failed');
      }

      console.log(`[useAvenia] KYC initiated successfully for user: ${userId}, URL: ${data.kycUrl}`);
      return data.kycUrl;
    } catch (error: any) {
      console.error(`[useAvenia] KYC initiation error for user ${userId}:`, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPixPayment = useCallback(async (userId: string, amount: number, walletAddress?: string): Promise<PixPayment> => {
    console.log(`[useAvenia] Creating PIX payment for user: ${userId}, amount: ${amount} BRLA, wallet: ${walletAddress || 'internal'}`);
    setLoading(true);
    
    try {
      console.log(`[useAvenia] Sending PIX payment request to NEW API for user: ${userId}`);
      const response = await fetch('/api/avenia/pix/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          outputAmount: amount, // Use outputAmount to match new API
          walletAddress // Include wallet address for external transfers
        }),
      });

      const data = await response.json();
      console.log(`[useAvenia] PIX payment API response:`, { 
        success: data.success, 
        ticketId: data.id,
        hasBrCode: !!data.brCode 
      });
      
      if (!response.ok) {
        console.error(`[useAvenia] PIX payment failed with status ${response.status}:`, data.error);
        throw new Error(data.error || 'PIX payment creation failed');
      }

      console.log(`[useAvenia] PIX payment created successfully for user: ${userId}, ticket: ${data.id}`);
      
      // Return data in the format the components expect
      return {
        ticketId: data.id,
        brCode: data.brCode,
        expiration: data.expiration
      };
    } catch (error: any) {
      console.error(`[useAvenia] PIX payment error for user ${userId}:`, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertCurrency = useCallback(async (
    userId: string,
    amount: number,
    outputCurrency: 'USDC' | 'USDT'
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/avenia/transactions/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount, outputCurrency }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Currency conversion failed');
      }

      return data.conversion;
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalances = useCallback(async (userId: string) => {
    console.log(`[useAvenia] Getting balances for user: ${userId}`);
    setLoading(true);
    try {
      const response = await fetch(`/api/avenia/balances/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[useAvenia] Get balances failed:`, data.error);
        throw new Error(data.error || 'Failed to get balances');
      }

      console.log(`[useAvenia] Balances retrieved for user ${userId}:`, data.balances);
      console.log(`[useAvenia] Using subaccount: ${data.subaccountId}`);
      setBalances(data.balances);
      return data.balances;
    } catch (error) {
      console.error(`[useAvenia] Get balances error for user ${userId}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubaccount = useCallback(async (userId: string, name: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/avenia/subaccounts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Subaccount creation failed');
      }

      return data.subaccount;
    } catch (error) {
      console.error('Subaccount creation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/avenia/user/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user data');
      }

      return data.data;
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    user,
    balances,
    login,
    validateLogin,
    initiateKYC,
    createPixPayment,
    convertCurrency,
    getBalances,
    createSubaccount,
    getUserData,
  };
};