import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  formatDistanceToNow,
  isValid,
} from 'date-fns';

export interface DateRangePreset {
  id: string;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Formats a date into standard human readable date (e.g. "30 Jul 2026")
 */
export const formatDate = (dateInput?: Date | string | null, formatStr: string = 'dd MMM yyyy'): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, formatStr);
};

/**
 * Formats a date with time (e.g. "30 Jul 2026 at 11:29 AM")
 */
export const formatDateTime = (dateInput?: Date | string | null): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, "dd MMM yyyy 'at' hh:mm a");
};

/**
 * Formats full weekday date (e.g. "Thursday, Jul 30, 2026")
 */
export const formatFullDate = (dateInput?: Date | string | null): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, 'EEEE, MMM dd, yyyy');
};

/**
 * Formats date as relative time ago (e.g. "2 minutes ago", "just now")
 */
export const formatTimeAgo = (dateInput?: Date | string | null): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Dynamically computes dynamic Date Range for any preset ID using current date
 */
export const getDateRangeForPreset = (presetId: string, baseDate: Date = new Date()): { startDate: Date | null; endDate: Date | null } => {
  const now = baseDate;

  switch (presetId) {
    case 'TODAY':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };

    case 'THIS_WEEK':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      };

    case 'LAST_WEEK': {
      const lastWeekDate = subWeeks(now, 1);
      return {
        startDate: startOfWeek(lastWeekDate, { weekStartsOn: 1 }),
        endDate: endOfWeek(lastWeekDate, { weekStartsOn: 1 }),
      };
    }

    case 'THIS_MONTH':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case 'LAST_MONTH': {
      const lastMonthDate = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonthDate),
        endDate: endOfMonth(lastMonthDate),
      };
    }

    case 'THIS_YEAR':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };

    case 'LAST_YEAR': {
      const lastYearDate = subYears(now, 1);
      return {
        startDate: startOfYear(lastYearDate),
        endDate: endOfYear(lastYearDate),
      };
    }

    case 'ALL_TIME':
    default:
      return {
        startDate: null,
        endDate: null,
      };
  }
};

/**
 * Formats a Date Range for display (e.g. "01/08/2026 — 12/08/2026")
 */
export const formatDateRangeLabel = (startDate: Date | null, endDate: Date | null, defaultLabel: string = 'All time'): string => {
  if (!startDate && !endDate) return defaultLabel;
  if (startDate && !endDate) return `${format(startDate, 'dd/MM/yyyy')} — Present`;
  if (startDate && endDate) return `${format(startDate, 'dd/MM/yyyy')} — ${format(endDate, 'dd/MM/yyyy')}`;
  return defaultLabel;
};
