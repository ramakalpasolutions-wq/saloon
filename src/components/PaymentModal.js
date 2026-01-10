'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useToast } from '@/components/Toast';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  customerName, 
  customerPhone, 
  salonName,
  checkinId,
  onSuccess,
  onSkip
}) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setLoading(true);
    toast.info('Initializing payment...');

    try {
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          customerName,
          customerPhone,
          salonName,
          receipt: `checkin_${checkinId}`,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: salonName || 'Salon Booking',
        description: 'Service Payment',
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        theme: {
          color: '#10b981',
        },
        handler: async function (response) {
          toast.info('Verifying payment...');
          
          try {
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                checkinId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // ✅ Replace alert with toast
              toast.success(`🎉 Payment successful! ₹${amount} paid. Booking confirmed!`);
              
              if (onSuccess) onSuccess(verifyData);
              onClose();
            } else {
              toast.error('Payment verification failed! Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification error! Please contact support.');
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.warning('Payment cancelled! You can pay later at the salon.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        toast.error(`Payment failed! ${response.error.description || 'Please try again'}`);
        console.error('Payment failed:', response.error);
      });

      razorpay.open();
      setLoading(false);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setRazorpayLoaded(true);
        }}
        onError={() => {
          toast.error('Failed to load payment system');
        }}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div className="text-5xl mb-3">💳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
            <p className="text-gray-600">Secure your booking with online payment</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-900">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salon:</span>
                <span className="font-semibold text-gray-900">{salonName}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                <span className="text-gray-900 font-bold">Amount:</span>
                <span className="text-green-600 font-bold text-xl">₹{amount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                loading || !razorpayLoaded
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : !razorpayLoaded ? (
                'Loading Payment System...'
              ) : (
                `Pay ₹${amount}`
              )}
            </button>

            {onSkip && (
              <button
                onClick={() => {
                  onSkip();
                  toast.info('You can pay at the salon after service');
                }}
                className="w-full py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Pay at Salon
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </>
  );
}
