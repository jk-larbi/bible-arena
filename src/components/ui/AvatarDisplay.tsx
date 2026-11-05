import React, { useState } from 'react';
import { getAvatarById, allAvatars } from '../../data/avatars.tsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

interface AvatarDisplayProps {
  avatar?: string | null;
  size?: AvatarSize;
  className?: string;
  bordered?: boolean;
  borderColor?: string;
  alt?: string;
  showBadge?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
  custom: '',
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 'md',
  className = '',
  bordered = true,
  borderColor,
  alt = 'Player Avatar',
  showBadge = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const raw = (avatar || '').trim();
  const isUrl = (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) && !imgError;

  // Check if it's one of our registered vector avatars
  const matched = allAvatars.find((a) => a.id === raw);
  const avatarObj = matched || getAvatarById(raw);

  const borderStyle = bordered
    ? borderColor
      ? `border-2 border-[${borderColor}] shadow-xs`
      : 'border-2 border-[#7C3AED]/30 shadow-xs'
    : '';

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (isUrl) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClass} ${className}`}>
        <img
          src={raw}
          alt={alt}
          onError={() => setImgError(true)}
          className={`w-full h-full rounded-2xl object-cover bg-white ${borderStyle}`}
        />
        {showBadge && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400" />
        )}
      </div>
    );
  }

  // Render Illustrated Vector Avatar
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none ${sizeClass} ${borderStyle} ${className}`}
      style={{ backgroundColor: avatarObj.badgeBg }}
      title={`${avatarObj.name} — ${avatarObj.title}`}
    >
      <div className="w-full h-full p-0.5 flex items-center justify-center">
        {avatarObj.renderSvg({ className: 'w-full h-full' })}
      </div>
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400" />
      )}
    </div>
  );
};
