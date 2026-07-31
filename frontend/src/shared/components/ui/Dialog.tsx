import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './Card';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  children,
  className = 'max-w-md',
}) => {
  // Lock body scroll when active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card
        glass
        className={`relative w-full bg-white/95 border border-slate-200 p-6 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div>{children}</div>
      </Card>
    </div>,
    document.body
  );
};
