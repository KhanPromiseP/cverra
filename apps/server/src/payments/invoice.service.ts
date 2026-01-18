// src/payments/invoice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: Date;
  taxAmount: number;
  subtotal: number;
  amount: number;
  currency: string;
  coins: number;
  status: string;
  transactionId: string;
  serviceDescription: string;
  serviceDetails: string;
  isSubscription: boolean;
  subscriptionDetails?: {
    planName: string;
    interval: string;
    periodStart: Date;
    periodEnd: Date;
    price: number;
  };
  payment: {
    user: {
      name: string;
      email: string;
    };
    providerRef: string;
    status: string;
    provider: string;
    metadata?: {
      paymentMethod?: any;
      isSubscription?: boolean;
      subscriptionPlan?: string;
      interval?: string;
      method?: string;
      paymentMethodType?: string;
      [key: string]: any;
    };
  };
  companyInfo: {
    name: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    description?: string;
  };
}

@Injectable()
export class InvoiceService {
  private companyInfo = {
    name: 'Inlirah',
    phone: '+(237) 680-834-767',
    email: 'support@inlirah.com',
    website: 'https://inlirah.com',
    taxId: 'TAX-123-456-789',
    description: 'Next-Gen Career Platform - Your Complete Career Success Suite'
  };

  constructor(private prisma: PrismaService) {}

