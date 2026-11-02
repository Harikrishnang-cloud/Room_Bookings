import React from 'react';
import { Search, X, Layers, Plus, Sparkles } from 'lucide-react';
import RoomCard from './RoomCard';
import { ROOM_STATUSES } from '../utils/availability';

export default function RoomGrid({
  rooms,
  roomStatusMap,
  filterStatus,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  onClickRoom,
  onBookRoom,
  onCheckIn,
  onCheckOut,
  onSetStatus,
  onViewBooking,
  onInitSampleRooms,
  loading = false,
}) {
  const filterOptions = [
    { label: 'All Rooms', value: 'ALL' },
    { label: 'Available', value: ROOM_STATUSES.AVAILABLE },
    { label: 'Booked', value: ROOM_STATUSES.BOOKED },
    { label: 'Cleaning', value: ROOM_STATUSES.CLEANING },
    { label: 'Checked In', value: ROOM_STATUSES.CHECKED_IN },
  ];

  return (
    <section className="space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterOptions.map((opt) => {
            const isSelected = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectFilter(opt.value)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search room #, guest, or phone..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Room Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing <strong className="text-slate-800">{rooms.length}</strong> room{rooms.length !== 1 ? 's' : ''}
          {filterStatus !== 'ALL' && ` • Filtered by ${filterStatus}`}
        </span>
      </div>

      {/* Room Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {rooms.map((room) => {
            const statusData = roomStatusMap[room.id] || { status: ROOM_STATUSES.AVAILABLE };
            return (
              <RoomCard
                key={room.id}
                room={room}
                statusData={statusData}
                onClickRoom={onClickRoom}
                onBookRoom={onBookRoom}
                onCheckIn={onCheckIn}
                onCheckOut={onCheckOut}
                onSetStatus={onSetStatus}
                onViewBooking={onViewBooking}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-slate-400">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
            No rooms found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery || filterStatus !== 'ALL'
              ? 'Try adjusting your search criteria or resetting the active status filter.'
              : 'There are currently no apartment rooms in the system.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {(searchQuery || filterStatus !== 'ALL') ? (
              <button
                type="button"
                onClick={() => {
                  onSelectFilter('ALL');
                  onSearchChange('');
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onInitSampleRooms}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Initialize 10 Sample Rooms</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
