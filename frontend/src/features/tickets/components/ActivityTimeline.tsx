import React from 'react';

export const ActivityTimeline: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        <div className="relative">
          <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white"></span>
          <p className="text-xs font-bold text-indigo-600">Ticket Created</p>
          <p className="text-sm font-semibold text-slate-800">Ticket #1042 created by John Smith</p>
          <span className="text-[10px] text-slate-400 font-medium">Today at 10:14 AM</span>
        </div>

        <div className="relative">
          <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-purple-600 ring-4 ring-white"></span>
          <p className="text-xs font-bold text-purple-600">Assigned Agent Changed</p>
          <p className="text-sm font-semibold text-slate-800">Assigned to David Miller (Support Agent)</p>
          <span className="text-[10px] text-slate-400 font-medium">Today at 10:18 AM</span>
        </div>

        <div className="relative">
          <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-600 ring-4 ring-white"></span>
          <p className="text-xs font-bold text-amber-600">Internal Note Added</p>
          <p className="text-sm font-semibold text-slate-800">Private note added by David Miller</p>
          <span className="text-[10px] text-slate-400 font-medium">Today at 10:25 AM</span>
        </div>
      </div>
    </div>
  );
};