  // Safe date formatter helper method
  private formatDate(date: any, includeTime: boolean = false): string {
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        return 'N/A';
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return dateObj.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date Error';
    }
  }

  // Get current year dynamically
  private getCurrentYear(): string {
    return new Date().getFullYear().toString();
  }

  // Enhanced payment method formatter matching frontend logic
  private getPaymentMethodDisplay(invoice: InvoiceData): string {
    const metadata = invoice.payment.metadata;
    
    if (!metadata) {
      return this.getFallbackPaymentMethod(invoice);
    }

    // Case 1: Detailed payment method object in metadata
    const paymentMethod = metadata.paymentMethod;
    
    if (paymentMethod && typeof paymentMethod === 'object') {
      const methodType = paymentMethod.method?.toLowerCase() || '';
      
      // Format based on method type
      switch (methodType) {
        case 'visa':
        case 'mastercard':
        case 'card':
          const cardType = paymentMethod.method?.toUpperCase() || 'CARD';
          const last4 = paymentMethod.accountNumber ? 
            `**** ${paymentMethod.accountNumber.slice(-4)}` : '';
          return `${cardType} ${last4}`.trim();
          
        case 'mtn':
        case 'orange':
        case 'mobile_money':
          const network = paymentMethod.network || paymentMethod.method?.toUpperCase() || '';
          const wallet = paymentMethod.mobileWallet || '';
          const phone = paymentMethod.accountNumber || '';
          return `${network} ${wallet} ${phone}`.trim();
          
        default:
          if (paymentMethod.displayName) {
            return paymentMethod.displayName;
          }
          if (paymentMethod.method) {
            return paymentMethod.method.toUpperCase();
          }
      }
    }
    
    // Case 2: Check for direct paymentMethod string
    if (metadata.paymentMethod && typeof metadata.paymentMethod === 'string') {
      return metadata.paymentMethod;
    }
    
    // Case 3: Check if there's provider-specific metadata
    const method = metadata.method || metadata.paymentMethodType;
    if (method) {
      const methodStr = method.toString().toLowerCase();
      if (methodStr.includes('visa') || methodStr.includes('mastercard') || methodStr.includes('card')) {
        return 'Credit/Debit Card';
      }
      if (methodStr.includes('mtn') || methodStr.includes('orange') || methodStr.includes('mobile')) {
        return 'Mobile Money';
      }
      return method.toString();
    }
    
    // Fallback
    return this.getFallbackPaymentMethod(invoice);
  }

  private getFallbackPaymentMethod(invoice: InvoiceData): string {
    const provider = invoice.payment.provider || '';
    const providerUpper = provider.toUpperCase();
    
    if (providerUpper.includes('TRANZAK')) {
      return 'Payment via Tranzak';
    }
    
    if (providerUpper.includes('STRIPE')) {
      return 'Credit/Debit Card';
    }
    
    if (providerUpper.includes('MOCK')) {
      return 'Test Payment';
    }
    
    return provider || 'Unknown';
  }

  // Helper to get subscription period display
  private getSubscriptionPeriod(invoice: InvoiceData): string {
    if (!invoice.isSubscription || !invoice.subscriptionDetails) return '';
    
    const startDate = this.formatDate(invoice.subscriptionDetails.periodStart);
    const endDate = this.formatDate(invoice.subscriptionDetails.periodEnd);
    
    return `Billing Period: ${startDate} - ${endDate}`;
  }

  async generateInvoice(paymentId: string): Promise<InvoiceData> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        userSubscription: {
          include: { 
            plan: {
              select: {
                name: true,
                interval: true,
                coins: true,
                price: true,
              }
            }
          }
        }
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Generate professional invoice number
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${timestamp}-${random}`;

    const amount = Number(payment.amount);
    const taxRate = 0.00;
    const taxAmount = amount * taxRate;
    const subtotal = amount - taxAmount;

    // Extract metadata
    let metadata: any = {};
    if (payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)) {
      metadata = payment.metadata as Record<string, any>;
    }

    // Determine if this is a subscription payment
    const isSubscription = !!payment.userSubscription;
    
    // Service description based on payment type
    let serviceDescription = '';
    let serviceDetails = '';
    let coins = payment.coinsGranted || 0;

    if (isSubscription && payment.userSubscription) {
      const plan = payment.userSubscription.plan;
      serviceDescription = `${plan.name} Subscription (${plan.interval})`;
      serviceDetails = `Recurring subscription plan including ${plan.coins.toLocaleString()} coins per ${plan.interval.toLowerCase()} for AI resume builder, cover letter generator, and professional growth features`;
      coins = plan.coins;
    } else {
      serviceDescription = `${coins.toLocaleString()} Career Coins`;
      serviceDetails = 'Virtual currency for accessing premium career tools, AI resume builder, cover letter generator, and professional growth features';
    }

    // Create properly structured payment object matching frontend interface
    const structuredPayment = {
      user: {
        name: payment.user.name || 'Customer',
        email: payment.user.email,
      },
      providerRef: payment.providerRef || 'N/A',
      status: payment.status,
      provider: payment.provider,
      metadata: metadata
    };

    return {
      id: payment.id,
      invoiceNumber,
      date: new Date(payment.createdAt),
      payment: structuredPayment,
      coins: coins,
      amount,
      currency: payment.currency,
      taxAmount,
      subtotal,
      status: payment.status,
      transactionId: payment.providerRef || 'N/A',
      companyInfo: this.companyInfo,
      serviceDescription,
      serviceDetails,
      isSubscription: isSubscription,
      subscriptionDetails: payment.userSubscription ? {
        planName: payment.userSubscription.plan.name,
        interval: payment.userSubscription.plan.interval,
        periodStart: payment.userSubscription.currentPeriodStart,
        periodEnd: payment.userSubscription.currentPeriodEnd,
        price: Number(payment.userSubscription.plan.price)
      } : undefined
    };
  }

  async generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Invoice ${invoiceData.invoiceNumber}`,
            Author: 'Inlirah',
            Subject: 'Payment Invoice',
            Keywords: 'invoice, payment, receipt, career, coins',
            Creator: 'Inlirah Invoice System',
            CreationDate: new Date()
          }
        });
        
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Professional header with logo placeholder
        this.addHeader(doc, invoiceData);
        
        // Company and client info side by side
        this.addCompanyClientInfo(doc, invoiceData);
        
        // Invoice details
        this.addInvoiceDetails(doc, invoiceData);
        
        // Service/Subscription details
        this.addServiceDetails(doc, invoiceData);
        
        // Items table with proper formatting
        this.addItemsTable(doc, invoiceData);
        
        // Totals section (FIXED: no line on total)
        this.addTotals(doc, invoiceData);
        
        // Transaction details section
        this.addTransactionDetails(doc, invoiceData);
        
        // Thank you message and QR code
        await this.addThankYouAndQRCode(doc, invoiceData);
        
        // Professional footer
        this.addFooter(doc, invoiceData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    // Company name with styling
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Inlirah', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Next-Gen Career Platform', 50, 75)
      .fontSize(8)
      .text(invoice.companyInfo.description || 'Your Complete Career Success Suite', 50, 90);
    
    // Invoice title on right
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('INVOICE', 400, 50, { align: 'right' })
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`#${invoice.invoiceNumber}`, 400, 80, { align: 'right' });
  }

  private addCompanyClientInfo(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    // Left side - From
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('From:', 50, 120)
      .font('Helvetica')
      .text(invoice.companyInfo.name, 50, 135)
      .fontSize(9)
      .text(invoice.companyInfo.email, 50, 150)
      .text(invoice.companyInfo.phone, 50, 165)
      .text(invoice.companyInfo.website, 50, 180);
    
    // Right side - Bill To
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Bill To:', 300, 120)
      .font('Helvetica')
      .text(invoice.payment.user.name, 300, 135)
      .fontSize(9)
      .text(invoice.payment.user.email, 300, 150);
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const detailsY = 220;
    
    // Details box
    doc
      .rect(50, detailsY, 500, 60)
      .fill('#f8fafc')
      .stroke('#e2e8f0');
    
    // Details content
    const paymentMethod = this.getPaymentMethodDisplay(invoice);
    
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Invoice Date:', 60, detailsY + 10)
      .text('Transaction ID:', 60, detailsY + 25)
      .text('Payment Method:', 60, detailsY + 40)
      .font('Helvetica')
      .text(this.formatDate(invoice.date), 150, detailsY + 10)
      .text(invoice.payment.providerRef || 'N/A', 150, detailsY + 25)
      .text(paymentMethod, 150, detailsY + 40);
    
    doc
      .font('Helvetica-Bold')
      .text('Status:', 350, detailsY + 10)
      .font('Helvetica')
      .fillColor(invoice.status === 'SUCCESS' ? '#166534' : '#92400e')
      .text(invoice.status === 'SUCCESS' ? 'Paid' : invoice.status, 400, detailsY + 10);
  }

  private addServiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const serviceY = 300;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(invoice.isSubscription ? 'SUBSCRIPTION DETAILS' : 'SERVICE DETAILS', 50, serviceY);
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Description:', 50, serviceY + 20)
      .font('Helvetica')
      .text(invoice.serviceDescription, 130, serviceY + 20);
    
    // Wrap service details text
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(invoice.serviceDetails, 50, serviceY + 40, {
        width: 500,
        lineGap: 3
      });
    
    // Add subscription period if applicable
    if (invoice.isSubscription && invoice.subscriptionDetails) {
      const subY = serviceY + 60;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('Subscription Details:', 50, subY)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`• ${invoice.coins.toLocaleString()} coins per ${invoice.subscriptionDetails.interval.toLowerCase()}`, 65, subY + 12)
        .text(`• Billing period: ${this.formatDate(invoice.subscriptionDetails.periodStart)} - ${this.formatDate(invoice.subscriptionDetails.periodEnd)}`, 65, subY + 24)
        .text(`• ${invoice.subscriptionDetails.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} recurring payment`, 65, subY + 36);
    }
  }

  private addItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const tableTop = invoice.isSubscription ? 420 : 380;
    
    // Table header with background
    doc
      .rect(50, tableTop, 500, 20)
      .fill('#1e40af')
      .fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', 60, tableTop + 5)
      .text('Quantity', 350, tableTop + 5)
      .text('Unit Price', 420, tableTop + 5)
      .text('Amount', 480, tableTop + 5);

    // Table row
    const description = invoice.isSubscription 
      ? `${invoice.subscriptionDetails?.planName} Subscription`
      : 'Career Coins';
      
    const quantity = invoice.isSubscription
      ? '1 subscription'
      : `${invoice.coins.toLocaleString()} coins`;

    doc
      .fillColor('#333333')
      .font('Helvetica')
      .text(description, 60, tableTop + 30)
      .text(quantity, 350, tableTop + 30)
      .text(`${invoice.amount} ${invoice.currency}`, 420, tableTop + 30)
      .text(`${invoice.amount} ${invoice.currency}`, 480, tableTop + 30);

    // Bottom border
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, tableTop + 50)
      .lineTo(550, tableTop + 50)
      .stroke();
  }

  private addTotals(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const totalsY = 470;
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Subtotal:', 400, totalsY)
      .text(`${invoice.amount} ${invoice.currency}`, 480, totalsY)
      .text('Tax (0%):', 400, totalsY + 15)
      .text(`0.00 ${invoice.currency}`, 480, totalsY + 15)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Total:', 400, totalsY + 35)
      .text(`${invoice.amount} ${invoice.currency}`, 480, totalsY + 35);
  }

  private addTransactionDetails(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const detailsY = 530;
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('TRANSACTION DETAILS', 50, detailsY);
    
    // Details grid
    const gridY = detailsY + 20;
    const paymentMethod = this.getPaymentMethodDisplay(invoice);
    
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666');
    
    // Column 1
    doc
      .text('Transaction ID:', 50, gridY)
      .text(invoice.payment.providerRef || 'N/A', 50, gridY + 12)
      .text('Payment Date:', 50, gridY + 32)
      .text(this.formatDate(invoice.date, true), 50, gridY + 44);
    
    // Column 2
    doc
      .text('Payment Method:', 250, gridY)
      .text(paymentMethod, 250, gridY + 12)
      .text('Status:', 250, gridY + 32)
      .fillColor(invoice.status === 'SUCCESS' ? '#166534' : '#92400e')
      .text(invoice.status === 'SUCCESS' ? 'Completed' : invoice.status, 250, gridY + 44);
    
    // Subscription details if applicable
    if (invoice.isSubscription && invoice.subscriptionDetails) {
      doc
        .fillColor('#666666')
        .text('Subscription Type:', 50, gridY + 64)
        .text(`Recurring ${invoice.subscriptionDetails.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} Billing`, 50, gridY + 76)
        .text('Next Billing Date:', 250, gridY + 64)
        .text(this.formatDate(invoice.subscriptionDetails.periodEnd), 250, gridY + 76);
    }
  }

  private async addThankYouAndQRCode(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const thankYouY = 620;
    
    // Thank you message
    doc
      .rect(50, thankYouY, 300, 40)
      .fill('#dbeafe')
      .fillColor('#1e40af')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Thank you for your business!', 60, thankYouY + 10)
      .fontSize(8)
      .font('Helvetica')
      .text(invoice.isSubscription ? 
        `Your ${invoice.coins.toLocaleString()} coins have been added and will renew automatically.` :
        `Your ${invoice.coins.toLocaleString()} Career Coins are ready to use for premium features.`, 
        60, thankYouY + 25);
    
    // QR Code
    try {
      const qrData = JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        date: this.formatDate(invoice.date),
        transactionId: invoice.payment.providerRef,
        customer: invoice.payment.user.email,
        verification: `verify-${invoice.id.slice(0, 8)}`
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });

      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      doc.image(qrBuffer, 400, thankYouY, { width: 80, height: 80 });
      
      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Scan to verify invoice', 400, thankYouY + 85, { width: 80, align: 'center' });
    } catch (error) {
      console.warn('QR code generation failed:', error);
    }
  }

  private addFooter(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const footerY = 720;
    const currentYear = this.getCurrentYear();
    
    // Footer separator
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, footerY)
      .lineTo(550, footerY)
      .stroke();
    
    // Footer content
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('This is an automated invoice. No signature required.', 50, footerY + 10)
      .text(`If you have any questions, please contact our support team at ${invoice.companyInfo.email}`, 50, footerY + 22)
      .text(`Invoice generated on: ${this.formatDate(new Date(), true)}`, 50, footerY + 34)
      .text(`© ${currentYear} Inlirah. All rights reserved.`, 400, footerY + 10, { align: 'right' })
      .text('Thank you for choosing Inlirah!', 400, footerY + 22, { align: 'right' });
  }

  generateInvoiceHTML(invoiceData: InvoiceData): string {
    const formattedDate = this.formatDate(invoiceData.date);
    const formattedDateTime = this.formatDate(invoiceData.date, true);
    const generatedDate = this.formatDate(new Date(), true);
    const paymentMethod = this.getPaymentMethodDisplay(invoiceData);
    const subscriptionPeriod = this.getSubscriptionPeriod(invoiceData);
    const nextBillingDate = invoiceData.subscriptionDetails ? 
      this.formatDate(invoiceData.subscriptionDetails.periodEnd) : '';
    const currentYear = this.getCurrentYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; padding: 20px; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e40af; }
        .company-info h1 { color: #1e40af; font-size: 28px; margin-bottom: 5px; }
        .company-info p { color: #666; margin-bottom: 2px; }
        .invoice-meta { text-align: right; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #1e40af; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #1e40af; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #1e40af; color: white; padding: 12px; text-align: left; font-weight: 600; }
        .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .table tr:nth-child(even) { background: #f8fafc; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content space-between; padding: 8px 0; }
        .total-row.final { border-top: 2px solid #1e40af; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 12px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status.success { background: #dcfce7; color: #166534; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
        .thank-you { background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; color: #1e40af; font-weight: 500; }
        .qr-container { text-align: center; margin: 20px 0; }
        .qr-code { width: 150px; height: 150px; margin: 0 auto; background: #f8fafc; padding: 10px; border-radius: 8px; }
        .subscription-details { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1e40af; }
        .subscription-details ul { margin-left: 20px; }
        .subscription-details li { margin-bottom: 5px; }
        @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>${invoiceData.companyInfo.name}</h1>
                <p>${invoiceData.companyInfo.description || 'Next-Gen Career Platform'}</p>
                <p>Phone: ${invoiceData.companyInfo.phone} | Email: ${invoiceData.companyInfo.email}</p>
                <p>Website: ${invoiceData.companyInfo.website}</p>
            </div>
            <div class="invoice-meta">
                <div class="invoice-number">${invoiceData.invoiceNumber}</div>
                <p>Date: ${formattedDate}</p>
                <p>Due: Upon Receipt</p>
            </div>
        </div>

        <div class="grid-2">
            <div class="section">
                <h3>Bill To</h3>
                <p><strong>${invoiceData.payment.user.name}</strong></p>
                <p>${invoiceData.payment.user.email}</p>
            </div>
            <div class="section">
                <h3>Payment Details</h3>
                <p>Transaction ID: <strong>${invoiceData.payment.providerRef}</strong></p>
                <p>Payment Method: <strong>${paymentMethod}</strong></p>
                <p>Status: <span class="status ${invoiceData.payment.status.toLowerCase()}">${invoiceData.payment.status}</span></p>
                <p>Payment Date: ${formattedDateTime}</p>
            </div>
        </div>

        <div class="section">
            <h3>${invoiceData.isSubscription ? 'Subscription Details' : 'Service Details'}</h3>
            <p><strong>${invoiceData.serviceDescription}</strong></p>
            <p>${invoiceData.serviceDetails}</p>
            
            ${invoiceData.isSubscription && invoiceData.subscriptionDetails ? `
                <div class="subscription-details">
                    <p><strong>Subscription Plan Details:</strong></p>
                    <ul>
                        <li>${invoiceData.coins.toLocaleString()} coins per ${invoiceData.subscriptionDetails.interval.toLowerCase()}</li>
                        <li>${subscriptionPeriod}</li>
                        <li>${invoiceData.subscriptionDetails.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} recurring payment</li>
                    </ul>
                </div>
            ` : ''}
        </div>

        <div class="section">
            <h3>Invoice Items</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${invoiceData.serviceDescription}</td>
                        <td>${invoiceData.coins.toLocaleString()} coins</td>
                        <td>1 ${invoiceData.currency} / coin</td>
                        <td>${invoiceData.amount.toFixed(2)} ${invoiceData.currency}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${invoiceData.amount.toFixed(2)} ${invoiceData.currency}</span>
            </div>
            <div class="total-row">
                <span>Tax (0%):</span>
                <span>0.00 ${invoiceData.currency}</span>
            </div>
            <div class="total-row final">
                <span>Total:</span>
                <span>${invoiceData.amount.toFixed(2)} ${invoiceData.currency}</span>
            </div>
        </div>

        ${invoiceData.isSubscription && nextBillingDate ? `
            <div class="section">
                <h3>Subscription Information</h3>
                <p>Next billing date: <strong>${nextBillingDate}</strong></p>
                <p>Your subscription will automatically renew on this date.</p>
            </div>
        ` : ''}

        <div class="qr-container">
            <div class="qr-code">
                <!-- QR Code would be generated here -->
                <div style="width: 100%; height: 100%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
                    QR Code: Invoice ${invoiceData.invoiceNumber}
                </div>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">Scan to verify invoice authenticity</p>
        </div>

        <div class="thank-you">
            ${invoiceData.isSubscription ? 
                'Thank you for subscribing to Inlirah! Your coins have been added and will renew automatically.' : 
                'Thank you for investing in your career success! Your Career Coins are ready to use for premium features.'}
            <p style="margin-top: 8px; font-size: 14px;">Need help? Contact support: ${invoiceData.companyInfo.email}</p>
        </div>

        <div class="footer">
            <p>This is an automated invoice. No signature required.</p>
            <p>If you have any questions, please contact our support team at ${invoiceData.companyInfo.email}</p>
            <p>Invoice generated on ${generatedDate}</p>
            <p>© ${currentYear} Inlirah. All rights reserved.</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #1e40af; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 0 10px;">
            Print Invoice
        </button>
        <button onclick="window.location.href='/dashboard'" style="background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 0 10px;">
            Go to Dashboard
        </button>
    </div>
</body>
</html>`;
  }
}