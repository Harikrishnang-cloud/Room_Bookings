import React from 'react';
import { RefreshCw, Plus, Building, Database } from 'lucide-react';
import { formatTime } from '../utils/dateHelpers';
import { isFirebaseConfigured } from '../services/firebase';

export default function Header({
  lastUpdated,
  onRefresh,
  onOpenNewBooking,
  onOpenNewRoom,
  onOpenFirebaseConfig,
  isRefreshing = false,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Titles */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div> */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  Apartment Rooms
                </h1>
                
                
              </div>
              <p className="text-[11px] sm:text-sm text-slate-500 font-medium truncate hidden sm:block">
                Room Availability Dashboard
              </p>
            </div>
          </div>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Timestamp & Refresh Button */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="hidden md:inline">Updated:</span>
              <span className="font-semibold text-slate-700">
                {lastUpdated ? formatTime(lastUpdated, 'hh:mm a') : '--:--'}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1 sm:p-1.5 hover:text-slate-900 hover:bg-white rounded transition-colors text-slate-500 disabled:opacity-50 ml-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center touch-manipulation"
                title="Refresh dashboard"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenNewRoom}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>

              <button
                type="button"
                onClick={onOpenNewBooking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:shadow min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </button>
            </div>

            {/* Mobile Header Quick Add Room Icon Button */}
            <button
              type="button"
              onClick={onOpenNewRoom}
              className="sm:hidden p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation"
              title="Add Room"
              aria-label="Add Room"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
