import React from 'react';
import {X,User,Phone,DoorClosed,LogIn,LogOut,Edit2,Trash2,Users,FileText,Clock,CreditCard,} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatDate, formatTime } from '../utils/dateHelpers';
import { BOOKING_STATUSES, ROOM_STATUSES } from '../utils/availability';

export default function BookingDetailsModal({isOpen,onClose,booking,rooms = [],onEdit,onCheckIn,onCheckOut,onCancel,}) {
  if (!isOpen || !booking) return null;

  const room = rooms.find((r) => r.id === booking.roomId);
  const status = booking.bookingStatus || BOOKING_STATUSES.CONFIRMED;
  const badgeStatus =
    status === BOOKING_STATUSES.CONFIRMED
      ? ROOM_STATUSES.BOOKED
      : status === BOOKING_STATUSES.CHECKED_IN
      ? ROOM_STATUSES.CHECKED_IN
      : status === BOOKING_STATUSES.CHECKED_OUT
      ? ROOM_STATUSES.CHECKED_OUT
      : ROOM_STATUSES.BOOKED;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
              <DoorClosed className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Room {room?.roomNumber || 'N/A'}
                </h2>
                <StatusBadge status={badgeStatus} size="sm" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Booking ID: {booking.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto touch-scroll">
          {/* Room Details & Description */}
          {room && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Room Information
              </span>
              <div className="flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm font-bold text-slate-800">
                  Room {room.roomNumber} {room.roomName ? `• ${room.roomName}` : ''}
                </span>
              </div>
              {room.description && (
                <p className="text-xs text-slate-600 leading-relaxed pl-6 pt-0.5 whitespace-pre-wrap">
                  {room.description}
                </p>
              )}
            </div>
          )}

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

          {/* Booking Timing & Duration */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5 px-0.5">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Schedule
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {booking.durationLabel || `${Math.max(1, Math.round((new Date(booking.checkOutDateTime) - new Date(booking.checkInDateTime)) / (1000 * 60 * 60)))} Hours`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mb-0.5">Check-In</span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {formatDate(booking.checkInDateTime, 'dd MMM yyyy')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatTime(booking.checkInDateTime)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mb-0.5">Check-Out</span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {formatDate(booking.checkOutDateTime, 'dd MMM yyyy')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatTime(booking.checkOutDateTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {booking.paymentMethod && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </span>
              <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {booking.paymentMethod}
              </span>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Special Notes</span>
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

        {/* Footer Actions with Large Touch Targets */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2 shrink-0 pb-safe">
          {status !== BOOKING_STATUSES.CANCELLED && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCancel(booking, room);
              }}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 min-h-[42px] touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
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
                className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1.5 min-h-[42px] touch-manipulation"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Booking</span>
              </button>
            )}

            {status === BOOKING_STATUSES.CONFIRMED && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckIn(booking, room);
                }}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors flex items-center gap-1.5 shadow-xs min-h-[42px] touch-manipulation"
              >
                <LogIn className="w-4 h-4" />
                <span>Check In</span>
              </button>
            )}

            {status === BOOKING_STATUSES.CHECKED_IN && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckOut(booking, room);
                }}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors flex items-center gap-1.5 shadow-xs min-h-[42px] touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                <span>Check Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
