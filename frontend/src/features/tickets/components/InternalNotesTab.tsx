import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Lock, Shield } from 'lucide-react';

interface NoteItem {
  id: string;
  author: string;
  content: string;
  time: string;
}

interface InternalNotesTabProps {
  notes: NoteItem[];
  onAddNote: (text: string) => void;
}

export const InternalNotesTab: React.FC<InternalNotesTabProps> = ({ notes, onAddNote }) => {
  const [noteText, setNoteText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(noteText);
    setNoteText('');
  };

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
        <Shield className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          Internal notes are strictly private to support agents and business admins. Customers
          cannot see these messages.
        </span>
      </div>

      <div className="space-y-3">
        {notes.map((n) => (
          <div
            key={n.id}
            className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-sm space-y-1 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
              <span>{n.author}</span>
              <span className="text-slate-400">{n.time}</span>
            </div>
            <p className="text-slate-800 font-medium">{n.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a private agent note regarding this ticket..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-sm"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Lock className="w-4 h-4" /> Add Private Note
        </Button>
      </form>
    </div>
  );
};
