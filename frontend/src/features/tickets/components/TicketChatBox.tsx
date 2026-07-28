import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Send } from 'lucide-react';

interface MessageItem {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  time: string;
}

interface TicketChatBoxProps {
  messages: MessageItem[];
  currentUserRole?: string;
  onSendMessage: (text: string) => void;
}

export const TicketChatBox: React.FC<TicketChatBoxProps> = ({
  messages,
  currentUserRole,
  onSendMessage,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="min-h-[300px] max-h-[450px] overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.senderRole === currentUserRole ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-600">{m.senderName}</span>
              <span className="text-[10px] text-slate-400">{m.time}</span>
            </div>
            <div
              className={`max-w-md p-3.5 rounded-2xl text-sm font-medium shadow-sm ${
                m.senderRole === currentUserRole
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your response to the customer..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm"
        />
        <Button type="submit" variant="primary" size="md">
          <Send className="w-4 h-4" /> Send
        </Button>
      </form>
    </div>
  );
};
