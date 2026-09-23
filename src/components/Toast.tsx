import React, { useEffect } from 'react';
import { CheckCircle, Info, Flame, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900/95 border border-pink-500/40 text-white shadow-2xl shadow-pink-500/20 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30">
          <Flame className="w-4 h-4 fill-pink-400 text-pink-400" />
        </div>
        <div className="flex-1 text-xs text-zinc-200 font-medium leading-relaxed">
          {message}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
