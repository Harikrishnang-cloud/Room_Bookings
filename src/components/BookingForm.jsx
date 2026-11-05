import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, User, Phone, DoorClosed, Clock, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import { validateBookingForm, checkBookingConflict } from '../utils/bookingValidation';
import { BOOKING_STATUSES, ROOM_STATUSES, computeRoomStatus } from '../utils/availability';
import { toDateTimeLocalValue, formatTime, formatDate } from '../utils/dateHelpers';

function getDurationHours(option, customVal, customUnit = 'days') {
  if (option === '3hr') return 3;
  if (option === '6hr') return 6;
  if (option === '1day') return 24;
  if (option === 'custom') {
    const val = parseFloat(customVal);
    if (isNaN(val) || val <= 0) return null;
    return customUnit === 'days' ? val * 24 : val;
  }
  return 24;
}

function getDurationLabel(option, customVal, customUnit = 'days') {
  if (option === '3hr') return '3 Hours';
  if (option === '6hr') return '6 Hours';
  if (option === '1day') return '1 Day';
  if (option === 'custom') {
    const val = parseFloat(customVal);
    if (!val || isNaN(val) || val <= 0) return 'Custom';
    if (customUnit === 'days') {
      if (val === 1) return '1 Day';
      if (val === 7) return '1 Week (7 Days)';
      if (val === 14) return '2 Weeks (14 Days)';
      return `${val} Days`;
    }
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

  // Form State: name, phone number, duration, payment method, room, and start time
  const [formData, setFormData] = useState({
    guestName: '',
    mobileNumber: '',
    roomId: '',
    durationOption: '1day',
    customHours: '2',
    customUnit: 'days', // 'days' | 'hours'
    paymentMethod: 'Cash',
    paymentMethodOther: '',
    isCustomCheckIn: false,
    customCheckInTime: toDateTimeLocalValue(new Date()),
  });

  const [errors, setErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(null);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let initialDurationOption = initialData.durationOption;
        let initialCustomHours = initialData.durationHours ? String(initialData.durationHours) : '2';
        let initialCustomUnit = 'days';

        if (!initialDurationOption && initialData.checkInDateTime && initialData.checkOutDateTime) {
          const diffHours = Math.round(
            (new Date(initialData.checkOutDateTime) - new Date(initialData.checkInDateTime)) / (1000 * 60 * 60)
          );
          if (diffHours === 3) initialDurationOption = '3hr';
          else if (diffHours === 6) initialDurationOption = '6hr';
          else if (diffHours === 24) initialDurationOption = '1day';
          else if (diffHours > 0 && diffHours % 24 === 0) {
            initialDurationOption = 'custom';
            initialCustomHours = String(diffHours / 24);
            initialCustomUnit = 'days';
          } else if (diffHours > 0) {
            initialDurationOption = 'custom';
            initialCustomHours = String(diffHours);
            initialCustomUnit = 'hours';
          }
        } else if (initialDurationOption === 'custom' && initialData.durationHours) {
          const dh = Number(initialData.durationHours);
          if (dh >= 24 && dh % 24 === 0) {
            initialCustomHours = String(dh / 24);
            initialCustomUnit = 'days';
          } else {
            initialCustomHours = String(dh);
            initialCustomUnit = 'hours';
          }
        }

        const rawPayment = initialData.paymentMethod || 'Cash';
        const isStandardMethod = rawPayment === 'Cash' || rawPayment === 'Gpay';

        setFormData({
          guestName: initialData.guestName || '',
          mobileNumber: initialData.mobileNumber || '',
          roomId: initialData.roomId || '',
          durationOption: initialDurationOption || '1day',
          customHours: initialCustomHours,
          customUnit: initialCustomUnit,
          paymentMethod: isStandardMethod ? rawPayment : 'Other',
          paymentMethodOther: isStandardMethod ? '' : (rawPayment === 'Other' ? (initialData.paymentMethodOther || '') : rawPayment),
          isCustomCheckIn: true,
          customCheckInTime: toDateTimeLocalValue(new Date(initialData.checkInDateTime)),
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
          customHours: '2',
          customUnit: 'days',
          paymentMethod: 'Cash',
          paymentMethodOther: '',
          isCustomCheckIn: false,
          customCheckInTime: toDateTimeLocalValue(new Date()),
        });
      }
      setErrors({});
      setConflictWarning(null);
      setConflictDetails(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedRoomId, rooms, bookings]);

  // Computed check-in and check-out dates
  const hours = getDurationHours(formData.durationOption, formData.customHours, formData.customUnit) || 24;
  const activeCheckIn = formData.isCustomCheckIn && formData.customCheckInTime
    ? new Date(formData.customCheckInTime)
    : (initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : new Date());
  const activeCheckOut = new Date(activeCheckIn.getTime() + hours * 60 * 60 * 1000);

  // Check conflict for selected room and computed duration
  useEffect(() => {
    if (!formData.roomId) {
      setConflictWarning(null);
      setConflictDetails(null);
      return;
    }

    const h = getDurationHours(formData.durationOption, formData.customHours, formData.customUnit);
    if (!h || h <= 0) {
      setConflictWarning(null);
      setConflictDetails(null);
      return;
    }

    const checkInDateTime = formData.isCustomCheckIn && formData.customCheckInTime
      ? new Date(formData.customCheckInTime)
      : (initialData?.checkInDateTime ? new Date(initialData.checkInDateTime) : new Date());
    const checkOutDateTime = new Date(checkInDateTime.getTime() + h * 60 * 60 * 1000);

    const result = checkBookingConflict({
      roomId: formData.roomId,
      checkInDateTime,
      checkOutDateTime,
      excludeBookingId: initialData?.id || null,
      existingBookings: bookings,
    });

    if (result.hasConflict) {
      setConflictWarning(result.message);
      setConflictDetails(result);
    } else {
      setConflictWarning(null);
      setConflictDetails(null);
    }
  }, [
    formData.roomId,
    formData.durationOption,
    formData.customHours,
    formData.customUnit,
    formData.isCustomCheckIn,
    formData.customCheckInTime,
    bookings,
    initialData,
  ]);

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
        setErrors((prev) => ({ ...prev, duration: `Please enter a valid number of ${formData.customUnit || 'days'}` }));
        toast.error(`Please enter a valid number of ${formData.customUnit || 'days'}`);
        return;
      }
    }

    const checkIn = activeCheckIn;
    const checkOut = activeCheckOut;
    const durationLabel = getDurationLabel(formData.durationOption, formData.customHours, formData.customUnit);
    const effectivePaymentMethod =
      formData.paymentMethod === 'Other' && formData.paymentMethodOther.trim()
        ? formData.paymentMethodOther.trim()
        : formData.paymentMethod;

    const submissionPayload = {
      guestName: formData.guestName,
      mobileNumber: formData.mobileNumber,
      roomId: formData.roomId,
      durationOption: formData.durationOption,
      durationHours: hours,
      durationLabel,
      paymentMethod: effectivePaymentMethod,
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

          {/* Conflict Alert with Quick Resolution */}
          {conflictWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs font-medium space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-950">Room Already Booked For This Time</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">{conflictWarning}</p>
                </div>
              </div>

              {/* Quick Actions to solve the conflict */}
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/80 flex-wrap">
                {conflictDetails?.availableAfter && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        isCustomCheckIn: true,
                        customCheckInTime: toDateTimeLocalValue(conflictDetails.availableAfter),
                      }));
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors flex items-center gap-1 min-h-[30px]"
                  >
                    <span>Schedule from {formatTime(conflictDetails.availableAfter)}</span>
                  </button>
                )}
                {rooms.some(
                  (r) =>
                    r.id !== formData.roomId &&
                    computeRoomStatus(r, bookings, activeCheckIn).status === ROOM_STATUSES.AVAILABLE
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      const freeRoom = rooms.find(
                        (r) =>
                          r.id !== formData.roomId &&
                          computeRoomStatus(r, bookings, activeCheckIn).status === ROOM_STATUSES.AVAILABLE
                      );
                      if (freeRoom) handleChange('roomId', freeRoom.id);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors min-h-[30px]"
                  >
                    Switch to available room
                  </button>
                )}
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
                {getDurationLabel(formData.durationOption, formData.customHours, formData.customUnit)}
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

            {/* Custom Duration (Days or Hours) with Multi-Day / Week Presets */}
            {formData.durationOption === 'custom' && (
              <div className="mt-2.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Input + Unit Selector */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max={formData.customUnit === 'days' ? 365 : 720}
                      step="1"
                      placeholder={formData.customUnit === 'days' ? 'Enter days (e.g. 3, 7)' : 'Enter hours (e.g. 4, 12)'}
                      value={formData.customHours}
                      onChange={(e) => handleChange('customHours', e.target.value)}
                      className={`w-full px-3 py-2 text-base sm:text-sm bg-slate-50 focus:bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[42px] ${
                        errors.duration ? 'border-rose-400' : 'border-slate-200'
                      }`}
                      autoFocus
                    />
                  </div>

                  {/* Unit toggle: Days vs Hours */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customUnit: 'days',
                          customHours: prev.customUnit === 'hours' && Number(prev.customHours) > 30 ? '2' : prev.customHours,
                        }));
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        formData.customUnit === 'days'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customUnit: 'hours',
                          customHours: prev.customUnit === 'days' && Number(prev.customHours) > 24 ? '4' : prev.customHours,
                        }));
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        formData.customUnit === 'hours'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Hours
                    </button>
                  </div>
                </div>

                {/* Quick Shortcuts: Dynamically changes between Days and Hours */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                  {(formData.customUnit === 'days'
                    ? [
                        { label: '2 Days', val: '2' },
                        { label: '3 Days', val: '3' },
                        { label: '5 Days', val: '5' },
                        { label: '1 Week', val: '7' },
                        { label: '2 Weeks', val: '14' },
                      ]
                    : [
                        { label: '2 hr', val: '2' },
                        { label: '4 hr', val: '4' },
                        { label: '8 hr', val: '8' },
                        { label: '12 hr', val: '12' },
                      ]
                  ).map((preset) => {
                    const isPresetActive = formData.customHours === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            customHours: preset.val,
                          }));
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          isPresetActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {errors.duration && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.duration}</p>
                )}
              </div>
            )}

            {/* Live Computed Time Period Preview */}
            <div className="mt-2.5 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Time Period
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {getDurationLabel(formData.durationOption, formData.customHours, formData.customUnit)}
                </span>
              </div>

              {/* Check-In -> Check-Out Display */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Check-In</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                    {formatTime(activeCheckIn)}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {formatDate(activeCheckIn, 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 block uppercase">Check-Out</span>
                  <span className="font-bold text-emerald-800 text-xs sm:text-sm block">
                    {formatTime(activeCheckOut)}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {formatDate(activeCheckOut, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>

              {/* Start Time Option: Start Now vs Schedule for specific time */}
              <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={formData.isCustomCheckIn}
                    onChange={(e) => handleChange('isCustomCheckIn', e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span>Schedule specific start time</span>
                </label>
                {!formData.isCustomCheckIn && (
                  <span className="text-[11px] text-slate-400 font-medium">Starting now</span>
                )}
              </div>

              {formData.isCustomCheckIn && (
                <div className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Check-in Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.customCheckInTime}
                    onChange={(e) => handleChange('customCheckInTime', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[40px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4. Payment Method (Cash, Gpay, Other) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                Payment Method <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {formData.paymentMethod === 'Other' && formData.paymentMethodOther.trim()
                  ? formData.paymentMethodOther.trim()
                  : formData.paymentMethod}
              </span>
            </label>

            {/* Checkbox chips: Cash, Gpay, Other */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Cash', label: 'Cash' },
                { id: 'Gpay', label: 'Gpay' },
                { id: 'Other', label: 'Other' },
              ].map((opt) => {
                const isSelected = formData.paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange('paymentMethod', opt.id)}
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

            {/* Custom Input Box if 'Other' is selected */}
            {formData.paymentMethod === 'Other' && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  type="text"
                  placeholder="Specify payment method (e.g. PhonePe, Card)"
                  value={formData.paymentMethodOther}
                  onChange={(e) => handleChange('paymentMethodOther', e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* 5. Assigned Room */}
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
                  const statusInfo = computeRoomStatus(r, bookings, activeCheckIn);
                  const active = statusInfo.activeBooking;
                  let availText = 'Available Now';
                  if (active) {
                    availText = `Occupied until ${formatTime(active.checkOutDateTime)} (Free after)`;
                  } else if (statusInfo.upcomingBooking) {
                    availText = `Free until ${formatTime(statusInfo.upcomingBooking.checkInDateTime)}`;
                  } else if (statusInfo.status === ROOM_STATUSES.CLEANING) {
                    availText = 'Cleaning in progress';
                  }
                  return (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} {r.roomName ? `• ${r.roomName}` : ''} • {availText}
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
