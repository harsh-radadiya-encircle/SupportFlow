import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  className?: string;
  render: (item: T, index: number) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export interface DataTableProps<T> {
  title?: string;
  totalCount?: number;
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;

  // Search Configuration
  searchPlaceholder?: string;
  onSearchChange?: (searchValue: string) => void;

  // Additional Filter Dropdowns
  filterOptions?: FilterOption[];

  // Top Header Action (e.g., + New Ticket)
  headerAction?: React.ReactNode;

  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (columnKey: string) => void;

  // Pagination Configuration
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;

  // Empty State Customization
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  title = 'Entries',
  totalCount,
  data,
  columns,
  isLoading = false,
  searchPlaceholder = 'Search...',
  onSearchChange,
  filterOptions = [],
  headerAction,
  sortColumn,
  sortDirection,
  onSortChange,
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  emptyMessage = 'No matching records found.',
}: DataTableProps<T>) {
  // Local Search Input State for 100% smooth typing without page reload flickers
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Trigger parent onSearchChange strictly when debounced value changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const displayTotal = totalCount !== undefined ? totalCount : total;
  const start = Math.min((page - 1) * limit + 1, displayTotal);
  const end = Math.min(page * limit, displayTotal);

  return (
    <div className="space-y-4 font-sans w-full">
      {/* Top Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
          {/* Total Count Badge */}
          <div className="text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl shrink-0 text-center md:text-left shadow-2xs whitespace-nowrap">
            <span className="font-bold text-slate-900">{displayTotal}</span> {title}
          </div>

          {/* Search Input (Expands to fill all remaining horizontal space) */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium shadow-2xs transition-all focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" />
              )}
            </div>
          )}

          {/* Dynamic Filter Select Dropdowns */}
          {filterOptions.length > 0 && (
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5">
              {filterOptions.map((filter) => (
                <select
                  key={filter.key}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs transition-all min-w-[140px]"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}

          {/* Optional Action CTA Button */}
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      </div>

      {/* Main Table Container with Smooth Horizontal Scrollbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse text-sm min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-sm whitespace-nowrap">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'py-3.5 px-4 align-middle',
                      col.sortable &&
                        'cursor-pointer select-none hover:text-slate-900 transition-colors',
                      col.className
                    )}
                    onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.className?.includes('text-right') && 'justify-end'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400 shrink-0">
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: limit > 5 ? 5 : limit }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={`sk-col-${cIdx}`} className="py-4 px-4 align-middle">
                        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty State
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-slate-400 font-medium text-sm"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                // Render Actual Rows
                data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'py-4 px-4 align-middle text-slate-800 font-medium text-sm',
                          col.className
                        )}
                      >
                        {col.render(item, index)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination Footer */}
        {displayTotal > 0 && onPageChange && (
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Size & Result Counter */}
            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
              {onLimitChange && (
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-slate-400">Entries per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="px-2.5 py-1 text-sm border border-slate-200 rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}
              <span className="text-xs sm:text-sm">
                Showing <strong className="font-bold text-slate-900">{start}</strong> to{' '}
                <strong className="font-bold text-slate-900">{end}</strong> of{' '}
                <strong className="font-bold text-slate-900">{displayTotal}</strong> results
              </span>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-2.5 sm:px-3.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1 px-0.5">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && p - prevPage > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-slate-400 text-xs sm:text-sm px-0.5">...</span>}
                        <button
                          type="button"
                          onClick={() => onPageChange(p)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            p === page
                              ? 'bg-slate-900 text-white shadow-sm font-bold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-2.5 sm:px-3.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all whitespace-nowrap"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
