import React, { useRef, useEffect } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (pin: string) => void;
  size?: 'md' | 'lg';
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  onComplete,
  size = 'lg',
  disabled = false,
  hasError = false,
  className = '',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep value sanitized to 6 digits max
  const digits = value.replace(/\D/g, '').slice(0, 6).split('');
  while (digits.length < 6) {
    digits.push('');
  }

  useEffect(() => {
    if (value.length === 6 && onComplete) {
      onComplete(value);
    }
  }, [value, onComplete]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      // Clear current digit
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join('').trim());
      return;
    }

    if (rawVal.length > 1) {
      // Pasted multiple digits
      const sanitized = rawVal.slice(0, 6);
      onChange(sanitized);
      const nextIdx = Math.min(sanitized.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = rawVal;
    const combined = newDigits.join('').trim();
    onChange(combined);

    // Auto-advance to next slot
    if (index < 5 && rawVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const targetIdx = Math.min(pasted.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const isLg = size === 'lg';

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {digits.map((digit, idx) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            aria-label={`PIN digit ${idx + 1}`}
            className={`font-mono font-extrabold text-center rounded-2xl border-2 transition-all duration-150 select-none shadow-xs focus:outline-none focus:scale-105 ${
              isLg
                ? 'w-11 h-14 sm:w-13 sm:h-16 text-2xl sm:text-3xl'
                : 'w-9 h-11 sm:w-10 sm:h-13 text-xl sm:text-2xl'
            } ${
              hasError
                ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-4 focus:ring-red-200'
                : isFilled
                ? 'border-[#234E91] bg-white text-[#14213D] shadow-md ring-2 ring-[#234E91]/15'
                : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#14213D] focus:border-[#E9B44C] focus:bg-white focus:ring-4 focus:ring-[#E9B44C]/30'
            }`}
          />
        );
      })}
    </div>
  );
};
