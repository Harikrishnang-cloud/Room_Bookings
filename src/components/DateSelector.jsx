import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, addDays, subDays } from 'date-fns';
import { toDate } from '../utils/dateHelpers';

export default function DateSelector({ selectedDate, onDateChange }) {
  const currentDate = toDate(selectedDate) || new Date();

  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getRelativeLabel = () => {
    if (isToday(currentDate)) return 'Today';
    if (isTomorrow(currentDate)) return 'Tomorrow';
    if (isYesterday(currentDate)) return 'Yesterday';
    return null;
  };

  const relativeLabel = getRelativeLabel();

  return (
    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToday}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            isToday(currentDate)
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={handleNextDay}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date Picker & Label */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-end gap-1.5">
            <span>{format(currentDate, 'EEE, dd MMM yyyy')}</span>
            {relativeLabel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                {relativeLabel}
              </span>
            )}
          </div>
        </div>

        <label className="relative cursor-pointer p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-colors">
          <CalendarIcon className="w-4 h-4" />
          <input
            type="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-').map(Number);
                onDateChange(new Date(y, m - 1, d, 12, 0, 0));
              }
            }}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}
