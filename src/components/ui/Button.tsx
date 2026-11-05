import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold rounded-xl gap-1.5 shadow-[0_3px_0_0]',
    md: 'px-4 py-2.5 text-sm font-extrabold rounded-2xl gap-2 shadow-[0_4px_0_0]',
    lg: 'px-6 py-3.5 text-base font-black rounded-2xl gap-2.5 shadow-[0_5px_0_0]',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-[#5B21B6] border border-[#7C3AED]/30 active:translate-y-1 active:shadow-none',
    gold:
      'bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] shadow-[#B45309] border border-[#F59E0B]/40 active:translate-y-1 active:shadow-none',
    secondary:
      'bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#DDD6FE] shadow-[#C4B5FD] border border-[#7C3AED]/20 active:translate-y-1 active:shadow-none',
    outline:
      'bg-white text-[#0F172A] hover:bg-[#F8FAFC] border-2 border-[#E2E8F0] hover:border-[#7C3AED] shadow-[#E2E8F0] active:translate-y-1 active:shadow-none',
    ghost:
      'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#EDE9FE]/50 shadow-none border border-transparent active:translate-y-0.5',
    danger:
      'bg-red-500 text-white hover:bg-red-600 shadow-[#991B1B] border border-red-600/30 active:translate-y-1 active:shadow-none',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-40 cursor-not-allowed pointer-events-none shadow-none transform-none'
    : 'cursor-pointer transition-all duration-100 select-none';

  return (
    <button
      className={`inline-flex items-center justify-center tracking-wide ${sizeStyles} ${variantStyles} ${disabledStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
