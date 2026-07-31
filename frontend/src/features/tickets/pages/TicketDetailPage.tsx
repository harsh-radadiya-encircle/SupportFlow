import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const chatSchema = z.object({
  message: z.string().optional(),
});
const noteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
});
const csatSchema = z.object({
  score: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().optional(),
});

type ChatFormValues = z.infer<typeof chatSchema>;
type NoteFormValues = z.infer<typeof noteSchema>;
type CsatFormValues = z.infer<typeof csatSchema>;
import {
  useTicketDetail,
  useUpdateTicketStatus,
  useAssignTicket,
  useAddInternalNote,
  useSocketChat,
  useSubmitCsat,
} from '../hooks/useTickets';
import { useInvitations } from '../../invitations/hooks/useInvitations';
import { useAuthStore } from '../../../shared/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { TicketHeader } from '../components/TicketHeader';
import { TicketMetadataSidebar } from '../components/TicketMetadataSidebar';
import { TicketChatFeed } from '../components/TicketChatFeed';
import { TicketActivitySidebar } from '../components/TicketActivitySidebar';
import { AlertTriangle, ArrowLeft, Download, Image as ImageIcon, X } from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = id || '';

  const { user } = useAuthStore();
  const isAgentOrAdmin =
    user?.role === 'SUPPORT_AGENT' ||
    user?.role === 'BUSINESS_ADMIN' ||
    user?.role === 'PLATFORM_ADMIN';

  const { data, isLoading, isError, error } = useTicketDetail(ticketId);
  const teamQuery = useInvitations(isAgentOrAdmin);

  const updateStatusMutation = useUpdateTicketStatus();
  const assignAgentMutation = useAssignTicket();
  const addNoteMutation = useAddInternalNote();
  const submitCsatMutation = useSubmitCsat();

  const { messages: socketMessages, typingUser, sendMessage, emitTyping } = useSocketChat(ticketId);

  const [isNoteMode, setIsNoteMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'notes' | 'timeline'>('notes');

  const chatForm = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
  });

  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: '' },
  });

  const csatForm = useForm<CsatFormValues>({
    resolver: zodResolver(csatSchema),
    defaultValues: { score: 0, comment: '' },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (previewModalUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewModalUrl]);

  const ticket = data?.data;
  const agentsList = teamQuery.data?.data?.agents || [];

  // Combine initial database messages + real-time socket messages
  const initialMessages = ticket?.messages || [];
  const allMessages = [...initialMessages];
  socketMessages.forEach((sMsg) => {
    if (!allMessages.some((m) => m.id === sMsg.id)) {
      allMessages.push(sMsg);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSendChat = (data: ChatFormValues) => {
    const input = data.message || '';
    if (!input.trim() && !fileDataUrl) return;

    if (isAgentOrAdmin && isNoteMode) {
      // Send as Private Internal Note
      const noteContent = fileDataUrl
        ? `${input.trim()}\n\n[Attached File: ${selectedFile?.name}]`
        : input.trim();

      addNoteMutation.mutate(
        { id: ticketId, content: noteContent },
        {
          onSuccess: () => {
            chatForm.reset();
            handleRemoveFile();
            toast.success('Private internal note saved');
          },
        }
      );
    } else {
      // Send as Public Chat Message
      let contentToSend = input.trim();
      if (fileDataUrl) {
        contentToSend = `${contentToSend} ${fileDataUrl}`.trim();
      }

      sendMessage(contentToSend);
      chatForm.reset();
      handleRemoveFile();
    }
  };

  const onAddNote = (data: NoteFormValues) => {
    addNoteMutation.mutate(
      { id: ticketId, content: data.note.trim() },
      {
        onSuccess: () => noteForm.reset(),
      }
    );
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading support ticket details...</p>
      </div>
    );
  }

  const onSubmitCsat = (data: CsatFormValues) => {
    submitCsatMutation.mutate({
      id: ticketId,
      score: data.score,
      comment: data.comment || '',
    });
  };

  if (isError || !ticket) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2 max-w-xl mx-auto mt-8">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Ticket Not Found or Access Denied</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'Unable to view ticket.'}
        </p>
        <Link to="/customer/tickets" className="inline-block mt-2">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Ticket List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      <TicketHeader ticket={ticket} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TicketChatFeed
          ticket={ticket}
          allMessages={allMessages}
          user={user}
          typingUser={typingUser}
          isAgentOrAdmin={isAgentOrAdmin}
          isNoteMode={isNoteMode}
          setIsNoteMode={setIsNoteMode}
          chatForm={chatForm}
          onSendChat={onSendChat}
          emitTyping={emitTyping}
          fileDataUrl={fileDataUrl}
          selectedFile={selectedFile}
          handleFileSelect={handleFileSelect}
          handleRemoveFile={handleRemoveFile}
          setPreviewModalUrl={setPreviewModalUrl}
        />

        <div className="lg:col-span-4 space-y-6">
          <TicketMetadataSidebar
            ticket={ticket}
            agentsList={agentsList}
            isAgentOrAdmin={isAgentOrAdmin}
            updateStatusMutation={updateStatusMutation}
            assignAgentMutation={assignAgentMutation}
            submitCsatMutation={submitCsatMutation}
            csatForm={csatForm}
            onSubmitCsat={onSubmitCsat}
          />
          <TicketActivitySidebar
            ticket={ticket}
            isAgentOrAdmin={isAgentOrAdmin}
            activeRightTab={activeRightTab}
            setActiveRightTab={setActiveRightTab}
            noteForm={noteForm}
            onAddNote={onAddNote}
            addNoteMutation={addNoteMutation}
          />
        </div>
      </div>

      {previewModalUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={() => setPreviewModalUrl(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-slate-900/95 rounded-3xl border border-white/15 p-4 sm:p-6 shadow-2xl space-y-4 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Attachment Preview
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Click download or press escape to close
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewModalUrl}
                    download="supportflow_attachment.png"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-indigo-400" /> Download
                  </a>
                  <button
                    onClick={() => setPreviewModalUrl(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white flex items-center justify-center border border-white/10 transition-all duration-200 hover:rotate-90"
                    title="Close Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center p-2 rounded-2xl bg-black/40 border border-white/5 max-h-[75vh] overflow-hidden">
                <img
                  src={previewModalUrl}
                  alt="Attachment High-Res Preview"
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
