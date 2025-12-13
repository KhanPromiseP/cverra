import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import api from '@/client/api/axios';
import { useUser } from '@/client/services/user';
import { DocumentTextIcon, ArrowDownTrayIcon, HomeIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Logo } from "@/client/components/logo";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { motion } from "framer-motion";

interface SubscriptionDetails {
  planName: string;
  interval: string;
  periodStart: string;
  periodEnd: string;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  coins: number;
  status: string;
  transactionId: string;
  isSubscription: boolean;
  subscriptionDetails?: SubscriptionDetails;
  serviceDescription: string;
  serviceDetails: string;
  payment: {
    user: {
      name: string;
      email: string;
    };
    providerRef: string;
    status: string;
    provider: string;
    metadata?: {
      paymentMethod?: {
        displayName: string;
        method: string;
        network?: string;
        mobileWallet?: string;
        accountNumber?: string;
      };
      isSubscription?: boolean;
      subscriptionPlan?: string;
      interval?: string;
    };
  };
  companyInfo?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    website?: string;
  };
}

type InvoiceMode = 'view' | 'download' | 'html';

const Header = () => (
  <motion.header
    className="fixed inset-x-0 top-0 z-50"
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
  >
    <div className="backdrop-blur-md bg-white/10 border-b border-gray-300 shadow-md dark:bg-gray-900/10 dark:border-gray-700">
      <div className="container mx-auto flex items-center justify-between px-6 py-4 sm:px-12">
        <div className="flex items-center">
          <Logo className="-ml-3" size={72} />
        </div>

        <div className="flex items-center space-x-4">
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </div>
  </motion.header>
);

