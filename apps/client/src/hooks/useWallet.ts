// src/hooks/useWallet.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';

interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description?: string;
  metadata?: any;
  createdAt: string;
}

interface TransactionResult {
  success: boolean;
  transactionId?: string;
  balance?: number;
  error?: string;
}

export function useWallet(userId: string) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (!userId) return 0;
    
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/wallet/balance?userId=${userId}`);
      const newBalance = response.data.balance || 0;
      setBalance(newBalance);
      return newBalance;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const canAfford = useCallback(async (price: number): Promise<boolean> => {
    if (!userId || price <= 0) return false;
    
    try {
      const response = await apiClient.get(`/wallet/can-afford?userId=${userId}&price=${price}`);
      return response.data.status || false;
    } catch (error) {
      console.error('Failed to check affordability:', error);
      return false;
    }
  }, [userId]);

  // useWallet.ts - update deductCoinsWithRollback method
const deductCoinsWithRollback = useCallback(async (
  amount: number,
  description?: string,
  metadata?: any
): Promise<TransactionResult> => {
  if (!userId || amount <= 0) {
    return { success: false, error: 'Invalid user ID or amount' };
  }
  
  try {
    setIsLoading(true);
    
    // Generate transaction ID ONCE and use it everywhere
    const transactionId = metadata?.transactionId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If metadata already has transactionId, use it
    const finalMetadata = {
      ...metadata,
      transactionId: metadata?.transactionId || transactionId
    };
    
    const response = await apiClient.post('/wallet/deduct-with-rollback', {
      userId,
      amount,
      description: description || `AI enhancement`,
      metadata: finalMetadata,
      transactionId: finalMetadata.transactionId // Make sure to send it
    });
    
    if (response.data.status === 'pending') {
      setBalance(prev => Math.max(0, prev - amount));
      
      return { 
        success: true, 
        transactionId: response.data.transactionId, 
        balance: response.data.balance 
      };
    }
    
    return { success: false, error: 'Transaction failed' };
    
  } catch (error: any) {
    console.error('Failed to deduct coins with rollback:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  } finally {
    setIsLoading(false);
  }
}, [userId]);

  const completeTransaction = useCallback(async (
    transactionId: string,
    metadata?: any
  ): Promise<TransactionResult> => {
    if (!userId) {
      return { success: false, error: 'Invalid user ID' };
    }
    
    try {
      const response = await apiClient.post(`/wallet/complete-transaction/${transactionId}`, {
        userId,
        metadata
      });
      
      return { success: response.data.status === 'completed' };
    } catch (error: any) {
      console.error('Failed to complete transaction:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }, [userId]);

  const refundTransaction = useCallback(async (
    transactionId: string,
    reason?: string
  ): Promise<TransactionResult> => {
    if (!userId) {
      return { success: false, error: 'Invalid user ID' };
    }
    
    try {
      const response = await apiClient.post(`/wallet/refund-transaction/${transactionId}`, {
        userId,
        reason: reason || 'Transaction failed'
      });
      
      // Refresh balance after refund
      await fetchBalance();
      
      return { success: response.data.status === 'refunded' };
    } catch (error: any) {
      console.error('Failed to refund transaction:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }, [userId, fetchBalance]);

  const getTransactionHistory = useCallback(async (): Promise<WalletTransaction[]> => {
    if (!userId) return [];
    
    try {
      const response = await apiClient.get(`/wallet/transactions?userId=${userId}`);
      return response.data.transactions || [];
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }, [userId]);

  const getEnhancedBalance = useCallback(async () => {
    if (!userId) return null;
    
    try {
      const response = await apiClient.get(`/wallet/enhanced-balance?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch enhanced balance:', error);
      return null;
    }
  }, [userId]);

  // Initial balance fetch
  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId, fetchBalance]);

  return { 
    balance, 
    isLoading,
    fetchBalance, 
    canAfford, 
    deductCoinsWithRollback,
    completeTransaction,
    refundTransaction,
    getTransactionHistory,
    getEnhancedBalance
  };
}