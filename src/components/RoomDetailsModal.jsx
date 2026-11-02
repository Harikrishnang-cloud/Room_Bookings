import React, { useState } from 'react';
import {
  X,
  DoorClosed,
  Calendar,
  User,
  Clock,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  History,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ROOM_STATUSES, BOOKING_STATUSES } from '../utils/availability';
import { formatDate, formatTime } from '../utils/dateHelpers';

export default function RoomDetailsModal({
  isOpen,
  onClose,
  room,
  statusData,
  bookings = [],
  onBookRoom,
  onEditRoom,
  onDeleteRoom,
  onSetStatus,
  onSelectBooking,
}) {
  if (!isOpen || !room) return null;

  const status = statusData.status || ROOM_STATUSES.AVAILABLE;
  const activeBooking = statusData.activeBooking;

  // Filter all bookings for this room
  const roomBookings = bookings.filter((b) => b.roomId === room.id);
  const activeOrUpcoming = roomBookings.filter(
    (b) => b.bookingStatus === BOOKING_STATUSES.CONFIRMED || b.bookingStatus === BOOKING_STATUSES.CHECKED_IN
  );
  const pastBookings = roomBookings.filter(
    (b) => b.bookingStatus === BOOKING_STATUSES.CHECKED_OUT || b.bookingStatus === BOOKING_STATUSES.CANCELLED
  );

  const canChangeManualStatus =
    status !== ROOM_STATUSES.BOOKED && status !== ROOM_STATUSES.CHECKED_IN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
              <DoorClosed className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Room {room.roomNumber}
                </h2>
                <StatusBadge status={status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {room.roomName || 'Apartment Suite'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Room Description */}
          {room.description && (
            <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {room.description}
            </div>
          )}

          {/* Quick Room Status Controls */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Room Status Controls
              </span>
              <span className="text-xs text-slate-500">
                Current: <strong className="text-slate-800">{status}</strong>
              </span>
            </div>

            {canChangeManualStatus ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSetStatus(room.id, ROOM_STATUSES.AVAILABLE, room.roomNumber)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all ${
                    status === ROOM_STATUSES.AVAILABLE
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Available / Ready</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSetStatus(room.id, ROOM_STATUSES.CLEANING, room.roomNumber)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all ${
                    status === ROOM_STATUSES.CLEANING
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mark as Cleaning</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Room has an active booking ({status}). Manual status changes are restricted while occupied.</span>
              </p>
            )}
          </div>

          {/* Active Booking Card */}
          {activeBooking && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  Active Guest Booking
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectBooking(activeBooking);
                  }}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  View Details &rarr;
                </button>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{activeBooking.guestName}</span>
                  <span className="text-xs text-slate-500 font-normal">({activeBooking.mobileNumber})</span>
                </div>
                <StatusBadge
                  status={
                    activeBooking.bookingStatus === BOOKING_STATUSES.CHECKED_IN
                      ? ROOM_STATUSES.CHECKED_IN
                      : ROOM_STATUSES.BOOKED
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>
                  Check-in: {formatDate(activeBooking.checkInDateTime, 'dd MMM')}, {formatTime(activeBooking.checkInDateTime)}
                </span>
                <span>
                  Check-out: {formatDate(activeBooking.checkOutDateTime, 'dd MMM')}, {formatTime(activeBooking.checkOutDateTime)}
                </span>
              </div>
            </div>
          )}

          {/* Upcoming Reservations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Upcoming Bookings ({activeOrUpcoming.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookRoom(room);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Booking</span>
              </button>
            </div>

            {activeOrUpcoming.length > 0 ? (
              <div className="space-y-2">
                {activeOrUpcoming.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onClose();
                      onSelectBooking(b);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{b.guestName}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {formatDate(b.checkInDateTime, 'dd MMM')} &ndash; {formatDate(b.checkOutDateTime, 'dd MMM')}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        b.bookingStatus === BOOKING_STATUSES.CHECKED_IN
                          ? ROOM_STATUSES.CHECKED_IN
                          : ROOM_STATUSES.BOOKED
                      }
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No upcoming bookings scheduled for this room.
              </p>
            )}
          </div>

          {/* Past Bookings / History */}
          {pastBookings.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Past History ({pastBookings.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pastBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onClose();
                      onSelectBooking(b);
                    }}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/60 cursor-pointer flex items-center justify-between text-xs text-slate-600"
                  >
                    <span className="font-medium truncate max-w-[150px]">{b.guestName}</span>
                    <span className="text-slate-400 text-[11px]">
                      {formatDate(b.checkInDateTime, 'dd MMM yyyy')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        b.bookingStatus === BOOKING_STATUSES.CANCELLED
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditRoom(room);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Room</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteRoom(room);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBookRoom(room);
            }}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>
    </div>
  );
}