export const InvoicePage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<InvoiceMode>('view');

  // Company information
  const companyInfo = {
    name: 'Cverra',
    email: 'support@cverra.com',
    phone: '+(237) 680-834-767',
    address: 'Bamenda, Northwest Region, Cameroon',
    website: 'https://cverra.com',
    description: 'Next-Gen Career Platform - Your Complete Career Success Suite'
  };

  // Determine mode from URL
  useEffect(() => {
    if (location.pathname.includes('/download')) {
      setMode('download');
    } else if (location.pathname.includes('/html')) {
      setMode('html');
    } else {
      setMode('view');
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        console.log('Fetching invoice for payment:', paymentId);
        const response = await api.get(`/payments/invoice/${paymentId}`);
        console.log('Invoice API response:', response.data);
        
        if (response.data.success && response.data.data) {
          setInvoice(response.data.data);
          
          // Auto-download if in download mode
          if (mode === 'download') {
            downloadInvoice();
          }
        } else {
          throw new Error('Invalid invoice response');
        }
      } catch (error: any) {
        console.error('Failed to fetch invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchInvoice();
    }
  }, [paymentId, mode]);

  // Safe data access helper functions
  const getUserName = () => {
    if (!invoice) return 'Customer';
    return invoice.payment?.user?.name || user?.name || 'Customer';
  };

  const getUserEmail = () => {
    if (!invoice) return '';
    return invoice.payment?.user?.email || user?.email || '';
  };

  const getTransactionId = () => {
    if (!invoice) return '';
    return invoice.payment?.providerRef || invoice.transactionId || '';
  };

  const getPaymentMethod = () => {
    if (!invoice || !invoice.payment) return '';
    
    // Check multiple possible locations for payment method data
    const metadata = invoice.payment.metadata;
    
    // Case 1: Detailed payment method object in metadata
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      const paymentMethod = (metadata as any).paymentMethod;
      
      if (paymentMethod && typeof paymentMethod === 'object' && paymentMethod.displayName) {
        let displayText = paymentMethod.displayName;
        
        if (paymentMethod.network) {
          displayText += ` (${paymentMethod.network})`;
        }
        if (paymentMethod.mobileWallet) {
          displayText += ` - ${paymentMethod.mobileWallet}`;
        }
        if (paymentMethod.accountNumber) {
          displayText += ` - ${paymentMethod.accountNumber}`;
        }
        
        return displayText;
      }
      
      // Case 2: Simple payment method string in metadata
      if (typeof paymentMethod === 'string') {
        return paymentMethod;
      }
    }
    
    // Case 3: Fallback to provider-based detection
    const provider = invoice.payment.provider || '';
    switch (provider.toUpperCase()) {
      case 'TRANZAK':
        return 'Mobile Money';
      case 'STRIPE':
        return 'Credit/Debit Card';
      case 'MOCK':
        return 'Test Payment';
      default:
        return provider;
    }
  };

  const getStatus = () => {
    if (!invoice) return '';
    return invoice.payment?.status || invoice.status || '';
  };

  const getFormattedDate = () => {
    if (!invoice) return '';
    return new Date(invoice.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFormattedDateTime = () => {
    if (!invoice) return '';
    return new Date(invoice.date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceDescription = () => {
    if (!invoice) return 'Virtual Coins Package';
    
    if (invoice.isSubscription && invoice.subscriptionDetails) {
      return `${invoice.subscriptionDetails.planName} (${invoice.subscriptionDetails.interval})`;
    }
    
    return `${invoice.coins.toLocaleString()} Career Coins`;
  };

  const getServiceDetails = () => {
    if (!invoice) return 'Virtual currency for accessing premium career tools';
    
    if (invoice.isSubscription) {
      return `Recurring subscription plan including ${invoice.coins.toLocaleString()} coins per ${invoice.subscriptionDetails?.interval.toLowerCase()} for AI resume builder, cover letter generator, and professional growth features`;
    }
    
    return 'Virtual currency for accessing premium career tools, AI resume builder, cover letter generator, and professional growth features';
  };

  const getSubscriptionPeriod = () => {
    if (!invoice || !invoice.isSubscription || !invoice.subscriptionDetails) return null;
    
    const startDate = new Date(invoice.subscriptionDetails.periodStart).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const endDate = new Date(invoice.subscriptionDetails.periodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `Billing Period: ${startDate} - ${endDate}`;
  };

  const getThankYouMessage = () => {
    if (!invoice) return 'Thank you for your purchase!';
    
    if (invoice.isSubscription) {
      return 'Thank you for subscribing to Cverra!';
    }
    
    return 'Thank you for investing in your career success!';
  };

  const getCoinsMessage = () => {
    if (!invoice) return '';
    
    if (invoice.isSubscription) {
      return `Your ${invoice.coins.toLocaleString()} coins have been added and will renew automatically.`;
    }
    
    return `Your ${invoice.coins.toLocaleString()} Career Coins are ready to use for premium features.`;
  };

  const downloadInvoice = async () => {
    try {
      const response = await api.get(`/payments/invoice/${paymentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice?.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
      
      if (mode === 'download') {
        navigate(`/payments/invoice/${paymentId}`);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const printInvoice = () => {
    window.print();
  };

  // HTML-only view (minimal UI for printing/export)
  if (mode === 'html') {
    if (loading) {
      return <div>Loading invoice...</div>;
    }

    if (!invoice) {
      return <div>Invoice not found</div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 print:bg-white">
        <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:shadow-none">
          {/* Invoice Header */}
          <div className="border-b border-gray-300 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center print:bg-gradient-to-r print:from-gray-800 print:to-gray-600">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cverra</h1>
                  <p className="text-gray-600">Next-Gen Career Platform</p>
                  <p className="text-sm text-gray-500">Your Complete Career Success Suite</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                <p className="text-gray-600">Transaction #{getTransactionId()}</p>
                <p className="text-gray-600">Date: {getFormattedDate()}</p>
              </div>
            </div>
          </div>

          {/* From/To Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{companyInfo.name}</p>
                <p className="text-gray-600">{companyInfo.description}</p>
                <p className="text-gray-600">{companyInfo.email}</p>
                <p className="text-gray-600">{companyInfo.website}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">Customer since: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{getUserName()}</p>
                <p className="text-gray-600">{getUserEmail()}</p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">
              {invoice.isSubscription ? 'Subscription Details' : 'Service Details'}
            </h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-300">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{getServiceDescription()}</p>
                        <p className="text-gray-600 text-sm mt-1">
                          {getServiceDetails()}
                        </p>
                        {invoice.isSubscription && invoice.subscriptionDetails && (
                          <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">
                              Subscription Details:
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              • {invoice.coins.toLocaleString()} coins per {invoice.subscriptionDetails.interval.toLowerCase()}
                            </p>
                            <p className="text-sm text-blue-600">
                              • Billing period: {new Date(invoice.subscriptionDetails.periodStart).toLocaleDateString()} - {new Date(invoice.subscriptionDetails.periodEnd).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-blue-600">
                              • {invoice.subscriptionDetails.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} recurring payment
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {invoice.currency} {invoice.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Price:</span>
                  <span className="text-gray-900">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-semibold text-gray-900">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="w-32 h-32 bg-white flex items-center justify-center border border-gray-300">
                  <QrCodeIcon className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">Scan to verify</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Transaction ID:</p>
                <p className="font-semibold text-gray-900">{getTransactionId()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Date:</p>
                <p className="font-semibold text-gray-900">{getFormattedDateTime()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method:</p>
                <p className="font-semibold text-gray-900">{getPaymentMethod()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status:</p>
                <p className={`font-semibold ${
                  getStatus() === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {getStatus() === 'SUCCESS' ? 'Completed' : getStatus()}
                </p>
              </div>
              {invoice.isSubscription && (
                <>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Subscription Type:</p>
                    <p className="font-semibold text-blue-600">
                      Recurring {invoice.subscriptionDetails?.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} Billing
                    </p>
                  </div>
                  {invoice.subscriptionDetails && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Next Billing Date:</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(invoice.subscriptionDetails.periodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {getThankYouMessage()}
            </p>
            <p className="text-gray-600">
              {getCoinsMessage()}
            </p>
            <p className="text-gray-600 mt-2">
              Need help? Contact support: {companyInfo.email}
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Invoice generated on {getFormattedDateTime()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal view mode with header
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Invoice...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we load your invoice details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested invoice could not be found.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Action Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadInvoice}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download PDF
              </button>
              <button
                onClick={printInvoice}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Print
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <HomeIcon className="h-5 w-5" />
                Dashboard
              </button>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <Logo className="text-white" size={48} />
                  <div>
                    <h2 className="text-2xl font-bold">Cverra</h2>
                    <p className="text-blue-100">Next-Gen Career Platform</p>
                    <p className="text-blue-100 text-sm">Your Complete Career Success Suite</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{invoice.invoiceNumber}</p>
                  <p className="text-blue-100">Transaction #{getTransactionId()}</p>
                  <p className="text-blue-100">Date: {getFormattedDate()}</p>
                </div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-8">
              {/* From/To Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">From:</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">{companyInfo.name}</p>
                    <p className="text-gray-600 dark:text-gray-300">{companyInfo.description}</p>
                    <p className="text-gray-600 dark:text-gray-300">{companyInfo.email}</p>
                    <p className="text-gray-600 dark:text-gray-300">{companyInfo.website}</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Customer since: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">To:</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">{getUserName()}</p>
                    <p className="text-gray-600 dark:text-gray-300">{getUserEmail()}</p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                  {invoice.isSubscription ? 'Subscription Details' : 'Service Details'}
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div>
                            <p className="font-medium">{getServiceDescription()}</p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                              {getServiceDetails()}
                            </p>
                            {invoice.isSubscription && invoice.subscriptionDetails && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  Subscription Details:
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                  • {invoice.coins.toLocaleString()} coins per {invoice.subscriptionDetails.interval.toLowerCase()}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  • Billing period: {new Date(invoice.subscriptionDetails.periodStart).toLocaleDateString()} - {new Date(invoice.subscriptionDetails.periodEnd).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  • {invoice.subscriptionDetails.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} recurring payment
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                          {invoice.currency} {invoice.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary & QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service Price:</span>
                      <span className="text-gray-900 dark:text-white">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="text-gray-900 dark:text-white">$0.00</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-3">
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">Total:</span>
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <div className="w-40 h-40 bg-white dark:bg-gray-600 flex items-center justify-center border border-gray-300 dark:border-gray-500 rounded">
                      <QrCodeIcon className="h-20 w-20 text-gray-400 dark:text-gray-300" />
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-3">
                      Scan to verify transaction
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Transaction ID:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{getTransactionId()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Payment Date:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{getFormattedDateTime()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Payment Method:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{getPaymentMethod()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Status:</p>
                    <p className={`font-semibold ${
                      getStatus() === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {getStatus() === 'SUCCESS' ? 'Completed' : getStatus()}
                    </p>
                  </div>
                  {invoice.isSubscription && (
                    <>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Subscription Type:</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          Recurring {invoice.subscriptionDetails?.interval === 'MONTHLY' ? 'Monthly' : 'Annual'} Billing
                        </p>
                      </div>
                      {invoice.subscriptionDetails && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Next Billing Date:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(invoice.subscriptionDetails.periodEnd).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {getThankYouMessage()}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {getCoinsMessage()}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Need help? Contact support: {companyInfo.email}
                </p>
              </div>

              {/* Quick Links */}
              <div className="mt-6 flex justify-center gap-4">
                <a
                  href={`/payments/invoice/${paymentId}/html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  {invoice.isSubscription ? 'Manage Subscription' : 'Buy more coins'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Invoice generated on {getFormattedDateTime()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};