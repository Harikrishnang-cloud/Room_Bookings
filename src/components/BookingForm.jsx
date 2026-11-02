import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Calendar, Clock, AlertTriangle, User, Phone, DollarSign, FileText, Users } from 'lucide-react';
import {
  toDateInputValue,
  toTimeInputValue,
  combineDateAndTime,
} from '../utils/dateHelpers';
import { validateBookingForm, checkBookingConflict } from '../utils/bookingValidation';
import { BOOKING_STATUSES } from '../utils/availability';

export default function BookingForm({
  isOpen,
  onClose,
  onSubmit,
  rooms = [],
  bookings = [],
  initialData = null,
  preselectedRoomId = null,
}) {
  const isEditing = Boolean(initialData && initialData.id);

  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    mobileNumber: '',
    roomId: '',
    checkInDate: toDateInputValue(new Date()),
    checkInTime: '12:00',
    checkOutDate: toDateInputValue(new Date(Date.now() + 86400000)), // tomorrow
    checkOutTime: '11:00',
    numberOfGuests: 1,
    bookingAmount: '',
    advanceAmount: '',
    notes: '',
    bookingStatus: BOOKING_STATUSES.CONFIRMED,
  });

  const [errors, setErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          guestName: initialData.guestName || '',
          mobileNumber: initialData.mobileNumber || '',
          roomId: initialData.roomId || '',
          checkInDate: toDateInputValue(initialData.checkInDateTime),
          checkInTime: toTimeInputValue(initialData.checkInDateTime),
          checkOutDate: toDateInputValue(initialData.checkOutDateTime),
          checkOutTime: toTimeInputValue(initialData.checkOutDateTime),
          numberOfGuests: initialData.numberOfGuests || 1,
          bookingAmount: initialData.bookingAmount ?? '',
          advanceAmount: initialData.advanceAmount ?? '',
          notes: initialData.notes || '',
          bookingStatus: initialData.bookingStatus || BOOKING_STATUSES.CONFIRMED,
        });
      } else {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          guestName: '',
          mobileNumber: '',
          roomId: preselectedRoomId || (rooms.length > 0 ? rooms[0].id : ''),
          checkInDate: toDateInputValue(today),
          checkInTime: '12:00',
          checkOutDate: toDateInputValue(tomorrow),
          checkOutTime: '11:00',
          numberOfGuests: 1,
          bookingAmount: '',
          advanceAmount: '',
          notes: '',
          bookingStatus: BOOKING_STATUSES.CONFIRMED,
        });
      }
      setErrors({});
      setConflictWarning(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedRoomId, rooms]);

  // Real-time conflict validation effect
  useEffect(() => {
    if (!formData.roomId || !formData.checkInDate || !formData.checkOutDate) {
      setConflictWarning(null);
      return;
    }

    const checkInDateTime = combineDateAndTime(formData.checkInDate, formData.checkInTime);
    const checkOutDateTime = combineDateAndTime(formData.checkOutDate, formData.checkOutTime);

    if (!checkInDateTime || !checkOutDateTime || checkInDateTime >= checkOutDateTime) {
      setConflictWarning(null);
      return;
    }

    const result = checkBookingConflict({
      roomId: formData.roomId,
      checkInDateTime,
      checkOutDateTime,
      excludeBookingId: initialData?.id || null,
      existingBookings: bookings,
    });

    if (result.hasConflict) {
      setConflictWarning(result.message);
    } else {
      setConflictWarning(null);
    }
  }, [
    formData.roomId,
    formData.checkInDate,
    formData.checkInTime,
    formData.checkOutDate,
    formData.checkOutTime,
    bookings,
    initialData,
  ]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const checkInDateTime = combineDateAndTime(formData.checkInDate, formData.checkInTime);
    const checkOutDateTime = combineDateAndTime(formData.checkOutDate, formData.checkOutTime);

    const submissionPayload = {
      guestName: formData.guestName,
      mobileNumber: formData.mobileNumber,
      roomId: formData.roomId,
      checkInDateTime,
      checkOutDateTime,
      numberOfGuests: Number(formData.numberOfGuests),
      bookingAmount: Number(formData.bookingAmount) || 0,
      advanceAmount: Number(formData.advanceAmount) || 0,
      notes: formData.notes,
      bookingStatus: formData.bookingStatus,
    };

    const validation = validateBookingForm(submissionPayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    if (conflictWarning) {
      setErrors((prev) => ({ ...prev, dates: conflictWarning }));
      toast.error(conflictWarning);
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedRoom = rooms.find((r) => r.id === formData.roomId);
      await onSubmit(submissionPayload, selectedRoom?.roomNumber || '');
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message }));
      toast.error(err.message || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Booking' : 'New Room Booking'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {isEditing ? 'Update guest or reservation details' : 'Reserve an apartment room'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 touch-scroll pb-safe">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Conflict Alert */}
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Booking Date Conflict</p>
                <p>{conflictWarning}</p>
              </div>
            </div>
          )}

          {/* Guest Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Guest Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.guestName}
                  onChange={(e) => handleChange('guestName', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px] ${
                    errors.guestName ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.guestName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.guestName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-0199"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px] ${
                    errors.mobileNumber ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.mobileNumber}</p>
              )}
            </div>
          </div>

          {/* Room Selection & Number of Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Selection <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.roomId}
                onChange={(e) => handleChange('roomId', e.target.value)}
                className={`w-full px-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px] ${
                  errors.roomId ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select a room...</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} {r.roomName ? `• ${r.roomName}` : ''}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.roomId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Guests <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.numberOfGuests}
                  onChange={(e) => handleChange('numberOfGuests', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Check-In Details */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Check-In Schedule
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.checkInDate}
                  onChange={(e) => handleChange('checkInDate', e.target.value)}
                  className="w-full px-2.5 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[40px] sm:min-h-[34px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.checkInTime}
                  onChange={(e) => handleChange('checkInTime', e.target.value)}
                  className="w-full px-2.5 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[40px] sm:min-h-[34px]"
                />
              </div>
            </div>
          </div>

          {/* Check-Out Details */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Check-Out Schedule
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.checkOutDate}
                  onChange={(e) => handleChange('checkOutDate', e.target.value)}
                  className="w-full px-2.5 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[40px] sm:min-h-[34px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.checkOutTime}
                  onChange={(e) => handleChange('checkOutTime', e.target.value)}
                  className="w-full px-2.5 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[40px] sm:min-h-[34px]"
                />
              </div>
            </div>
          </div>

          {/* Amounts: Booking Amount & Advance */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.bookingAmount}
                  onChange={(e) => handleChange('bookingAmount', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advance ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.advanceAmount}
                  onChange={(e) => handleChange('advanceAmount', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Special Requests (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows="2"
                placeholder="Any special requests, arrival notes..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 pb-1 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(conflictWarning)}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors shadow-xs min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
