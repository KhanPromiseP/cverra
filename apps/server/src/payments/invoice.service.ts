// src/payments/invoice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { Payment, User } from '@prisma/client';
import PDFDocument from 'pdfkit'; // FIXED: Use default import
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
  serviceDescription: string; // Add this
  serviceDetails: string; // Add this
  isSubscription: boolean; // Add this
  subscriptionDetails?: { // Add this
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
    metadata: {
      paymentMethod?: any;
      isSubscription: boolean;
      subscriptionPlan?: string;
      interval?: string;
    };
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
  };
}
@Injectable()
export class InvoiceService {
  private companyInfo = {
    name: 'Cverra SaaS Company',
    address: '123 Business Street, Bamenda, State 12345',
    phone: '+(237) 680-834-767',
    email: 'billing@yourcompany.com',
    website: 'https://Cverra.com',
    taxId: 'TAX-123-456-789',
  };

  constructor(private prisma: PrismaService) {}

 // Update the generateInvoice method to include subscription details
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

  // Extract payment method from metadata
  let paymentMethod: any = undefined;
  if (payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)) {
    const metadata = payment.metadata as Record<string, any>;
    paymentMethod = metadata.paymentMethod;
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
    coins = plan.coins; // Use plan coins for subscriptions
  } else {
    serviceDescription = `${coins.toLocaleString()} Career Coins`;
    serviceDetails = 'Virtual currency for accessing premium career tools';
  }

  // Create properly structured payment object
  const structuredPayment = {
    user: {
      name: payment.user.name || 'Customer',
      email: payment.user.email,
    },
    providerRef: payment.providerRef || 'N/A',
    status: payment.status,
    provider: payment.provider,
    metadata: {
      paymentMethod: paymentMethod,
      isSubscription: isSubscription,
      subscriptionPlan: payment.userSubscription?.plan?.name,
      interval: payment.userSubscription?.plan?.interval,
    }
  };

  return {
    id: payment.id,
    invoiceNumber,
    date: payment.createdAt,
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
        const doc = new PDFDocument({ margin: 50 }); // FIXED: Now works with default import
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Add header
        this.addHeader(doc, invoiceData);
        
        // Add company and client info
        this.addCompanyInfo(doc, invoiceData);
        this.addClientInfo(doc, invoiceData);
        
        // Add invoice details
        this.addInvoiceDetails(doc, invoiceData);
        
        // Add items table
        this.addItemsTable(doc, invoiceData);
        
        // Add totals
        this.addTotals(doc, invoiceData);
        
        // Add footer
        this.addFooter(doc, invoiceData);

        // Generate QR code for invoice verification
        await this.addQRCode(doc, invoiceData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    // Company logo area (you can add an actual logo image)
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(invoice.companyInfo.name, 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('INVOICE', 50, 75);
  }

  private addCompanyInfo(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#333333')
      .text(invoice.companyInfo.address, 50, 100)
      .text(`Phone: ${invoice.companyInfo.phone}`, 50, 115)
      .text(`Email: ${invoice.companyInfo.email}`, 50, 130)
      .text(`Website: ${invoice.companyInfo.website}`, 50, 145);
  }

  private addClientInfo(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const clientY = 180;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('BILL TO:', 300, clientY)
      .font('Helvetica')
      .text(invoice.payment.user.name, 300, clientY + 15)
      .text(invoice.payment.user.email, 300, clientY + 30);
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const detailsY = 250;
    
    // FIXED: Use proper date formatting
    const formattedDate = invoice.date.toLocaleDateString();
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('INVOICE DETAILS:', 50, detailsY)
      .font('Helvetica')
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, detailsY + 20)
      .text(`Date: ${formattedDate}`, 50, detailsY + 35)
      .text(`Transaction ID: ${invoice.payment.providerRef}`, 50, detailsY + 50)
      .text(`Payment Method: ${invoice.payment.provider}`, 50, detailsY + 65);
  }

  private addItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  const tableTop = 350;
  
  // Table header
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .rect(50, tableTop, 500, 20)
    .fill('#1e40af')
    .fillColor('#ffffff')
    .text('Description', 60, tableTop + 5)
    .text('Quantity', 350, tableTop + 5)
    .text('Unit Price', 420, tableTop + 5)
    .text('Amount', 480, tableTop + 5);

  // Table row
  const description = invoice.isSubscription 
    ? `${invoice.subscriptionDetails?.planName} Subscription (${invoice.subscriptionDetails?.interval})`
    : 'Virtual Coins';
    
  const quantity = invoice.isSubscription
    ? '1 subscription'
    : `${invoice.coins.toLocaleString()} coins`;

  doc
    .font('Helvetica')
    .fillColor('#333333')
    .text(description, 60, tableTop + 30)
    .text(quantity, 350, tableTop + 30)
    .text(`${invoice.amount} ${invoice.currency}`, 420, tableTop + 30)
    .text(`${invoice.amount} ${invoice.currency}`, 480, tableTop + 30);

  // Add subscription note if applicable
  if (invoice.isSubscription) {
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(`Recurring ${invoice.subscriptionDetails?.interval?.toLowerCase()} billing - Next renewal: ${invoice.subscriptionDetails?.periodEnd.toLocaleDateString()}`, 60, tableTop + 55);
  }
}

  private addTotals(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const totalsY = 420;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Subtotal:', 400, totalsY)
      .text(`${invoice.amount} ${invoice.currency}`, 480, totalsY)
      .text('Tax (0%):', 400, totalsY + 15)
      .text(`0.00 ${invoice.currency}`, 480, totalsY + 15)
      .text('Total:', 400, totalsY + 35)
      .text(`${invoice.amount} ${invoice.currency}`, 480, totalsY + 35);
  }

  private addFooter(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    const footerY = 550;
    
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your business!', 50, footerY)
      .text('This is an automated invoice. No signature required.', 50, footerY + 12)
      .text(`Invoice generated on: ${new Date().toLocaleString()}`, 50, footerY + 24);
  }

  private async addQRCode(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
    try {
      const qrData = JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        date: invoice.date.toISOString(), // FIXED: Convert date to string
        transactionId: invoice.payment.providerRef,
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 80,
        margin: 1,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });

      // Remove data URL prefix
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      doc.image(qrBuffer, 450, 100, { width: 80, height: 80 });
      
      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Scan to verify', 450, 185, { width: 80, align: 'center' });
    } catch (error) {
      console.warn('QR code generation failed:', error);
    }
  }

  generateInvoiceHTML(invoiceData: InvoiceData): string {
    // FIXED: Proper date formatting
    const formattedDate = invoiceData.date.toLocaleDateString();
    const generatedDate = new Date().toLocaleString();

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
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.final { border-top: 2px solid #1e40af; font-weight: bold; font-size: 18px; margin-top: 10px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status.success { background: #dcfce7; color: #166534; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
        .thank-you { background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; color: #1e40af; font-weight: 500; }
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
                <p>${invoiceData.companyInfo.address}</p>
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
                <p>Payment Method: <strong>${invoiceData.payment.provider}</strong></p>
                <p>Status: <span class="status ${invoiceData.payment.status.toLowerCase()}">${invoiceData.payment.status}</span></p>
            </div>
        </div>

        <div class="section">
            <h3>Items</h3>
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
                        <td>Virtual Coins</td>
                        <td>${invoiceData.coins.toLocaleString()} coins</td>
                        <td>1 ${invoiceData.currency} / coin</td>
                        <td>${invoiceData.amount} ${invoiceData.currency}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${invoiceData.amount} ${invoiceData.currency}</span>
            </div>
            <div class="total-row">
                <span>Tax (0%):</span>
                <span>0.00 ${invoiceData.currency}</span>
            </div>
            <div class="total-row final">
                <span>Total:</span>
                <span>${invoiceData.amount} ${invoiceData.currency}</span>
            </div>
        </div>

        <div class="thank-you">
            Thank you for your purchase! Your coins have been added to your account.
        </div>

        <div class="footer">
            <p>This is an automated invoice. No signature required.</p>
            <p>If you have any questions, please contact our support team at ${invoiceData.companyInfo.email}</p>
            <p>Invoice generated on ${generatedDate}</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #1e40af; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Print Invoice
        </button>
    </div>
</body>
</html>`;
  }
}