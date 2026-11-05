import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { activeToast, clearToast } = useAuth();

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 animate-bounce-in">
      <div className="bg-[#14213D] text-[#F8FAFC] p-4 rounded-xl shadow-xl border border-[#E9B44C]/30 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#E9B44C] shrink-0 mt-0.5" />
        <div className="flex-1 text-sm font-medium leading-relaxed">{activeToast}</div>
        <button
          onClick={clearToast}
          className="text-[#94A3B8] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
