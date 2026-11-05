import React from 'react';
import type { QuizDifficulty, BibleCategory } from '../../types/bibleArena';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'royal' | 'navy' | 'success' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  const variantClasses = {
    default: 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE]',
    gold: 'bg-amber-50 text-[#D97706] font-bold border border-amber-200',
    royal: 'bg-[#7C3AED] text-white font-bold',
    navy: 'bg-[#1E1B4B] text-white font-bold',
    success: 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200',
    danger: 'bg-red-50 text-red-700 font-bold border border-red-200',
    outline: 'border border-[#CBD5E1] text-[#64748B] bg-white font-medium',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-outfit ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: BibleCategory; className?: string }> = ({ category, className }) => {
  return (
    <Badge variant="default" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
      {category}
    </Badge>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: QuizDifficulty; className?: string }> = ({ difficulty, className }) => {
  if (difficulty === 'Easy') {
    return (
      <Badge variant="success" size="sm" className={className}>
        ● Easy
      </Badge>
    );
  }
  if (difficulty === 'Medium') {
    return (
      <Badge variant="gold" size="sm" className={className}>
        ● Medium
      </Badge>
    );
  }
  return (
    <Badge variant="danger" size="sm" className={className}>
      ● Hard
    </Badge>
  );
};
