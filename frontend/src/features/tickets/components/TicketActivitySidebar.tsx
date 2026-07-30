import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Lock, History, Shield } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TicketActivitySidebarProps {
  ticket: any;
  isAgentOrAdmin: boolean;
  activeRightTab: 'notes' | 'timeline';
  setActiveRightTab: (tab: 'notes' | 'timeline') => void;
  noteForm: UseFormReturn<any>;
  onAddNote: (data: any) => void;
  addNoteMutation: any;
}

export const TicketActivitySidebar: React.FC<TicketActivitySidebarProps> = ({
  ticket,
  isAgentOrAdmin,
  activeRightTab,
  setActiveRightTab,
  noteForm,
  onAddNote,
  addNoteMutation,
}) => {
  return (
    <Card glass className="p-5 border border-slate-200/80 space-y-4 flex flex-col">
      <div className="flex border-b border-slate-100 pb-2 gap-4">
        {isAgentOrAdmin && (
          <button
            onClick={() => setActiveRightTab('notes')}
            className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
              activeRightTab === 'notes'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" /> Private Notes
          </button>
        )}
        <button
          onClick={() => setActiveRightTab('timeline')}
          className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
            activeRightTab === 'timeline' || !isAgentOrAdmin
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-3.5 h-3.5 text-slate-500" /> Activity Log
        </button>
      </div>

      {isAgentOrAdmin && activeRightTab === 'notes' && (
        <div className="space-y-3">
          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Private internal notes are hidden from customer.</span>
            </div>

            {ticket.internalNotes?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 font-normal">
                No internal notes added yet.
              </p>
            ) : (
              ticket.internalNotes?.map((note: any) => (
                <div
                  key={note.id}
                  className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{note.author?.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-normal leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={noteForm.handleSubmit(onAddNote)} className="space-y-2 pt-2 border-t border-slate-100">
            <textarea
              {...noteForm.register('note')}
              rows={2}
              placeholder="Add private internal note..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white font-medium shadow-2xs"
            />
            {noteForm.formState.errors.note && (
              <p className="text-[10px] text-rose-600 font-bold">{noteForm.formState.errors.note.message as string}</p>
            )}
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 rounded-xl shadow-2xs border-slate-200"
              isLoading={addNoteMutation.isPending}
            >
              Save Note
            </Button>
          </form>
        </div>
      )}

      {(activeRightTab === 'timeline' || !isAgentOrAdmin) && (
        <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
          {ticket.activities?.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 font-normal">
              No activity logged yet.
            </p>
          ) : (
            ticket.activities?.map((act: any) => (
              <div
                key={act.id}
                className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{act.action}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                <p className="text-slate-500 font-normal">
                  By {act.actor?.fullName || 'System'}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};
