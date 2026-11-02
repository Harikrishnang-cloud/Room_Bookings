import React from 'react';
import { DoorClosed, CheckCircle2, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { ROOM_STATUSES } from '../utils/availability';

export default function SummaryCards({ counts, activeFilter, onSelectFilter }) {
  const cards = [
    {
      id: 'all',
      filterVal: 'ALL',
      title: 'Total Rooms',
      count: counts.total || 0,
      icon: DoorClosed,
      color: 'slate',
      bgClass: 'bg-white',
      borderClass: 'border-slate-200 hover:border-slate-300',
      textClass: 'text-slate-800',
      badgeBg: 'bg-slate-100 text-slate-700',
      activeRing: 'ring-2 ring-slate-800 border-slate-800',
    },
    {
      id: 'available',
      filterVal: ROOM_STATUSES.AVAILABLE,
      title: 'Available Rooms',
      count: counts.available || 0,
      icon: CheckCircle2,
      color: 'emerald',
      bgClass: 'bg-white',
      borderClass: 'border-emerald-200 hover:border-emerald-300',
      textClass: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500',
    },
    {
      id: 'booked',
      filterVal: ROOM_STATUSES.BOOKED,
      title: 'Booked Rooms',
      count: counts.booked || 0,
      icon: AlertCircle,
      color: 'rose',
      bgClass: 'bg-white',
      borderClass: 'border-rose-200 hover:border-rose-300',
      textClass: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      activeRing: 'ring-2 ring-rose-500 border-rose-500',
    },
    {
      id: 'cleaning',
      filterVal: ROOM_STATUSES.CLEANING,
      title: 'Cleaning Rooms',
      count: counts.cleaning || 0,
      icon: Sparkles,
      color: 'amber',
      bgClass: 'bg-white',
      borderClass: 'border-amber-200 hover:border-amber-300',
      textClass: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      activeRing: 'ring-2 ring-amber-500 border-amber-500',
    },
    {
      id: 'checkedIn',
      filterVal: ROOM_STATUSES.CHECKED_IN,
      title: 'Checked In',
      count: counts.checkedIn || 0,
      icon: UserCheck,
      color: 'blue',
      bgClass: 'bg-white',
      borderClass: 'border-blue-200 hover:border-blue-300',
      textClass: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200',
      activeRing: 'ring-2 ring-blue-500 border-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterVal;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.filterVal)}
            className={`text-left p-3.5 sm:p-4 rounded-xl border bg-white shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer ${
              card.borderClass
            } ${isSelected ? card.activeRing : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 tracking-wide truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.badgeBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-extrabold ${card.textClass}`}>
                {card.count}
              </span>
              {isSelected && (
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Filtered
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
