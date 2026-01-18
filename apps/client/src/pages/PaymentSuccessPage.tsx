// src/pages/PaymentSuccessPage.tsx
import { t } from "@lingui/macro";
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import api from '@/client/api/axios';
import { useUser } from '@/client/services/user';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PaymentStatus {
  status: 'success' | 'failed' | 'pending';
  paymentId?: string;
  amount?: number;
  coins?: number;
  transactionId?: string;
  message?: string;
}

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const requestId = searchParams.get('requestId');
  const transactionId = searchParams.get('transactionId');
  const success = searchParams.get('success');
  const mock = searchParams.get('mock');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        
        // If it's a mock payment, show success immediately
        if (mock === 'true') {
          setPaymentStatus({
            status: 'success',
            transactionId: transactionId || 'MOCK_TX',
            amount: 100, // Default amount for mock
            coins: 50, // Default coins for mock
            message: t`Mock payment completed successfully`
          });
          setLoading(false);
          return;
        }

        // Verify real payment with backend
        const response = await api.get('/payments/verify', {
          params: {
            provider: 'TRANZAK',
            ref: requestId || transactionId
          }
        });

        const paymentData = response.data;

        if (paymentData.status === 'SUCCESS') {
          // FIX: Use nullish coalescing and provide fallback values
          const effectiveTransactionId = requestId || transactionId || paymentData.transactionId || 'Unknown';
          
          setPaymentStatus({
            status: 'success',
            paymentId: paymentData.paymentId,
            amount: paymentData.amount,
            coins: paymentData.coinsGranted,
            transactionId: effectiveTransactionId, // Now this is always a string
            message: t`Payment completed successfully!`
          });
          
          toast.success(t`Payment completed successfully!`);
          
          // Redirect to invoice after 5 seconds
          setTimeout(() => {
            if (paymentData.paymentId) {
              navigate(`/payments/invoice/${paymentData.paymentId}`);
            }
          }, 5000);
          
        } else if (paymentData.status === 'FAILED') {
          setPaymentStatus({
            status: 'failed',
            message: paymentData.error || t`Payment failed. Please try again.`
          });
          toast.error(t`Payment failed. Please try again.`);
        } else {
          setPaymentStatus({
            status: 'pending',
            message: t`Payment is being processed...`
          });
        }

      } catch (error: any) {
        console.error('Payment verification failed:', error);
        setPaymentStatus({
          status: 'failed',
          message: t`Failed to verify payment. Please contact support.`
        });
        toast.error(t`Payment verification failed.`);
      } finally {
        setLoading(false);
      }
    };

    if (requestId || transactionId || mock === 'true') {
      verifyPayment();
    } else {
      setPaymentStatus({
        status: 'failed',
        message: t`Invalid payment response. Missing transaction details.`
      });
      setLoading(false);
    }
  }, [requestId, transactionId, mock, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t`Verifying Payment...`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t`Please wait while we confirm your payment.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          {paymentStatus?.status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Payment Successful!`}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {paymentStatus.message}
              </p>
              
              {paymentStatus.amount && paymentStatus.coins && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">{t`Amount:`}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${paymentStatus.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t`Coins Received:`}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {paymentStatus.coins.toLocaleString()} {t`coins`}
                    </span>
                  </div>
                  {paymentStatus.transactionId && paymentStatus.transactionId !== 'Unknown' && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">{t`Transaction ID:`}</span>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {paymentStatus.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard/pricing')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {t`Buy More Coins`}
                </button>
                {paymentStatus.paymentId && (
                  <button
                    onClick={() => navigate(`/payments/invoice/${paymentStatus.paymentId}`)}
                    className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    {t`View Invoice`}
                  </button>
                )}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2 font-medium"
                >
                  {t`Go to Dashboard`}
                </button>
              </div>
            </>
          )}

          {paymentStatus?.status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Payment Failed`}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {paymentStatus.message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard/pricing')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {t`Try Again`}
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {t`Contact Support`}
                </button>
              </div>
            </>
          )}

          {paymentStatus?.status === 'pending' && (
            <>
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Processing Payment`}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {paymentStatus.message}
              </p>
              <div className="animate-pulse bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  {t`⚠️ Your payment is being processed. This may take a few minutes.
                  You will receive a notification when it's completed.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {t`Go to Dashboard`}
              </button>
            </>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t`Need help?`} <a href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">{t`Contact Support`}</a>
          </p>
        </div>
      </div>
    </div>
  );
};