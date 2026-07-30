import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getDateRangeForPreset, formatDateRangeLabel, formatDate } from '../../lib/dateUtils';
import { format, addMonths, subMonths, isSameDay, isWithinInterval } from 'date-fns';

export interface DateRange {
  preset: string;
  startDate: Date | null;
  endDate: Date | null;
  label: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export const PRESET_OPTIONS = [
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'LAST_WEEK', label: 'Last Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_MONTH', label: 'Last Month' },
  { id: 'THIS_YEAR', label: 'This Year' },
  { id: 'LAST_YEAR', label: 'Last Year' },
  { id: 'ALL_TIME', label: 'All Time' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active preset state
  const [selectedPreset, setSelectedPreset] = useState<string>(value?.preset || 'ALL_TIME');
  const [startDate, setStartDate] = useState<Date | null>(value?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(value?.endDate || null);

  // Live Current Date (e.g., 2026)
  const liveNow = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(liveNow);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPresetLabel = (id: string): string => {
    const found = PRESET_OPTIONS.find((p) => p.id === id);
    if (found && id !== 'CUSTOM') return found.label;
    return formatDateRangeLabel(startDate, endDate, 'All time');
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const range = getDateRangeForPreset(presetId, new Date());
    setStartDate(range.startDate);
    setEndDate(range.endDate);

    if (range.startDate) {
      setCurrentMonth(range.startDate);
    } else {
      setCurrentMonth(new Date());
    }
  };

  const handleApply = () => {
    const label = getPresetLabel(selectedPreset);
    const rangeObj: DateRange = {
      preset: selectedPreset,
      startDate,
      endDate,
      label,
    };
    if (onChange) {
      onChange(rangeObj);
    }
    setIsOpen(false);
  };

  const renderCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank offsets for first week (Monday start)
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    for (let i = 0; i < offset; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelectedStart = startDate && isSameDay(date, startDate);
      const isSelectedEnd = endDate && isSameDay(date, endDate);
      const isInRange =
        startDate && endDate && isWithinInterval(date, { start: startDate, end: endDate });

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            if (!startDate || (startDate && endDate)) {
              setStartDate(date);
              setEndDate(null);
              setSelectedPreset('CUSTOM');
            } else if (startDate && !endDate) {
              if (date < startDate) {
                setStartDate(date);
                setEndDate(startDate);
              } else {
                setEndDate(date);
              }
              setSelectedPreset('CUSTOM');
            }
          }}
          className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
            isSelectedStart || isSelectedEnd
              ? 'bg-indigo-600 text-white font-bold shadow-sm'
              : isInRange
                ? 'bg-indigo-50 text-indigo-900 font-medium'
                : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all"
      >
        <CalendarIcon className="w-4 h-4 text-indigo-600" />
        <span>{value?.label || getPresetLabel(selectedPreset)}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden font-sans flex flex-col md:flex-row animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Left Preset Filter Options Sidebar */}
          <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Time Filter
            </span>
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectPreset(opt.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedPreset === opt.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right Calendar & Inputs Panel */}
          <div className="p-4 space-y-4 flex-1 min-w-[280px]">
            {/* Header Month Nav Controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-900">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400">
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>Su</span>
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendarDays(currentMonth)}</div>
            </div>

            {/* Date Inputs Summary Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  readOnly
                  value={startDate ? format(startDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 bg-slate-50 w-28 text-center"
                />
                <span className="text-slate-400">—</span>
                <input
                  type="text"
                  readOnly
                  value={endDate ? format(endDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 bg-slate-50 w-28 text-center"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
