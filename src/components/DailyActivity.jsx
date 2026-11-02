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
    const dayStart = startOfDay(sDate);
    const dayEnd = endOfDay(sDate);

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
    // A) Scheduled events from bookings for this day
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

    // B) Logged activities on this day
    activities.forEach((act) => {
      const actTime = toDate(act.activityDateTime);
      if (actTime && isDateOnDay(actTime, sDate)) {
        // Avoid duplicate if same booking checkin/checkout already exists
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

    // Sort chronologically (earliest to latest)
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
      <div className="p-4 sm:p-5 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Daily Activity & Operations
              </h2>
              <p className="text-xs text-slate-500">
                Detailed timeline and metrics for any selected date
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/50">
        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Bookings</span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-800">{dailyData.totalBookings}</span>
        </div>

        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-blue-600 block mb-1">Check-ins Scheduled</span>
          <div className="flex items-center justify-center gap-1.5">
            <LogIn className="w-4 h-4 text-blue-500" />
            <span className="text-xl sm:text-2xl font-extrabold text-blue-700">{dailyData.checkInsCount}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-rose-600 block mb-1">Check-outs Scheduled</span>
          <div className="flex items-center justify-center gap-1.5">
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="text-xl sm:text-2xl font-extrabold text-rose-700">{dailyData.checkOutsCount}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-amber-600 block mb-1">Occupied Rooms</span>
          <div className="flex items-center justify-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span className="text-xl sm:text-2xl font-extrabold text-amber-700">{dailyData.occupiedCount}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-emerald-600 block mb-1">Available Rooms</span>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">{dailyData.availableCount}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-purple-600 block mb-1">Upcoming Arrivals</span>
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-xl sm:text-2xl font-extrabold text-purple-700">{dailyData.upcomingArrivalsCount}</span>
          </div>
        </div>
      </div>

      {/* Daily Activity Timeline */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Chronological Activity Timeline
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {dailyData.timelineEvents.length} event{dailyData.timelineEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {dailyData.timelineEvents.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-3 sm:space-y-4">
            {dailyData.timelineEvents.map((evt) => (
              <div
                key={evt.id}
                className="relative flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors gap-2"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[19px] sm:-left-[25px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-600 shadow-xs" />

                <div className="flex items-start sm:items-center gap-3">
                  {/* Time Badge */}
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0 font-mono">
                    {formatTime(evt.time)}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        Room {evt.roomNumber}
                      </span>
                      {evt.roomName && (
                        <span className="text-xs text-slate-400 hidden sm:inline">• {evt.roomName}</span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border text-slate-700">
                        {evt.activityType}
                      </span>
                    </div>

                    {evt.guestName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{evt.guestName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <StatusBadge status={evt.status} size="sm" />
                  {evt.booking && (
                    <button
                      type="button"
                      onClick={() => onSelectBooking(evt.booking)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 transition-colors"
                      title="View booking"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No check-ins, check-outs, or room activities recorded for this date.
          </div>
        )}
      </div>
    </div>
  );
}
