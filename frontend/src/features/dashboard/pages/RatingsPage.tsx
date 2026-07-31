import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../shared/store/authStore';
import { useRatings } from '../hooks/useDashboard';
import { DataTable, Column } from '../../../shared/components/ui/DataTable';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { RatingEntry } from '../api/dashboard.api';
import {
  Star,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  SmilePlus,
  Frown,
  Loader2,
} from 'lucide-react';

// ─── Star Display Helper ─────────────────────────────────────────────────────
const StarRating: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${
          star <= score ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
        }`}
      />
    ))}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const RatingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'BUSINESS_ADMIN';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [scoreFilter, setScoreFilter] = useState('');

  const { data, isLoading, isError } = useRatings({
    page,
    limit,
    score: scoreFilter ? parseInt(scoreFilter, 10) : undefined,
  });

  const handleScoreFilterChange = (val: string) => {
    setScoreFilter(val);
    setPage(1);
  };

  const handleLimitChange = (val: number) => {
    setLimit(val);
    setPage(1);
  };

  // ── Error State ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-semibold text-slate-500">Failed to load ratings. Please try again.</p>
      </div>
    );
  }

  const summary = data?.summary;
  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  // ── DataTable Columns ────────────────────────────────────────────────────────
  const columns: Column<RatingEntry>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      render: (entry) => (
        <div>
          <Link
            to={`/tickets/${entry.id}`}
            className="font-bold text-indigo-700 hover:underline underline-offset-2 transition-colors"
          >
            #{entry.ticketNumber || entry.id.substring(0, 6)}
          </Link>
          <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-[200px] truncate">
            {entry.title}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (entry) => (
        <div>
          <p className="font-semibold text-slate-800">{entry.customer.fullName}</p>
          <p className="text-xs text-slate-400">{entry.customer.email}</p>
        </div>
      ),
    },
    ...(isAdmin
      ? ([
          {
            key: 'agent',
            header: 'Agent',
            render: (entry: RatingEntry) =>
              entry.assignedAgent?.fullName ? (
                <span className="font-semibold text-slate-700">{entry.assignedAgent.fullName}</span>
              ) : (
                <span className="text-slate-400 italic text-xs">Unassigned</span>
              ),
          },
        ] as Column<RatingEntry>[])
      : []),
    {
      key: 'score',
      header: 'Score',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <StarRating score={entry.csatScore} />
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg">
            {entry.csatScore}/5
          </span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Comment',
      render: (entry) =>
        entry.csatComment ? (
          <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2 max-w-[240px]">
            "{entry.csatComment}"
          </p>
        ) : (
          <span className="text-xs text-slate-300 italic">No comment</span>
        ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (entry) => (
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {new Date(entry.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          Customer Ratings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          {isAdmin
            ? 'All customer satisfaction ratings across your business'
            : 'Customer satisfaction ratings for tickets assigned to you'}
        </p>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      {isLoading && !summary ? (
        <div className="flex items-center text-slate-400 gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading summary...</span>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Reviews"
            value={summary.totalRated}
            icon={<MessageSquare className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
            sub="All time"
            isLoading={isLoading}
          />
          <StatCard
            title="Average Score"
            value={summary.avgScore > 0 ? `${summary.avgScore} / 5` : 'N/A'}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            sub={
              summary.avgScore >= 4
                ? 'Excellent 🎉'
                : summary.avgScore >= 3
                ? 'Good'
                : summary.avgScore > 0
                ? 'Needs attention'
                : undefined
            }
            isLoading={isLoading}
          />
          <StatCard
            title="5-Star Reviews"
            value={summary.fiveStarCount}
            icon={<SmilePlus className="w-5 h-5 text-amber-500" />}
            iconBg="bg-amber-50"
            sub={
              summary.totalRated > 0
                ? `${Math.round((summary.fiveStarCount / summary.totalRated) * 100)}% of total`
                : undefined
            }
            isLoading={isLoading}
          />
          <StatCard
            title="Low Scores (1–2★)"
            value={summary.lowScoreCount}
            icon={<Frown className="w-5 h-5 text-rose-500" />}
            iconBg="bg-rose-50"
            sub={
              summary.totalRated > 0
                ? `${Math.round((summary.lowScoreCount / summary.totalRated) * 100)}% of total`
                : undefined
            }
            isLoading={isLoading}
          />
        </div>
      ) : null}

      {/* ── DataTable with built-in filter, pagination ────────────────────── */}
      <DataTable<RatingEntry>
        title="Ratings"
        data={tickets}
        columns={columns}
        isLoading={isLoading}
        total={pagination?.total ?? 0}
        page={page}
        limit={limit}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
        emptyMessage={
          scoreFilter
            ? `No ${scoreFilter}-star ratings found.`
            : 'No customer ratings yet. Ratings appear after customers rate their resolved tickets.'
        }
        filterOptions={[
          {
            key: 'score',
            label: 'Score',
            value: scoreFilter,
            options: [
              { label: 'All Scores', value: '' },
              { label: '5 Stars', value: '5' },
              { label: '4 Stars', value: '4' },
              { label: '3 Stars', value: '3' },
              { label: '2 Stars', value: '2' },
              { label: '1 Star', value: '1' },
            ],
            onChange: handleScoreFilterChange,
          },
        ]}
      />
    </div>
  );
};
