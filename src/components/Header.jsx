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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title and Subtitle */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Apartment Rooms
                </h1>
                {/* Live status badge */}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
                {/* Database badge */}
                <button
                  type="button"
                  onClick={onOpenFirebaseConfig}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                    isFirebaseConfigured
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Click to view or edit database settings"
                >
                  <Database className="w-3 h-3" />
                  <span>{isFirebaseConfigured ? 'Firestore' : 'Local Data'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Room Availability Dashboard
              </p>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="hidden sm:inline">Updated:</span>
              <span className="font-semibold text-slate-700">
                {lastUpdated ? formatTime(lastUpdated, 'hh:mm:ss a') : '--:--:--'}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1 hover:text-slate-900 hover:bg-white rounded transition-colors text-slate-500 disabled:opacity-50 ml-1"
                title="Refresh dashboard"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenNewRoom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>

              <button
                type="button"
                onClick={onOpenNewBooking}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:shadow"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
