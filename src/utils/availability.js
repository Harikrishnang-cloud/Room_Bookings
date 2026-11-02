import { toDate } from './dateHelpers';

export const ROOM_STATUSES = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  CLEANING: 'Cleaning',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
};

export const BOOKING_STATUSES = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  CANCELLED: 'Cancelled',
};

/**
 * Checks if two date ranges overlap.
 * Overlap condition: startA < endB && endA > startB
 */
export function doIntervalsOverlap(startA, endA, startB, endB) {
  const sA = toDate(startA)?.getTime();
  const eA = toDate(endA)?.getTime();
  const sB = toDate(startB)?.getTime();
  const eB = toDate(endB)?.getTime();

  if (!sA || !eA || !sB || !eB) return false;
  return sA < eB && eA > sB;
}

/**
 * Calculates the current real-time or effective status of a room,
 * taking into account its active bookings and manual status (e.g., Cleaning).
 * 
 * @param {Object} room
 * @param {Array} bookings - list of all bookings for this room (or all active bookings)
 * @param {Date} [atTime=new Date()] - reference time
 * @returns {{ status: string, activeBooking: Object|null, upcomingBooking: Object|null }}
 */
export function computeRoomStatus(room, bookings = [], atTime = new Date()) {
  if (!room) return { status: ROOM_STATUSES.AVAILABLE, activeBooking: null, upcomingBooking: null };

  const refTime = toDate(atTime) || new Date();
  const roomBookings = bookings.filter((b) => b.roomId === room.id && b.bookingStatus !== BOOKING_STATUSES.CANCELLED);

  // 1. Check if there is a currently checked-in booking
  const checkedInBooking = roomBookings.find((b) => b.bookingStatus === BOOKING_STATUSES.CHECKED_IN);
  if (checkedInBooking) {
    return {
      status: ROOM_STATUSES.CHECKED_IN,
      activeBooking: checkedInBooking,
      upcomingBooking: null,
    };
  }

  // 2. Check if there is an active Confirmed booking encompassing refTime
  const activeConfirmed = roomBookings.find((b) => {
    if (b.bookingStatus !== BOOKING_STATUSES.CONFIRMED) return false;
    const checkIn = toDate(b.checkInDateTime);
    const checkOut = toDate(b.checkOutDateTime);
    return checkIn && checkOut && refTime >= checkIn && refTime < checkOut;
  });

  if (activeConfirmed) {
    return {
      status: ROOM_STATUSES.BOOKED,
      activeBooking: activeConfirmed,
      upcomingBooking: null,
    };
  }

  // 3. Find any upcoming confirmed booking in the future
  const futureBookings = roomBookings
    .filter((b) => {
      if (b.bookingStatus !== BOOKING_STATUSES.CONFIRMED) return false;
      const checkIn = toDate(b.checkInDateTime);
      return checkIn && checkIn > refTime;
    })
    .sort((a, b) => toDate(a.checkInDateTime) - toDate(b.checkInDateTime));

  const upcomingBooking = futureBookings[0] || null;

  // 4. If no active occupancy, respect manual status (Cleaning or Checked Out)
  if (room.manualStatus === ROOM_STATUSES.CLEANING) {
    return {
      status: ROOM_STATUSES.CLEANING,
      activeBooking: null,
      upcomingBooking,
    };
  }

  if (room.manualStatus === ROOM_STATUSES.CHECKED_OUT) {
    return {
      status: ROOM_STATUSES.CHECKED_OUT,
      activeBooking: null,
      upcomingBooking,
    };
  }

  // Default is Available
  return {
    status: ROOM_STATUSES.AVAILABLE,
    activeBooking: null,
    upcomingBooking,
  };
}

/**
 * Status visual theme definition
 */
export const STATUS_THEME = {
  [ROOM_STATUSES.AVAILABLE]: {
    label: 'Available',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-200 hover:border-emerald-300',
    headerBg: 'bg-emerald-50/50',
    textColor: 'text-emerald-700',
  },
  [ROOM_STATUSES.BOOKED]: {
    label: 'Booked',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    dotClass: 'bg-rose-500',
    borderClass: 'border-rose-200 hover:border-rose-300',
    headerBg: 'bg-rose-50/50',
    textColor: 'text-rose-700',
  },
  [ROOM_STATUSES.CLEANING]: {
    label: 'Cleaning',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-200 hover:border-amber-300',
    headerBg: 'bg-amber-50/50',
    textColor: 'text-amber-700',
  },
  [ROOM_STATUSES.CHECKED_IN]: {
    label: 'Checked In',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    dotClass: 'bg-blue-500',
    borderClass: 'border-blue-200 hover:border-blue-300',
    headerBg: 'bg-blue-50/50',
    textColor: 'text-blue-700',
  },
  [ROOM_STATUSES.CHECKED_OUT]: {
    label: 'Checked Out',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
    dotClass: 'bg-slate-500',
    borderClass: 'border-slate-200 hover:border-slate-300',
    headerBg: 'bg-slate-50',
    textColor: 'text-slate-700',
  },
};
