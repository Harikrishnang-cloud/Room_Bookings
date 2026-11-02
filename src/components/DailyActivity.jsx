import React, { useMemo } from 'react';
import {
  CalendarDays,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import DateSelector from './DateSelector';
import {
  toDate,
  isDateOnDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from '../utils/dateHelpers';
import { BOOKING_STATUSES, ROOM_STATUSES } from '../utils/availability';

export default function DailyActivity({
  selectedDate,
  onDateChange,
  rooms = [],
  bookings = [],
}) {
  // Compute daily metrics for selectedDate
  const dailyData = useMemo(() => {
    const sDate = toDate(selectedDate) || new Date();

    // Filter active bookings (not cancelled)
    const validBookings = bookings.filter((b) => b.bookingStatus !== BOOKING_STATUSES.CANCELLED);

    // 1. Check-ins scheduled on selected date
    const checkIns = validBookings.filter((b) => isDateOnDay(b.checkInDateTime, sDate));

    // 2. Check-outs scheduled on selected date
    const checkOuts = validBookings.filter((b) => isDateOnDay(b.checkOutDateTime, sDate));

    // 3. Total bookings touching this day
    const dayBookings = validBookings.filter((b) => {
      const cIn = toDate(b.checkInDateTime);
      const cOut = toDate(b.checkOutDateTime);
      if (!cIn || !cOut) return false;
      return (
        isDateOnDay(cIn, sDate) ||
        isDateOnDay(cOut, sDate) ||
        isWithinInterval(sDate, { start: cIn, end: cOut })
      );
    });

    // 4. Currently occupied rooms on selected date
    const occupiedRoomIds = new Set();
    validBookings.forEach((b) => {
      const cIn = toDate(b.checkInDateTime);
      const cOut = toDate(b.checkOutDateTime);
      if (b.bookingStatus === BOOKING_STATUSES.CHECKED_IN) {
        occupiedRoomIds.add(b.roomId);
      } else if (b.bookingStatus === BOOKING_STATUSES.CONFIRMED && cIn && cOut) {
        if (sDate >= startOfDay(cIn) && sDate <= endOfDay(cOut)) {
          occupiedRoomIds.add(b.roomId);
        }
      }
    });

    const occupiedCount = occupiedRoomIds.size;
    const cleaningCount = rooms.filter((r) => r.manualStatus === ROOM_STATUSES.CLEANING).length;
    const availableCount = Math.max(0, rooms.length - occupiedCount - cleaningCount);

    // 5. Upcoming arrivals (scheduled check-ins not yet checked in)
    const upcomingArrivals = checkIns.filter(
      (b) => b.bookingStatus === BOOKING_STATUSES.CONFIRMED
    );

    return {
      totalBookings: dayBookings.length,
      checkInsCount: checkIns.length,
      checkOutsCount: checkOuts.length,
      occupiedCount,
      availableCount,
      upcomingArrivalsCount: upcomingArrivals.length,
    };
  }, [selectedDate, rooms, bookings]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with Title and Date Selector */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900">
                Daily Operations
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Summary metrics for selected date
              </p>
            </div>
          </div>

          {/* Date Picker Selector */}
          <div className="w-full lg:w-auto">
            <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
          </div>
        </div>
      </div>

      {/* 6 Key Daily Activity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 sm:p-0 sm:gap-0 sm:divide-x divide-slate-100 bg-slate-50/60">
        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mb-0.5 sm:mb-1">Total Bookings</span>
          <span className="text-lg sm:text-2xl font-extrabold text-slate-800">{dailyData.totalBookings}</span>
        </div>

        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none">
          <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 block mb-0.5 sm:mb-1">Check-ins</span>
          <div className="flex items-center justify-center gap-1">
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-700">{dailyData.checkInsCount}</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none">
          <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 block mb-0.5 sm:mb-1">Check-outs</span>
          <div className="flex items-center justify-center gap-1">
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
            <span className="text-lg sm:text-2xl font-extrabold text-rose-700">{dailyData.checkOutsCount}</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none">
          <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 block mb-0.5 sm:mb-1">Occupied</span>
          <div className="flex items-center justify-center gap-1">
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            <span className="text-lg sm:text-2xl font-extrabold text-amber-700">{dailyData.occupiedCount}</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none">
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 block mb-0.5 sm:mb-1">Available</span>
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            <span className="text-lg sm:text-2xl font-extrabold text-emerald-700">{dailyData.availableCount}</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200/80 shadow-2xs sm:shadow-none col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-purple-600 block mb-0.5 sm:mb-1">Arrivals</span>
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            <span className="text-lg sm:text-2xl font-extrabold text-purple-700">{dailyData.upcomingArrivalsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
