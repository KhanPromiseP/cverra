import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  Logger,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InvoiceService } from './invoice.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

interface AuthRequest extends Request {
  user: { id: string; [key: string]: any };
}

interface ProviderStatus {
  enabled: boolean;
  name: string;
  error?: string;
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @UseGuards(JwtGuard)
  @Post('initiate')
  async initiate(
    @Req() req: AuthRequest,
    @Body() body: { 
      amount: number; 
      provider?: string; 
      currency?: string;
      metadata?: any;
      returnUrl?: string;
    }
  ) {
    this.logger.log('Payment initiation request:', {
      userId: req.user.id,
      amount: body.amount,
      provider: body.provider,
      currency: body.currency
    });

    const { amount, provider = 'MOCK', currency = 'USD', metadata } = body;
    
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    // Ensure amount is a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('Invalid amount format');
    }

    try {
      const result = await this.payments.initiate({
        userId: req.user.id,
        amount: numericAmount,
        provider,
        currency,
        metadata,
      });

      this.logger.log('Payment initiation successful:', {
        paymentId: result.payment.id,
        provider: result.initiation.provider
      });

      return result;
    } catch (error) {
      this.logger.error('Payment initiation failed:', error);
      throw new BadRequestException(
        error.message || 'Failed to initiate payment'
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('verify')
  async verify(
    @Query('provider') provider: string,
    @Query('ref') providerRef: string,
  ) {
    if (!provider || !providerRef)
      throw new BadRequestException('Provider and ref are required');

    return this.payments.verify(provider, providerRef);
  }

  @UseGuards(JwtGuard)
  @Get('mine')
  async myPayments(@Req() req: AuthRequest) {
    return this.payments.getUserPayments(req.user.id);
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async getPayment(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.payments.getPaymentById(id, req.user.id);
  }

  // ==================== INVOICE ROUTES ====================

  @UseGuards(JwtGuard)
  @Get('invoice/:paymentId')
  async getInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthRequest,
  ) {
    this.logger.log('Invoice request:', { paymentId, userId: req.user.id });

    try {
      // First verify the payment belongs to the user
      const payment = await this.payments.getPaymentById(paymentId, req.user.id);
      
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      
      this.logger.log('Invoice generated successfully:', { 
        paymentId, 
        invoiceNumber: invoiceData.invoiceNumber 
      });

      return {
        success: true,
        data: invoiceData,
        message: 'Invoice retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Invoice generation failed:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to generate invoice'
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('invoice/:paymentId/download')
  async downloadInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    this.logger.log('Invoice download request:', { paymentId, userId: req.user.id });

    try {
      // Verify payment belongs to user
      const payment = await this.payments.getPaymentById(paymentId, req.user.id);
      
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const pdfBuffer = await this.invoiceService.generateInvoicePDF(invoiceData);

      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      this.logger.log('Invoice PDF generated:', { 
        paymentId, 
        filename,
        size: pdfBuffer.length 
      });

      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Invoice download failed:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to download invoice'
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('invoice/:paymentId/html')
  async htmlInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    this.logger.log('HTML invoice request:', { paymentId, userId: req.user.id });

    try {
      // Verify payment belongs to user
      const payment = await this.payments.getPaymentById(paymentId, req.user.id);
      
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const html = this.invoiceService.generateInvoiceHTML(invoiceData);

      res.set({
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      this.logger.log('HTML invoice generated:', { 
        paymentId, 
        invoiceNumber: invoiceData.invoiceNumber 
      });

      res.send(html);
    } catch (error) {
      this.logger.error('HTML invoice generation failed:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to generate HTML invoice'
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('invoice/:paymentId/preview')
  async previewInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    this.logger.log('Invoice preview request:', { paymentId, userId: req.user.id });

    try {
      // Verify payment belongs to user
      const payment = await this.payments.getPaymentById(paymentId, req.user.id);
      
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const pdfBuffer = await this.invoiceService.generateInvoicePDF(invoiceData);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      this.logger.log('Invoice preview generated:', { 
        paymentId, 
        invoiceNumber: invoiceData.invoiceNumber 
      });

      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Invoice preview failed:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to generate invoice preview'
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('invoice/:paymentId/email')
  async emailInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthRequest,
  ) {
    this.logger.log('Email invoice request:', { paymentId, userId: req.user.id });

    try {
      // Verify payment belongs to user
      const payment = await this.payments.getPaymentById(paymentId, req.user.id);
      
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const pdfBuffer = await this.invoiceService.generateInvoicePDF(invoiceData);

      // Here you would integrate with your email service
      // For now, we'll return the PDF as base64 for email attachment
      const pdfBase64 = pdfBuffer.toString('base64');

      this.logger.log('Invoice prepared for email:', { 
        paymentId, 
        invoiceNumber: invoiceData.invoiceNumber,
        size: pdfBuffer.length
      });

      return {
        success: true,
        data: {
          invoice: invoiceData,
          pdfAttachment: pdfBase64,
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
        },
        message: 'Invoice prepared for email delivery',
      };
    } catch (error) {
      this.logger.error('Email invoice preparation failed:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to prepare invoice for email'
      );
    }
  }

  // Get all invoices for a user
  @UseGuards(JwtGuard)
  @Get('invoices/mine')
  async getUserInvoices(@Req() req: AuthRequest) {
    this.logger.log('User invoices request:', { userId: req.user.id });

    try {
      const payments = await this.payments.getUserPayments(req.user.id);
      
      // Generate basic invoice data for each payment
      const invoices = await Promise.all(
        payments.map(async (payment) => {
          try {
            const invoiceData = await this.invoiceService.generateInvoice(payment.id);
            return {
              paymentId: payment.id,
              invoiceNumber: invoiceData.invoiceNumber,
              date: invoiceData.date,
              amount: invoiceData.amount,
              currency: invoiceData.currency,
              status: payment.status,
              coins: invoiceData.coins,
            };
          } catch (error) {
            // Return basic info if invoice generation fails
            return {
              paymentId: payment.id,
              invoiceNumber: `INV-${payment.id.slice(-8).toUpperCase()}`,
              date: payment.createdAt,
              amount: Number(payment.amount),
              currency: payment.currency,
              status: payment.status,
              coins: payment.coinsGranted || 0,
              error: 'Invoice details unavailable',
            };
          }
        })
      );

      return {
        success: true,
        data: invoices,
        count: invoices.length,
        message: 'User invoices retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get user invoices:', error);
      throw new BadRequestException('Failed to retrieve user invoices');
    }
  }
  

  @Get('providers/status')
  async getProviderStatus() {
    const providers = ['STRIPE', 'TRANZAK', 'MOCK'];
    const status: { [key: string]: ProviderStatus } = {};
    
    for (const provider of providers) {
      try {
        const driver = (this.payments as any).getDriver?.(provider);
        status[provider] = {
          enabled: !!driver,
          name: provider,
        };
      } catch (error) {
        status[provider] = {
          enabled: false,
          name: provider,
          error: (error as Error).message,
        };
      }
    }
    
    return { success: true, data: status };
  }
}