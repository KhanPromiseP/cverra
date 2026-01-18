import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { TransactionType, TransactionSource } from '@prisma/client';


interface WalletTransactionMetadata {
  transactionId?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async ensureWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId, balance: 0 } });
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return wallet.balance;
  }

  async addCoins(
    userId: string, 
    amount: number, 
    description?: string, 
    metadata?: any,
    source: TransactionSource = TransactionSource.SYSTEM
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: 'CREDIT' as TransactionType,
          source: source,
          description: description || `Added ${amount} coins`,
          metadata: metadata || {},
        },
      });

      return wallet;
    });
  }

  async deductCoins(
    userId: string, 
    amount: number, 
    description?: string, 
    metadata?: any,
    source: TransactionSource = TransactionSource.SYSTEM
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient coins');
      }

      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: 'DEBIT' as TransactionType,
          source: source,
          description: description || `Deducted ${amount} coins`,
          metadata: metadata || {},
        },
      });

      return updated;
    });
  }

  // In your wallet.service.ts, update this method:
async deductCoinsWithRollback(
  amount: number,
  description: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number; transactionId?: string }> {
  try {
    const userId = metadata?.userId;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    // Generate a transaction ID if not provided
    const transactionId = metadata?.transactionId || `ai_build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.tryDeductWithRollback(
      userId,
      amount,
      transactionId,
      description,
      {
        ...metadata,
        transactionId,
        action: metadata.action || 'ai_resume_builder',
        status: 'pending'
      }
    );

    return {
      success: true,
      newBalance: result.wallet?.balance || 0,
      transactionId: transactionId,
    };
  } catch (error) {
    this.logger.error(`Deduction with rollback failed: ${error.message}`);
    return {
      success: false,
      newBalance: 0,
    };
  }
}

async completeTransaction(
  transactionId: string,
  resultData: any
): Promise<void> {
  try {
    await this.markTransactionComplete(
      resultData.userId || 'unknown',
      transactionId,
      {
        ...resultData,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
    );
    this.logger.log(`Transaction ${transactionId} completed successfully`);
  } catch (error) {
    this.logger.error(`Failed to complete transaction ${transactionId}: ${error.message}`);
    throw error;
  }
}

  // async canAfford(userId: string, amount: number) {
  //   const wallet = await this.ensureWallet(userId);
  //   return wallet.balance >= amount;
  // }

  async transactions(userId: string, limit = 50) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Add this helper method to match the controller signature better
async canAfford(userId: string, amount: number): Promise<boolean> {
  try {
    const wallet = await this.ensureWallet(userId);
    return wallet.balance >= amount;
  } catch (error) {
    this.logger.error(`CanAfford check failed: ${error.message}`);
    return false;
  }
}

// Add this method to get the current balance for response
async getCurrentBalance(userId: string): Promise<number> {
  const wallet = await this.ensureWallet(userId);
  return wallet.balance;
}


  async tryDeductWithRollback(
  userId: string,
  amount: number,
  transactionId: string,
  description?: string,
  metadata?: any
) {
  if (amount <= 0) throw new BadRequestException('Amount must be positive');

  // Check if transaction already succeeded or is in progress
  const existingTransaction = await this.prisma.walletTransaction.findFirst({
    where: {
      userId,
      metadata: { path: ['transactionId'], equals: transactionId }
    }
  });

  if (existingTransaction) {
    // Check if already completed
    const existingMetadata = existingTransaction.metadata as WalletTransactionMetadata | null;
    if (existingMetadata?.status === 'completed') {
      this.logger.log(`Transaction ${transactionId} already completed`);
      return {
        success: true,
        transactionId,
        wallet: await this.prisma.wallet.findUnique({ where: { userId } })
      };
    }
    
    // If pending, check if we should retry or return existing
    if (existingMetadata?.status === 'pending') {
      this.logger.log(`Transaction ${transactionId} already pending, returning existing`);
      return {
        success: true,
        transactionId,
        wallet: await this.prisma.wallet.findUnique({ where: { userId } })
      };
    }
  }

  try {
    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient coins');
      }

      // Deduct coins
      const walletUpdate = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      // Create transaction record
      const transactionRecord = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: 'DEBIT' as TransactionType,
          source: TransactionSource.AI_BUILDER || TransactionSource.SYSTEM, // Use AI_BUILDER if available
          description: description || `Deducted ${amount} coins for AI processing`,
          metadata: {
            transactionId,
            status: 'pending',
            action: 'ai_resume_builder',
            timestamp: new Date().toISOString(),
            ...(metadata || {})
          },
        },
      });

      return { 
        success: true,
        wallet: walletUpdate, 
        transaction: transactionRecord 
      };
    });

    this.logger.log(`Deducted ${amount} coins for user ${userId}, transaction: ${transactionId}`);
    return {
      success: true,
      transactionId,
      wallet: result.wallet,
    };

  } catch (error) {
    this.logger.error(`Failed to deduct coins for user ${userId}: ${error.message}`);
    
    // Try to mark as failed if transaction record exists
    try {
      const existing = await this.prisma.walletTransaction.findFirst({
        where: {
          userId,
          metadata: { path: ['transactionId'], equals: transactionId }
        }
      });
      
      if (existing) {
        await this.prisma.walletTransaction.update({
          where: { id: existing.id },
          data: {
            metadata: {
              ...(existing.metadata as any),
              status: 'failed',
              error: error.message,
              failedAt: new Date().toISOString()
            }
          }
        });
      }
    } catch (updateError) {
      this.logger.error(`Failed to update transaction status: ${updateError.message}`);
    }
    
    throw error;
  }
}





  async markTransactionComplete(
  userId: string,
  transactionId: string,
  finalMetadata?: any
) {
  try {
    const transaction = await this.prisma.walletTransaction.findFirst({
      where: {
        userId,
        metadata: { path: ['transactionId'], equals: transactionId }
      }
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Type-cast metadata
    const metadata = transaction.metadata as WalletTransactionMetadata | null;

    return await this.prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          ...(metadata || {}),
          status: 'completed',
          completedAt: new Date().toISOString(),
          ...finalMetadata
        }
      }
    });

  } catch (error) {
    this.logger.error(`Failed to mark transaction complete: ${error.message}`);
    throw error;
  }
}

  async refundTransaction(
  userId: string,
  transactionId: string,
  reason?: string
) {
  return await this.prisma.$transaction(async (tx) => {
    // Find the original transaction
    const transaction = await tx.walletTransaction.findFirst({
      where: {
        userId,
        metadata: { path: ['transactionId'], equals: transactionId },
        type: 'DEBIT'
      }
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Type-cast metadata and check if already refunded
    const metadata = transaction.metadata as WalletTransactionMetadata | null;
    if (metadata?.status === 'refunded') {
      return transaction;
    }

    // Refund the coins
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: transaction.amount } },
    });

    // Create refund transaction
    await tx.walletTransaction.create({
      data: {
        walletId: transaction.walletId,
        userId,
        amount: transaction.amount,
        type: 'CREDIT' as TransactionType,
        source: TransactionSource.REFUND,
        description: reason || `Refund for failed AI processing`,
        metadata: {
          originalTransactionId: transaction.id,
          refundReason: reason,
          refundedAt: new Date().toISOString()
        },
      },
    });

    // Mark original as refunded
    const updatedTransaction = await tx.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          ...(metadata || {}),
          status: 'refunded',
          refundedAt: new Date().toISOString(),
          refundReason: reason
        }
      }
    });

    this.logger.log(`Refunded ${transaction.amount} coins to user ${userId} for transaction ${transactionId}`);
    return updatedTransaction;
  });
}

async getTransactionStatus(transactionId: string, userId: string) {
  const transaction = await this.prisma.walletTransaction.findFirst({
    where: {
      userId,
      metadata: { path: ['transactionId'], equals: transactionId }
    }
  });

  if (!transaction) {
    return { exists: false };
  }

  // Type-cast metadata
  const metadata = transaction.metadata as WalletTransactionMetadata | null;

  return {
    exists: true,
    status: metadata?.status || 'unknown',
    amount: transaction.amount,
    type: transaction.type,
    createdAt: transaction.createdAt,
    metadata: metadata
  };
}

  

  async getCoinBreakdown(userId: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { 
        userId,
        type: 'CREDIT' // Only count credits
      },
      orderBy: { createdAt: 'desc' }
    });

    const breakdown = {
      totalCoins: 0,
      fromSubscriptions: 0,
      fromPurchases: 0,
      fromBonuses: 0,
      fromManualAdjustments: 0,
      fromSystem: 0,
      fromRefunds: 0,
      subscriptionTransactions: [] as any[],
      purchaseTransactions: [] as any[],
      bonusTransactions: [] as any[],
      manualAdjustmentTransactions: [] as any[],
      systemTransactions: [] as any[],
      refundTransactions: [] as any[]
    };

    transactions.forEach(transaction => {
      breakdown.totalCoins += transaction.amount;

      switch (transaction.source) {
        case TransactionSource.SUBSCRIPTION:
          breakdown.fromSubscriptions += transaction.amount;
          breakdown.subscriptionTransactions.push(transaction);
          break;
        case TransactionSource.ONE_TIME_PURCHASE:
          breakdown.fromPurchases += transaction.amount;
          breakdown.purchaseTransactions.push(transaction);
          break;
        case TransactionSource.BONUS:
          breakdown.fromBonuses += transaction.amount;
          breakdown.bonusTransactions.push(transaction);
          break;
        case TransactionSource.MANUAL_ADJUSTMENT:
          breakdown.fromManualAdjustments += transaction.amount;
          breakdown.manualAdjustmentTransactions.push(transaction);
          break;
        case TransactionSource.SYSTEM:
          breakdown.fromSystem += transaction.amount;
          breakdown.systemTransactions.push(transaction);
          break;
        case TransactionSource.REFUND:
          breakdown.fromRefunds += transaction.amount;
          breakdown.refundTransactions.push(transaction);
          break;
        default:
          breakdown.fromSystem += transaction.amount;
          breakdown.systemTransactions.push(transaction);
      }
    });

    // Calculate percentages
    const calculatePercentage = (value: number) => 
      breakdown.totalCoins > 0 ? Math.round((value / breakdown.totalCoins) * 100) : 0;

    return {
      ...breakdown,
      subscriptionPercentage: calculatePercentage(breakdown.fromSubscriptions),
      purchasePercentage: calculatePercentage(breakdown.fromPurchases),
      bonusPercentage: calculatePercentage(breakdown.fromBonuses),
      manualAdjustmentPercentage: calculatePercentage(breakdown.fromManualAdjustments),
      systemPercentage: calculatePercentage(breakdown.fromSystem),
      refundPercentage: calculatePercentage(breakdown.fromRefunds)
    };
  }

  async getSubscriptionStats(userId: string) {
    const breakdown = await this.getCoinBreakdown(userId);
    
    return {
      totalSubscriptionCoins: breakdown.fromSubscriptions,
      totalPurchaseCoins: breakdown.fromPurchases,
      totalBonusCoins: breakdown.fromBonuses,
      totalManualAdjustmentCoins: breakdown.fromManualAdjustments,
      totalSystemCoins: breakdown.fromSystem,
      totalRefundCoins: breakdown.fromRefunds,
      subscriptionPercentage: breakdown.subscriptionPercentage,
      purchasePercentage: breakdown.purchasePercentage,
      subscriptionCount: breakdown.subscriptionTransactions.length,
      purchaseCount: breakdown.purchaseTransactions.length,
      lastSubscriptionCredit: breakdown.subscriptionTransactions[0]?.createdAt || null,
      lastPurchaseCredit: breakdown.purchaseTransactions[0]?.createdAt || null
    };
  }

  async getEnhancedBalance(userId: string) {
    const balance = await this.getBalance(userId);
    const breakdown = await this.getCoinBreakdown(userId);
    
    return {
      availableCoins: balance,
      breakdown: {
        fromSubscriptions: breakdown.fromSubscriptions,
        fromPurchases: breakdown.fromPurchases,
        fromBonuses: breakdown.fromBonuses,
        fromManualAdjustments: breakdown.fromManualAdjustments,
        fromSystem: breakdown.fromSystem,
        fromRefunds: breakdown.fromRefunds,
        subscriptionPercentage: breakdown.subscriptionPercentage,
        purchasePercentage: breakdown.purchasePercentage,
        bonusPercentage: breakdown.bonusPercentage
      },
      summary: `${balance.toLocaleString()} coins available • ${breakdown.subscriptionPercentage}% from subscriptions • ${breakdown.purchasePercentage}% from purchases`
    };
  }
}