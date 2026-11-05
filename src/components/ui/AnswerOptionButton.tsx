import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AnswerOptionButtonProps {
  index: number;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

const ANSWER_CONFIGS = [
  {
    letter: 'A',
    symbol: '▲',
    label: 'Triangle',
    baseBg: 'bg-[#DC2626]',
    hoverBg: 'hover:bg-[#B91C1C]',
    shadow: 'shadow-[0_4px_0_0_#991B1B]',
    activeShadow: 'active:shadow-none active:translate-y-1',
    symbolBg: 'bg-white/20',
  },
  {
    letter: 'B',
    symbol: '◆',
    label: 'Diamond',
    baseBg: 'bg-[#2563EB]',
    hoverBg: 'hover:bg-[#1D4ED8]',
    shadow: 'shadow-[0_4px_0_0_#1E40AF]',
    activeShadow: 'active:shadow-none active:translate-y-1',
    symbolBg: 'bg-white/20',
  },
  {
    letter: 'C',
    symbol: '●',
    label: 'Circle',
    baseBg: 'bg-[#D97706]',
    hoverBg: 'hover:bg-[#B45309]',
    shadow: 'shadow-[0_4px_0_0_#92400E]',
    activeShadow: 'active:shadow-none active:translate-y-1',
    symbolBg: 'bg-white/20',
  },
  {
    letter: 'D',
    symbol: '■',
    label: 'Square',
    baseBg: 'bg-[#059669]',
    hoverBg: 'hover:bg-[#047857]',
    shadow: 'shadow-[0_4px_0_0_#065F46]',
    activeShadow: 'active:shadow-none active:translate-y-1',
    symbolBg: 'bg-white/20',
  },
];

export const AnswerOptionButton: React.FC<AnswerOptionButtonProps> = ({
  index,
  text,
  isSelected,
  isCorrect,
  isRevealed = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const config = ANSWER_CONFIGS[index % ANSWER_CONFIGS.length];

  // Visual styling depending on whether results are revealed
  let stateClasses = `${config.baseBg} ${config.shadow} ${config.hoverBg} text-white`;

  if (isRevealed) {
    if (isCorrect) {
      stateClasses = 'bg-[#16A34A] border-2 border-white shadow-[0_4px_0_0_#15803D] text-white scale-[1.02] ring-4 ring-emerald-300/60';
    } else if (isSelected && !isCorrect) {
      stateClasses = 'bg-red-700/80 border-2 border-red-300 shadow-none text-white opacity-85';
    } else {
      stateClasses = 'bg-slate-300 text-slate-500 shadow-none opacity-40';
    }
  } else if (isSelected) {
    stateClasses = `${config.baseBg} ring-4 ring-white shadow-xl scale-[1.01] brightness-110`;
  }

  const cursorClass = disabled ? 'cursor-default' : 'cursor-pointer';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left flex items-center gap-3.5 sm:gap-4 transition-all duration-150 select-none ${stateClasses} ${
        !disabled ? config.activeShadow : ''
      } ${cursorClass} ${className}`}
    >
      {/* Symbol Badge */}
      <span
        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0 backdrop-blur-xs transition-transform font-outfit ${config.symbolBg} ${
          isSelected && !isRevealed ? 'scale-110 bg-white text-[#14213D]' : 'text-white'
        }`}
      >
        <span className="text-sm sm:text-base mr-1 opacity-90">{config.symbol}</span>
        <span>{config.letter}</span>
      </span>

      {/* Answer text */}
      <span className="text-base sm:text-lg font-bold leading-snug flex-1 drop-shadow-xs font-inter">
        {text}
      </span>

      {/* Verification Icon when revealed */}
      {isRevealed && (
        <span className="shrink-0 animate-scale-in">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
          ) : isSelected ? (
            <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
          ) : null}
        </span>
      )}
    </button>
  );
};
