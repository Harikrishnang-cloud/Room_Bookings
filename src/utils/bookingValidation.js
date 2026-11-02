import { toDate } from './dateHelpers';
import { doIntervalsOverlap, BOOKING_STATUSES } from './availability';

/**
 * Validates booking input fields
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateBookingForm(data) {
  const errors = {};

  if (!data.guestName || !data.guestName.trim()) {
    errors.guestName = 'Guest name is required';
  }

  if (!data.mobileNumber || !data.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else {
    // Validate phone number (digits, spaces, hyphens, plus)
    const cleaned = data.mobileNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
      errors.mobileNumber = 'Please enter a valid mobile number (7-15 digits)';
    }
  }

  if (!data.roomId) {
    errors.roomId = 'Please select a room';
  }

  const checkIn = toDate(data.checkInDateTime);
  const checkOut = toDate(data.checkOutDateTime);

  if (!checkIn) {
    errors.checkInDateTime = 'Check-in date & time is required';
  }

  if (!checkOut) {
    errors.checkOutDateTime = 'Check-out date & time is required';
  }

  if (checkIn && checkOut) {
    if (checkIn.getTime() >= checkOut.getTime()) {
      errors.checkOutDateTime = 'Check-out must be after check-in';
    }
  }

  const guests = Number(data.numberOfGuests);
  if (!guests || guests < 1) {
    errors.numberOfGuests = 'Number of guests must be at least 1';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Checks if a booking time interval conflicts with any existing booking for the room.
 * Excludes the booking being edited if excludeBookingId is provided.
 * Cancelled bookings do not conflict.
 * 
 * @param {Object} params
 * @param {string} params.roomId
 * @param {Date|string} params.checkInDateTime
 * @param {Date|string} params.checkOutDateTime
 * @param {string} [params.excludeBookingId]
 * @param {Array} params.existingBookings
 * @returns {{ hasConflict: boolean, conflictingBooking: Object|null, message: string|null }}
 */
export function checkBookingConflict({
  roomId,
  checkInDateTime,
  checkOutDateTime,
  excludeBookingId = null,
  existingBookings = [],
}) {
  const checkIn = toDate(checkInDateTime);
  const checkOut = toDate(checkOutDateTime);

  if (!roomId || !checkIn || !checkOut) {
    return { hasConflict: false, conflictingBooking: null, message: null };
  }

  const conflicting = existingBookings.find((b) => {
    // Same room only
    if (b.roomId !== roomId) return false;
    // Exclude self if editing
    if (excludeBookingId && b.id === excludeBookingId) return false;
    // Cancelled bookings do not conflict
    if (b.bookingStatus === BOOKING_STATUSES.CANCELLED) return false;

    const bCheckIn = toDate(b.checkInDateTime);
    const bCheckOut = toDate(b.checkOutDateTime);

    return doIntervalsOverlap(checkIn, checkOut, bCheckIn, bCheckOut);
  });

  if (conflicting) {
    return {
      hasConflict: true,
      conflictingBooking: conflicting,
      message: `Room is already booked for ${conflicting.guestName || 'another guest'} during this timeframe.`,
    };
  }

  return {
    hasConflict: false,
    conflictingBooking: null,
    message: null,
  };
}
