import React, { useMemo } from 'react';
import {
  CalendarDays,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Activity,
  ArrowRight,
} from 'lucide-react';
import DateSelector from './DateSelector';
import StatusBadge from './StatusBadge';
import {
  toDate,
  isDateOnDay,
  formatTime,
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
  activities = [],
  onSelectBooking,
  onClickRoom,
}) {
  // Compute daily metrics & timeline for selectedDate
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

    // 6. Chronological Daily Timeline
    const timelineEvents = [];

    checkIns.forEach((b) => {
      const room = rooms.find((r) => r.id === b.roomId);
      timelineEvents.push({
        id: `sched-ci-${b.id}`,
        time: toDate(b.checkInDateTime),
        roomNumber: room?.roomNumber || 'N/A',
        roomName: room?.roomName || '',
        guestName: b.guestName,
        activityType: 'Scheduled Check-in',
        status: b.bookingStatus === BOOKING_STATUSES.CHECKED_IN ? ROOM_STATUSES.CHECKED_IN : ROOM_STATUSES.BOOKED,
        booking: b,
        isScheduled: true,
      });
    });

    checkOuts.forEach((b) => {
      const room = rooms.find((r) => r.id === b.roomId);
      timelineEvents.push({
        id: `sched-co-${b.id}`,
        time: toDate(b.checkOutDateTime),
        roomNumber: room?.roomNumber || 'N/A',
        roomName: room?.roomName || '',
        guestName: b.guestName,
        activityType: 'Scheduled Check-out',
        status: b.bookingStatus === BOOKING_STATUSES.CHECKED_OUT ? ROOM_STATUSES.CHECKED_OUT : ROOM_STATUSES.CHECKED_IN,
        booking: b,
        isScheduled: true,
      });
    });

    // Logged activities
    activities.forEach((act) => {
      const actTime = toDate(act.activityDateTime);
      if (actTime && isDateOnDay(actTime, sDate)) {
        const isDuplicate = timelineEvents.some(
          (e) => e.booking?.id === act.bookingId && e.activityType.toLowerCase().includes(act.activityType.toLowerCase())
        );
        if (!isDuplicate) {
          const room = rooms.find((r) => r.id === act.roomId);
          timelineEvents.push({
            id: act.id,
            time: actTime,
            roomNumber: act.roomNumber || room?.roomNumber || 'N/A',
            roomName: room?.roomName || '',
            guestName: act.guestName || '',
            activityType: act.activityType,
            status: act.activityType.includes('Cleaning')
              ? ROOM_STATUSES.CLEANING
              : act.activityType.includes('Check-in')
              ? ROOM_STATUSES.CHECKED_IN
              : act.activityType.includes('Check-out')
              ? ROOM_STATUSES.CHECKED_OUT
              : ROOM_STATUSES.AVAILABLE,
            booking: null,
            isScheduled: false,
          });
        }
      }
    });

    // Chronological sort
    timelineEvents.sort((a, b) => {
      const ta = a.time ? a.time.getTime() : 0;
      const tb = b.time ? b.time.getTime() : 0;
      return ta - tb;
    });

    return {
      totalBookings: dayBookings.length,
      checkInsCount: checkIns.length,
      checkOutsCount: checkOuts.length,
      occupiedCount,
      availableCount,
      upcomingArrivalsCount: upcomingArrivals.length,
      timelineEvents,
    };
  }, [selectedDate, rooms, bookings, activities]);

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
                Daily Activity & Operations
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Operations schedule for selected date
              </p>
            </div>
          </div>

          {/* Date Picker Selector */}
          <div className="w-full lg:w-auto">
            <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
          </div>
        </div>
      </div>

      {/* 6 Key Daily Activity Metrics - Mobile 3x2 / 2x3 responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 sm:p-0 sm:gap-0 sm:divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/60">
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

      {/* Daily Activity Timeline */}
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Activity Timeline
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            {dailyData.timelineEvents.length} event{dailyData.timelineEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {dailyData.timelineEvents.length > 0 ? (
          <div className="relative pl-5 sm:pl-7 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-2.5 sm:space-y-3.5">
            {dailyData.timelineEvents.map((evt) => (
              <div
                key={evt.id}
                className="relative flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors gap-2"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[16px] sm:-left-[24px] top-3.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white bg-slate-600 shadow-xs" />

                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Time Badge */}
                  <span className="px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0 font-mono">
                    {formatTime(evt.time)}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        Room {evt.roomNumber}
                      </span>
                      {evt.roomName && (
                        <span className="text-xs text-slate-400 hidden sm:inline">• {evt.roomName}</span>
                      )}
                      <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-white border text-slate-700">
                        {evt.activityType}
                      </span>
                    </div>

                    {evt.guestName && (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{evt.guestName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <StatusBadge status={evt.status} size="sm" />
                  {evt.booking && (
                    <button
                      type="button"
                      onClick={() => onSelectBooking(evt.booking)}
                      className="p-1.5 sm:p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
                      title="View booking details"
                      aria-label="View booking details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 sm:py-8 text-center text-slate-400 text-xs sm:text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No check-ins, check-outs, or room activities recorded for this date.
          </div>
        )}
      </div>
    </div>
  );
}
