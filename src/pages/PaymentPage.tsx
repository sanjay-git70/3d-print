import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { StepProgress } from '../components/common/StepProgress';
import { UPIQRCodeDisplay } from '../components/order/UPIQRCodeDisplay';
import { OrderSummaryCard } from '../components/order/OrderSummaryCard';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { Order } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Hash,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const stateData = location.state as
    | {
        orderId?: string;
        orderNumber?: string;
        totalAmount?: number;
        productName?: string;
        product?: any;
        customer?: any;
        customization?: any;
      }
    | undefined;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadOrderData = async () => {
      if (stateData?.orderId) {
        const found = await orderService.getById(stateData.orderId);
        if (found) {
          setOrder(found);
          setLoading(false);
          return;
        }
      }

      // If no state passed (e.g. direct refresh), fetch latest order
      const allOrders = await orderService.getAll();
      if (allOrders.length > 0) {
        setOrder(allOrders[0]);
      }
      setLoading(false);
    };

    loadOrderData();
  }, [stateData]);

  if (loading || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Submit payment details directly without requiring screenshot
      await paymentService.submitPaymentProof({
        orderId: order.id,
        amount: order.total_amount,
        transactionId: transactionId.trim() || `UPI-${Date.now().toString().slice(-6)}`,
        upiId: 'printlab3d@okhdfcbank',
      });

      // 2. Set order status to PAYMENT_CONFIRMED / PENDING_PAYMENT_VERIFICATION
      await orderService.updateStatus(order.id, 'PAYMENT_CONFIRMED');

      showToast('Payment confirmed! Your 3D print order is in queue.', 'success');

      // 3. Navigate straight to Order Tracking page
      navigate(`/track?order=${order.order_number}`, {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
        },
      });
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      showToast('Failed to confirm payment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSampleUtr = () => {
    const randomUtr = `409${Math.floor(100000000 + Math.random() * 900000000)}`;
    setTransactionId(randomUtr);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Progress */}
      <StepProgress currentStep="payment" />

      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: UPI QR Code & Instant Confirmation */}
        <div className="lg:col-span-7 space-y-6">
          <UPIQRCodeDisplay
            amount={order.total_amount}
            orderNumber={order.order_number}
            productName={order.product?.name || '3D Print Model'}
          />

          {/* Instant Payment Confirmation Form */}
          <form
            onSubmit={handleConfirmPayment}
            className="bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm dark:shadow-xl"
          >
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Payment Confirmation</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="utr-input" className="text-xs font-mono text-slate-700 dark:text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> UPI Reference / UTR Number{' '}
                  <span className="text-slate-400 dark:text-neutral-500 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSampleUtr}
                  className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Fill UTR
                </button>
              </div>

              <input
                id="utr-input"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 409823419082 or leave empty"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                You can paste the 12-digit UPI reference ID from Google Pay / PhonePe for faster processing.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Confirming Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid — Track My Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Order Breakdown Summary & Status Note */}
        <div className="lg:col-span-5 space-y-6">
          {order.product && (
            <OrderSummaryCard
              product={order.product}
              quantity={order.quantity}
              customization={order.customization}
              customer={order.customer}
            />
          )}

          {/* Safe & Instant Handover Notice */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-400 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 font-semibold font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Instant Processing
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-neutral-400">
              Your 3D model queue position is secured immediately upon confirmation. You can track slice status, print progress, and delivery updates live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
