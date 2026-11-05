import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const BibleCrossIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Book outline */}
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 2v20" />
      {/* Latin Cross on the cover */}
      <line x1="13" y1="6" x2="13" y2="15" strokeWidth="2.2" />
      <line x1="10" y1="9" x2="16" y2="9" strokeWidth="2.2" />
    </svg>
  );
};
