import React, { useState } from 'react';
import {
  DoorClosed,
  ChevronRight,
  User,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  MoreVertical,
  LogOut,
  LogIn,
  PlusCircle,
  Eye,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ROOM_STATUSES, STATUS_THEME, BOOKING_STATUSES } from '../utils/availability';
import { formatDate, formatTime } from '../utils/dateHelpers';

export default function RoomCard({
  room,
  statusData,
  onClickRoom,
  onBookRoom,
  onCheckIn,
  onCheckOut,
  onSetStatus,
  onViewBooking,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = statusData.status || ROOM_STATUSES.AVAILABLE;
  const activeBooking = statusData.activeBooking;
  const upcomingBooking = statusData.upcomingBooking;
  const theme = STATUS_THEME[status] || STATUS_THEME[ROOM_STATUSES.AVAILABLE];

  return (
    <div
      onClick={() => onClickRoom(room)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${theme.borderClass} overflow-hidden flex flex-col justify-between`}
    >
      {/* Top Banner Accent */}
      <div className={`h-1.5 w-full ${theme.dotClass}`} />

      <div className="p-4 sm:p-5">
        {/* Header row: Room Number & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-slate-700 bg-slate-100 group-hover:bg-slate-200 transition-colors`}>
              <DoorClosed className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Room {room.roomNumber}
                </span>
              </div>
              {room.roomName && (
                <p className="text-xs text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                  {room.roomName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <StatusBadge status={status} size="sm" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Room actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setMenuOpen(false)}
            className="absolute right-4 top-14 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 text-xs text-slate-700 font-medium animate-in fade-in"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onClickRoom(room);
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Room Details</span>
            </button>

            {status === ROOM_STATUSES.AVAILABLE && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onBookRoom(room);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 text-emerald-700 font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Booking</span>
              </button>
            )}

            {activeBooking && activeBooking.bookingStatus === BOOKING_STATUSES.CONFIRMED && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onCheckIn(activeBooking, room);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center gap-2 text-blue-700 font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Check-in Guest</span>
              </button>
            )}

            {activeBooking && activeBooking.bookingStatus === BOOKING_STATUSES.CHECKED_IN && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onCheckOut(activeBooking, room);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check-out Guest</span>
              </button>
            )}

            {status !== ROOM_STATUSES.CHECKED_IN && status !== ROOM_STATUSES.BOOKED && (
              <>
                <div className="border-t border-slate-100 my-1" />
                {status !== ROOM_STATUSES.CLEANING ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSetStatus(room.id, ROOM_STATUSES.CLEANING, room.roomNumber);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-700"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mark as Cleaning</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSetStatus(room.id, ROOM_STATUSES.AVAILABLE, room.roomNumber);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark as Available</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Dynamic Status Details Section */}
        <div className="mt-2 min-h-[64px] flex flex-col justify-center">
          {activeBooking ? (
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{activeBooking.guestName}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal shrink-0">
                  {activeBooking.numberOfGuests} guest{activeBooking.numberOfGuests > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Out: {formatDate(activeBooking.checkOutDateTime, 'dd MMM')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatTime(activeBooking.checkOutDateTime)}</span>
                </span>
              </div>
            </div>
          ) : status === ROOM_STATUSES.CLEANING ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-center gap-2 text-amber-800 text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="truncate">
                <p className="font-semibold truncate">Housekeeping in progress</p>
                <p className="text-[11px] text-amber-600 truncate">Mark clean once finished</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex flex-col justify-center py-1">
              <p className="font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Ready for guest check-in
              </p>
              {upcomingBooking ? (
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Next arrival: {formatDate(upcomingBooking.checkInDateTime, 'dd MMM')}, {formatTime(upcomingBooking.checkInDateTime)}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No upcoming bookings
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Quick Action Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500 group-hover:text-slate-800 transition-colors flex items-center gap-1">
          Details
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {status === ROOM_STATUSES.AVAILABLE && (
            <button
              type="button"
              onClick={() => onBookRoom(room)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Book
            </button>
          )}

          {status === ROOM_STATUSES.CLEANING && (
            <button
              type="button"
              onClick={() => onSetStatus(room.id, ROOM_STATUSES.AVAILABLE, room.roomNumber)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Set Ready
            </button>
          )}

          {activeBooking && activeBooking.bookingStatus === BOOKING_STATUSES.CONFIRMED && (
            <button
              type="button"
              onClick={() => onCheckIn(activeBooking, room)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Check In
            </button>
          )}

          {activeBooking && activeBooking.bookingStatus === BOOKING_STATUSES.CHECKED_IN && (
            <button
              type="button"
              onClick={() => onCheckOut(activeBooking, room)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Check Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
