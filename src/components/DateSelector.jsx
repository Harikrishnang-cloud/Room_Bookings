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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between sm:justify-start gap-1">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-2 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all min-h-[40px] min-w-[40px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center touch-manipulation"
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToday}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] sm:min-h-[32px] flex items-center justify-center touch-manipulation ${
            isToday(currentDate)
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 bg-white/60'
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={handleNextDay}
          className="p-2 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all min-h-[40px] min-w-[40px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center touch-manipulation"
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date Display & Picker */}
      <label className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs cursor-pointer min-h-[40px] sm:min-h-[32px] touch-manipulation hover:border-slate-300">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">
          <span>{format(currentDate, 'EEE, dd MMM yyyy')}</span>
          {relativeLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              {relativeLabel}
            </span>
          )}
        </div>

        <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
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
  );
}
