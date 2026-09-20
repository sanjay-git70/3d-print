import React from 'react';
import { OrderStatus, PaymentStatus } from '../../types';
import { Clock, CheckCircle, AlertTriangle, Printer, PackageCheck, Check, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type?: 'order' | 'payment';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (type === 'payment') {
    switch (status as PaymentStatus) {
      case 'PENDING':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
            <Clock className="w-3 h-3" />
            Payment Pending
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${sizeClasses}`}>
            <Clock className="w-3 h-3 animate-pulse" />
            Proof Submitted
          </span>
        );
      case 'VERIFIED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
            <Check className="w-3 h-3" />
            Payment Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
            <XCircle className="w-3 h-3" />
            Payment Rejected
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3" />
            Flagged for Review
          </span>
        );
      default:
        return null;
    }
  }

  // Order status
  switch (status as OrderStatus) {
    case 'PENDING_PAYMENT':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <Clock className="w-3 h-3" />
          Awaiting Payment
        </span>
      );
    case 'PENDING_PAYMENT_VERIFICATION':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3" />
          Pending Verification
        </span>
      );
    case 'PAYMENT_VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <CheckCircle className="w-3 h-3" />
          Payment Verified
        </span>
      );
    case 'PRINTING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ${sizeClasses}`}>
          <Printer className="w-3 h-3 animate-bounce" />
          In Production (3D Printing)
        </span>
      );
    case 'READY_FOR_PICKUP':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
          <PackageCheck className="w-3 h-3" />
          Ready for Stall Pickup
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 ${sizeClasses}`}>
          <Check className="w-3 h-3" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
};
