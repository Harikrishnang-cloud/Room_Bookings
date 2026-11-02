import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, User, Phone, DoorClosed, AlertTriangle } from 'lucide-react';
import { validateBookingForm, checkBookingConflict } from '../utils/bookingValidation';
import { BOOKING_STATUSES, ROOM_STATUSES, computeRoomStatus } from '../utils/availability';

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

  // Form State: only name, phone number, and assigned room
  const [formData, setFormData] = useState({
    guestName: '',
    mobileNumber: '',
    roomId: '',
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
        });
      } else {
        // Pick preselected room or first available room, or first room
        let defaultRoomId = preselectedRoomId;
        if (!defaultRoomId && rooms.length > 0) {
          const firstAvailable = rooms.find((r) => {
            const st = computeRoomStatus(r, bookings, new Date());
            return st.status === ROOM_STATUSES.AVAILABLE;
          });
          defaultRoomId = firstAvailable ? firstAvailable.id : rooms[0].id;
        }

        setFormData({
          guestName: '',
          mobileNumber: '',
          roomId: defaultRoomId || '',
        });
      }
      setErrors({});
      setConflictWarning(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedRoomId, rooms, bookings]);

  // Check conflict for selected room
  useEffect(() => {
    if (!formData.roomId) {
      setConflictWarning(null);
      return;
    }

    const checkInDateTime = initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : new Date();
    const checkOutDateTime = initialData?.checkOutDateTime
      ? new Date(initialData.checkOutDateTime)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later

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
  }, [formData.roomId, bookings, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Default dates: check-in is now, check-out is tomorrow noon
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);

    const submissionPayload = {
      guestName: formData.guestName,
      mobileNumber: formData.mobileNumber,
      roomId: formData.roomId,
      checkInDateTime: initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : now,
      checkOutDateTime: initialData?.checkOutDateTime ? new Date(initialData.checkOutDateTime) : tomorrow,
      numberOfGuests: initialData?.numberOfGuests || 1,
      bookingAmount: initialData?.bookingAmount || 0,
      advanceAmount: initialData?.advanceAmount || 0,
      notes: initialData?.notes || '',
      bookingStatus: initialData?.bookingStatus || BOOKING_STATUSES.CONFIRMED,
    };

    const validation = validateBookingForm(submissionPayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    if (conflictWarning) {
      setErrors((prev) => ({ ...prev, form: conflictWarning }));
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
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Booking' : 'New Room Booking'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Enter guest name, phone, and assign room
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

        {/* Modal Body - Clean & Minimal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto touch-scroll pb-safe">
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
                <p className="font-bold">Room Already Booked</p>
                <p>{conflictWarning}</p>
              </div>
            </div>
          )}

          {/* 1. Guest Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Guest Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter guest full name"
                value={formData.guestName}
                onChange={(e) => handleChange('guestName', e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] ${
                  errors.guestName ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.guestName && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.guestName}</p>
            )}
          </div>

          {/* 2. Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] ${
                  errors.mobileNumber ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.mobileNumber}</p>
            )}
          </div>

          {/* 3. Assigned Room */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assigned Room <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DoorClosed className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                required
                value={formData.roomId}
                onChange={(e) => handleChange('roomId', e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] ${
                  errors.roomId ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select a room...</option>
                {rooms.map((r) => {
                  const roomStatus = computeRoomStatus(r, bookings, new Date()).status;
                  const isAvailable = roomStatus === ROOM_STATUSES.AVAILABLE;
                  return (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} {r.roomName ? `• ${r.roomName}` : ''} {!isAvailable ? `(${roomStatus})` : '• Available'}
                    </option>
                  );
                })}
              </select>
            </div>
            {errors.roomId && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.roomId}</p>
            )}
          </div>

          {/* Form Actions */}
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
