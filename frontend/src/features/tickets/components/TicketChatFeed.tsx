import React, { useRef } from 'react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import {
  Headset,
  Eye,
  Paperclip,
  X,
  MessageSquare,
  Lock,
  Send,
  Image as ImageIcon,
  FileText,
  Check,
  CheckCheck,
} from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TicketChatFeedProps {
  ticket: any;
  allMessages: any[];
  user: any;
  typingUser: string | null;
  isAgentOrAdmin: boolean;
  isNoteMode: boolean;
  setIsNoteMode: (mode: boolean) => void;
  chatForm: UseFormReturn<any>;
  onSendChat: (data: any) => void;
  emitTyping: (isTyping: boolean) => void;
  fileDataUrl: string | null;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  setPreviewModalUrl: (url: string | null) => void;
  participantStatus?: 'online' | 'offline';
}

export const TicketChatFeed: React.FC<TicketChatFeedProps> = ({
  ticket,
  allMessages,
  user,
  typingUser,
  isAgentOrAdmin,
  isNoteMode,
  setIsNoteMode,
  chatForm,
  onSendChat,
  emitTyping,
  fileDataUrl,
  selectedFile,
  handleFileSelect,
  handleRemoveFile,
  setPreviewModalUrl,
  participantStatus = 'offline',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-[620px]">
      <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-none flex items-center gap-1.5">
              Real-Time Support Conversation
              <span
                className={`w-2 h-2 rounded-full border ${
                  participantStatus === 'online'
                    ? 'bg-emerald-500 border-emerald-600 animate-pulse'
                    : 'bg-slate-400 border-slate-500'
                }`}
                title={participantStatus === 'online' ? 'Participant is Online' : 'Participant is Offline'}
              />
            </span>
            <span className="text-xs text-slate-500 font-normal">
              Ticket #{ticket.ticketNumber || ticket.id?.substring(0, 6)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
        {allMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">Send a message to start the conversation.</p>
          </div>
        ) : (
          allMessages.map((msg: any, idx: number) => {
            const isMe = msg.senderId === user?.id;
            const isAgent = msg.sender?.role !== 'CUSTOMER';

            const hasImageAttachment =
              typeof msg.content === 'string' && msg.content.includes('data:image');
            let textContent = msg.content;
            let imageUrl = '';

            if (hasImageAttachment) {
              const parts = msg.content.split('data:image');
              textContent = parts[0];
              imageUrl = `data:image${parts[1]}`;
            }

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border shadow-2xs ${
                    isMe
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : isAgent
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {msg.sender?.fullName ? msg.sender.fullName[0].toUpperCase() : 'U'}
                </div>

                <div
                  className={`space-y-1 max-w-[80%] ${isMe ? 'items-end text-right' : 'items-start'}`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <span className="font-semibold text-slate-800">
                      {msg.sender?.fullName || 'User'}
                    </span>
                    <Badge
                      variant={isAgent ? 'purple' : 'warning'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {isAgent ? 'Support Team' : 'Customer'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                      {isMe && (
                        msg.isRead ? (
                          <span title="Read">
                            <CheckCheck className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />
                          </span>
                        ) : (
                          <span title="Sent">
                            <Check className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                          </span>
                        )
                      )}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-2xs space-y-2 ${
                      isMe
                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {textContent && <p>{textContent}</p>}

                    {imageUrl && (
                      <div className="pt-1">
                        <div
                          onClick={() => setPreviewModalUrl(imageUrl)}
                          className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200/80 max-w-xs shadow-sm"
                        >
                          <img
                            src={imageUrl}
                            alt="Chat attachment"
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" /> Click to Expand
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="text-xs font-semibold text-indigo-600 italic flex items-center gap-2 animate-pulse pt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            {typingUser} is typing a response...
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-900 shrink-0">
          <div className="flex items-center gap-2 truncate">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-indigo-500 font-normal">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form
        onSubmit={chatForm.handleSubmit(onSendChat)}
        className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0"
      >
        {isAgentOrAdmin && (
          <div className="flex items-center gap-2 pb-1 text-xs">
            <button
              type="button"
              onClick={() => setIsNoteMode(false)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                !isNoteMode
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Public Reply
            </button>
            <button
              type="button"
              onClick={() => setIsNoteMode(true)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                isNoteMode
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" /> Private Note
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 font-semibold p-3 rounded-xl shrink-0"
            title="Attach file or image"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <input
            type="text"
            placeholder={
              isNoteMode
                ? 'Write private internal note for team...'
                : 'Type public reply to customer...'
            }
            {...chatForm.register('message')}
            className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-1 font-medium shadow-2xs ${
              isNoteMode
                ? 'border-amber-200 focus:border-amber-500 focus:ring-amber-500 bg-amber-50/40'
                : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600 bg-white'
            }`}
          />

          <Button
            type="submit"
            variant="outline"
            size="md"
            className={`font-bold py-3 px-5 rounded-xl shadow-2xs shrink-0 transition-all ${
              isNoteMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
            }`}
          >
            <Send className="w-4 h-4 mr-1.5" /> {isNoteMode ? 'Save Note' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};
