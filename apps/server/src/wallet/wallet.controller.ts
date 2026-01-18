import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreditDto } from './dto/credit.dto';
import { DeductDto } from './dto/deduct.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async balance(@Query('userId') userId: string) {
    return { balance: await this.walletService.getBalance(userId) };
  }

  @Get('can-afford')
  async canAfford(@Query('userId') userId: string, @Query('price') price: string) {
    const ok = await this.walletService.canAfford(userId, parseInt(price, 10));
    const balance = await this.walletService.getBalance(userId);
    return { status: ok, balance };
  }

  @Post('credit')
  async credit(@Body() dto: CreditDto) {
    const wallet = await this.walletService.addCoins(
      dto.userId, 
      dto.amount, 
      dto.description, 
      dto.metadata,
      dto.source
    );
    return { status: 'success', newBalance: wallet.balance };
  }

  @Post('deduct')
  async deduct(@Body() dto: DeductDto) {
    const wallet = await this.walletService.deductCoins(
      dto.userId, 
      dto.amount, 
      dto.description, 
      dto.metadata,
      dto.source
    );
    return { status: 'success', newBalance: wallet.balance };
  }

@Post('deduct-with-rollback')
async deductWithRollback(@Body() body: any) {
  // Extract transactionId from multiple possible locations
  const transactionId = 
    body.transactionId || 
    body.metadata?.transactionId ||
    `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Ensure metadata includes transactionId
  const metadata = {
    ...body.metadata,
    transactionId
  };
  
  try {
    const result = await this.walletService.tryDeductWithRollback(
      body.userId,
      body.amount,
      transactionId,
      body.description,
      metadata
    );
    
    return { 
      status: 'pending', 
      transactionId,
      balance: result?.wallet?.balance || 0 // Use optional chaining and default value
    };
  } catch (error) {
    return { 
      status: 'failed', 
      transactionId,
      message: error.message,
      balance: 0
    };
  }
}

  @Post('complete-transaction/:transactionId')
  async completeTransaction(
    @Param('transactionId') transactionId: string,
    @Body() body: { userId: string; metadata?: any }
  ) {
    const result = await this.walletService.markTransactionComplete(
      body.userId,
      transactionId,
      body.metadata
    );
    return { status: 'completed', transactionId };
  }

  @Post('refund-transaction/:transactionId')
  async refundTransaction(
    @Param('transactionId') transactionId: string,
    @Body() body: { userId: string; reason?: string }
  ) {
    const result = await this.walletService.refundTransaction(
      body.userId,
      transactionId,
      body.reason
    );
    return { status: 'refunded', transactionId };
  }

  @Get('transaction-status/:transactionId')
  async transactionStatus(
    @Param('transactionId') transactionId: string,
    @Query('userId') userId: string
  ) {
    return await this.walletService.getTransactionStatus(transactionId, userId);
  }

  @Get('transactions')
  async txs(@Query('userId') userId: string) {
    return { transactions: await this.walletService.transactions(userId) };
  }

  @Get('breakdown')
  async breakdown(@Query('userId') userId: string) {
    return await this.walletService.getCoinBreakdown(userId);
  }

  @Get('subscription-stats')
  async subscriptionStats(@Query('userId') userId: string) {
    return await this.walletService.getSubscriptionStats(userId);
  }

  @Get('enhanced-balance')
  async enhancedBalance(@Query('userId') userId: string) {
    return await this.walletService.getEnhancedBalance(userId);
  }
}