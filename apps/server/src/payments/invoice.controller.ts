// src/payments/invoice.controller.ts
import { Controller, Get, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { InvoiceService } from './invoice.service';

@Controller('payments/invoice')
@UseGuards(JwtGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get(':paymentId')
  async getInvoice(@Param('paymentId') paymentId: string, @Res() res: Response) {
    try {
      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      
      // Return JSON invoice data
      res.json({
        success: true,
        data: invoiceData
      });
    } catch (error) {
      throw new NotFoundException('Invoice not found');
    }
  }

  @Get(':paymentId/download')
  async downloadInvoice(@Param('paymentId') paymentId: string, @Res() res: Response) {
    try {
      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const pdfBuffer = await this.invoiceService.generateInvoicePDF(invoiceData);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      throw new NotFoundException('Invoice not found');
    }
  }

  @Get(':paymentId/html')
  async htmlInvoice(@Param('paymentId') paymentId: string, @Res() res: Response) {
    try {
      const invoiceData = await this.invoiceService.generateInvoice(paymentId);
      const html = this.invoiceService.generateInvoiceHTML(invoiceData);
      
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      throw new NotFoundException('Invoice not found');
    }
  }
}