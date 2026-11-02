import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, User, Phone, DoorClosed, Clock, AlertTriangle } from 'lucide-react';
import { validateBookingForm, checkBookingConflict } from '../utils/bookingValidation';
import { BOOKING_STATUSES, ROOM_STATUSES, computeRoomStatus } from '../utils/availability';

function getDurationHours(option, customVal) {
  if (option === '3hr') return 3;
  if (option === '6hr') return 6;
  if (option === '1day') return 24;
  if (option === 'custom') {
    const val = parseFloat(customVal);
    return isNaN(val) || val <= 0 ? null : val;
  }
  return 24;
}

function getDurationLabel(option, customVal) {
  if (option === '3hr') return '3 Hours';
  if (option === '6hr') return '6 Hours';
  if (option === '1day') return '1 Day';
  if (option === 'custom') {
    const val = parseFloat(customVal);
    if (!val || isNaN(val) || val <= 0) return 'Custom';
    return val === 1 ? '1 Hour' : `${val} Hours`;
  }
  return '1 Day';
}

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

  // Form State: name, phone number, time duration (3hr, 6hr, 1 day, custom), and assigned room
  const [formData, setFormData] = useState({
    guestName: '',
    mobileNumber: '',
    roomId: '',
    durationOption: '1day',
    customHours: '',
  });

  const [errors, setErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let initialDurationOption = initialData.durationOption;
        let initialCustomHours = initialData.durationHours ? String(initialData.durationHours) : '';

        if (!initialDurationOption && initialData.checkInDateTime && initialData.checkOutDateTime) {
          const diffHours = Math.round(
            (new Date(initialData.checkOutDateTime) - new Date(initialData.checkInDateTime)) / (1000 * 60 * 60)
          );
          if (diffHours === 3) initialDurationOption = '3hr';
          else if (diffHours === 6) initialDurationOption = '6hr';
          else if (diffHours === 24) initialDurationOption = '1day';
          else if (diffHours > 0) {
            initialDurationOption = 'custom';
            initialCustomHours = String(diffHours);
          }
        }

        setFormData({
          guestName: initialData.guestName || '',
          mobileNumber: initialData.mobileNumber || '',
          roomId: initialData.roomId || '',
          durationOption: initialDurationOption || '1day',
          customHours: initialCustomHours,
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
          durationOption: '1day',
          customHours: '',
        });
      }
      setErrors({});
      setConflictWarning(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedRoomId, rooms, bookings]);

  // Check conflict for selected room and computed duration
  useEffect(() => {
    if (!formData.roomId) {
      setConflictWarning(null);
      return;
    }

    const hours = getDurationHours(formData.durationOption, formData.customHours);
    if (!hours || hours <= 0) {
      setConflictWarning(null);
      return;
    }

    const checkInDateTime = initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : new Date();
    const checkOutDateTime = new Date(checkInDateTime.getTime() + hours * 60 * 60 * 1000);

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
  }, [formData.roomId, formData.durationOption, formData.customHours, bookings, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || (field === 'durationOption' && errors.duration)) {
      setErrors((prev) => ({ ...prev, [field]: null, duration: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.durationOption === 'custom') {
      const hoursVal = parseFloat(formData.customHours);
      if (!hoursVal || isNaN(hoursVal) || hoursVal <= 0) {
        setErrors((prev) => ({ ...prev, duration: 'Please enter a valid number of hours' }));
        toast.error('Please enter valid custom hours');
        return;
      }
    }

    const hours = getDurationHours(formData.durationOption, formData.customHours) || 24;
    const now = new Date();
    const checkIn = initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : now;
    const checkOut = new Date(checkIn.getTime() + hours * 60 * 60 * 1000);
    const durationLabel = getDurationLabel(formData.durationOption, formData.customHours);

    const submissionPayload = {
      guestName: formData.guestName,
      mobileNumber: formData.mobileNumber,
      roomId: formData.roomId,
      durationOption: formData.durationOption,
      durationHours: hours,
      durationLabel,
      checkInDateTime: checkIn,
      checkOutDateTime: checkOut,
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

          {/* 3. Duration / Time Selection (3hr, 6hr, 1 day, custom) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duration <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {getDurationLabel(formData.durationOption, formData.customHours)}
              </span>
            </label>

            {/* Checkbox options: 3hr, 6hr, 1 day, custom */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '3hr', label: '3hr' },
                { id: '6hr', label: '6hr' },
                { id: '1day', label: '1 day' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => {
                const isSelected = formData.durationOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange('durationOption', opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all touch-manipulation min-h-[44px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500 font-bold'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer pointer-events-none"
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Input Box if 'custom' is selected */}
            {formData.durationOption === 'custom' && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    step="1"
                    placeholder="Enter custom duration (e.g. 4, 12, 48)"
                    value={formData.customHours}
                    onChange={(e) => handleChange('customHours', e.target.value)}
                    className={`w-full pl-3 pr-14 py-2.5 text-base sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] ${
                      errors.duration ? 'border-rose-400' : 'border-slate-200'
                    }`}
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    hours
                  </span>
                </div>
                {errors.duration && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.duration}</p>
                )}
              </div>
            )}
          </div>

          {/* 4. Assigned Room */}
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
