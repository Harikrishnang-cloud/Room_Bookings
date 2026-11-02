import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  requireReason = false,
  reasonPlaceholder = 'Please enter a reason...',
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantStyles = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
      iconBg: 'bg-rose-100 text-rose-600',
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    primary: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
  }[variant] || {
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    iconBg: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        <div className="p-4 sm:p-5 pb-safe">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className={`p-2.5 rounded-xl ${variantStyles.iconBg} shrink-0`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {message}
              </p>
            </div>
          </div>

          {requireReason && (
            <div className="mt-3.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Note
              </label>
              <textarea
                rows="2"
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          )}

          <div className="mt-5 sm:mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs min-h-[44px] flex items-center justify-center touch-manipulation ${variantStyles.btn}`}
            >
              {isSubmitting ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
