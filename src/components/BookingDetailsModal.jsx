import React from 'react';
import {
  X,
  User,
  Phone,
  DoorClosed,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Users,
  LogIn,
  LogOut,
  Edit2,
  Trash2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatDate, formatTime } from '../utils/dateHelpers';
import { BOOKING_STATUSES, ROOM_STATUSES } from '../utils/availability';

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  rooms = [],
  onEdit,
  onCheckIn,
  onCheckOut,
  onCancel,
}) {
  if (!isOpen || !booking) return null;

  const room = rooms.find((r) => r.id === booking.roomId);
  const status = booking.bookingStatus || BOOKING_STATUSES.CONFIRMED;
  const totalAmount = Number(booking.bookingAmount) || 0;
  const advanceAmount = Number(booking.advanceAmount) || 0;
  const balanceAmount = Math.max(0, totalAmount - advanceAmount);

  // Status map to badge status
  const badgeStatus =
    status === BOOKING_STATUSES.CONFIRMED
      ? ROOM_STATUSES.BOOKED
      : status === BOOKING_STATUSES.CHECKED_IN
      ? ROOM_STATUSES.CHECKED_IN
      : status === BOOKING_STATUSES.CHECKED_OUT
      ? ROOM_STATUSES.CHECKED_OUT
      : ROOM_STATUSES.BOOKED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
              <DoorClosed className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Room {room?.roomNumber || 'N/A'}
                </h2>
                <StatusBadge status={badgeStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Booking ID: {booking.id}
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
        <div className="p-4 sm:p-5 space-y-4">
          {/* Guest Information */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Guest Details
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.numberOfGuests || 1} guest{(booking.numberOfGuests || 1) > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.mobileNumber}</span>
            </div>
          </div>

          {/* Booking Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Check-In</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {formatDate(booking.checkInDateTime, 'dd MMM yyyy')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatTime(booking.checkInDateTime)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Check-Out</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {formatDate(booking.checkOutDateTime, 'dd MMM yyyy')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatTime(booking.checkOutDateTime)}
              </p>
            </div>
          </div>

          {/* Payment & Charges */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Total Amount</span>
              <span className="text-sm sm:text-base font-bold text-slate-800">${totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 block">Advance Paid</span>
              <span className="text-sm sm:text-base font-bold text-emerald-700">${advanceAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block">Balance Due</span>
              <span className="text-sm sm:text-base font-bold text-rose-700">${balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Special Notes / Requests</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {/* Booking Status Banner */}
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Created: {formatDateTime(booking.createdAt)}</span>
            <span className="font-semibold text-slate-600">Status: {status}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          {status !== BOOKING_STATUSES.CANCELLED && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCancel(booking, room);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Booking</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {status !== BOOKING_STATUSES.CANCELLED && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(booking);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            {status === BOOKING_STATUSES.CONFIRMED && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckIn(booking, room);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Check In Guest</span>
              </button>
            )}

            {status === BOOKING_STATUSES.CHECKED_IN && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckOut(booking, room);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check Out Guest</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
