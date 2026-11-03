import React from 'react';
import { Search, X, Layers, Plus } from 'lucide-react';
import RoomCard from './RoomCard';
import { ROOM_STATUSES } from '../utils/availability';

export default function RoomGrid({rooms,roomStatusMap,filterStatus,onSelectFilter,searchQuery,onSearchChange,onClickRoom,onBookRoom,onCheckIn,onCheckOut,onSetStatus,onViewBooking,onOpenNewRoom,loading = false,}) {
  const filterOptions = [
    { label: 'All Rooms', value: 'ALL' },
    { label: 'Available', value: ROOM_STATUSES.AVAILABLE },
    { label: 'Booked', value: ROOM_STATUSES.BOOKED },
    { label: 'Cleaning', value: ROOM_STATUSES.CLEANING },
    { label: 'Checked In', value: ROOM_STATUSES.CHECKED_IN },
  ];

  return (
    <section className="space-y-3.5 sm:space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills with smooth horizontal touch scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
          {filterOptions.map((opt) => {
            const isSelected = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectFilter(opt.value)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all touch-manipulation min-h-[38px] flex items-center ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search Input with Proper Search UX */}
        <div className="relative w-full md:w-72 lg:w-80 group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchChange('');
              }
            }}
            placeholder="Search room, guest, phone, status..."
            className="w-full pl-9 pr-16 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 min-h-[42px]"
          />
          {searchQuery ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                {rooms.length}
              </span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center touch-manipulation"
                aria-label="Clear search"
                title="Clear search (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Room Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing <strong className="text-slate-800">{rooms.length}</strong> room{rooms.length !== 1 ? 's' : ''}
          {filterStatus !== 'ALL' && ` • ${filterStatus}`}
        </span>
      </div>

      {/* Room Grid - Single Column on Mobile, 2-3 Columns on Desktop */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
            {searchQuery || filterStatus !== 'ALL' ? 'No rooms match your filter' : 'No rooms added yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery || filterStatus !== 'ALL'
              ? 'Try adjusting your search criteria or resetting the active status filter.'
              : 'Add your apartment rooms to begin managing real-time availability and bookings.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {(searchQuery || filterStatus !== 'ALL') ? (
              <button
                type="button"
                onClick={() => {
                  onSelectFilter('ALL');
                  onSearchChange('');
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[40px] touch-manipulation"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenNewRoom}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs min-h-[44px] touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Room</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
