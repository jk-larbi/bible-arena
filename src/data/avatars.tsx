import React from 'react';

export type AvatarCategory = 'heroes' | 'heroines' | 'symbols';

export interface AvatarItem {
  id: string;
  name: string;
  title: string;
  category: AvatarCategory;
  gender?: 'male' | 'female';
  era?: string;
  description: string;
  scriptureReference: string;
  primaryColor: string; // for border/glow
  badgeBg: string; // background fill for avatar frame
  renderSvg: (props: { className?: string; size?: number }) => React.ReactElement;
}

// ----------------------------------------------------------------------------
// 24 ORIGINAL FAITH-INSPIRED GAME AVATARS (Illustrated Vector Characters & Emblems)
// Styled with vibrant, polished FunkWiz gaming aesthetic (crisp lines, clean color blocks)
// ----------------------------------------------------------------------------

export const allAvatars: AvatarItem[] = [
  // ==========================================
  // 1. BIBLICAL HEROES (MALE CHARACTERS)
  // ==========================================
  {
    id: 'hero-david',
    name: 'David',
    title: 'The Shepherd Champion',
    category: 'heroes',
    gender: 'male',
    era: 'United Kingdom',
    description: 'Youthful courage, brown curls, linen tunic, and an unshakeable faith in God against giants.',
    scriptureReference: '1 Samuel 17:45',
    primaryColor: '#F59E0B',
    badgeBg: '#FEF3C7',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
        {/* Soft background halo */}
        <circle cx="50" cy="45" r="32" fill="#FDE68A" fillOpacity="0.5" />
        {/* Body / Shepherd Tunic */}
        <path d="M25 88 C25 72 36 68 50 68 C64 68 75 72 75 88 Z" fill="#D97706" />
        <path d="M42 68 L50 82 L58 68 Z" fill="#FBBF24" />
        {/* Neck */}
        <rect x="44" y="58" width="12" height="12" rx="4" fill="#FCD34D" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="17" ry="19" fill="#FDE68A" />
        {/* Brown Curly Hair */}
        <path d="M33 42 C30 35 34 26 44 24 C50 22 56 22 62 25 C68 28 71 36 67 44 C65 42 62 42 60 44 C56 36 44 36 40 44 C37 42 34 42 33 42 Z" fill="#78350F" />
        <circle cx="34" cy="38" r="5" fill="#78350F" />
        <circle cx="66" cy="38" r="5" fill="#78350F" />
        {/* Headband / Cord */}
        <path d="M33 36 Q50 32 67 36" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        {/* Confident Eyes & Eyebrows */}
        <path d="M40 41 Q44 39 47 41" stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 41 Q56 39 60 41" stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="43.5" cy="45" r="2.2" fill="#451A03" />
        <circle cx="56.5" cy="45" r="2.2" fill="#451A03" />
        <circle cx="44.2" cy="44.3" r="0.7" fill="#FFFFFF" />
        <circle cx="57.2" cy="44.3" r="0.7" fill="#FFFFFF" />
        {/* Nose */}
        <path d="M50 46 L49 50 L52 50" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
        {/* Warm Smile */}
        <path d="M45 54 Q50 58 55 54" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        {/* Sling Silhouette Star */}
        <circle cx="76" cy="24" r="7" fill="#F59E0B" />
        <path d="M76 19 L77.5 22.5 L81 24 L77.5 25.5 L76 29 L74.5 25.5 L71 24 L74.5 22.5 Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'hero-daniel',
    name: 'Daniel',
    title: 'The Wise Statesman',
    category: 'heroes',
    gender: 'male',
    era: 'Babylonian Exile',
    description: 'Nobleman with regal royal-purple vestments, scholar trim beard, and uncompromising integrity.',
    scriptureReference: 'Daniel 6:10',
    primaryColor: '#7C3AED',
    badgeBg: '#F3E8FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="3" />
        <circle cx="50" cy="45" r="32" fill="#E9D5FF" fillOpacity="0.5" />
        {/* Royal Babylonian Robe */}
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#6D28D9" />
        <path d="M38 66 L50 88 L62 66 Z" fill="#F59E0B" />
        <path d="M44 66 L50 84 L56 66 Z" fill="#7C3AED" />
        {/* Neck */}
        <rect x="44" y="56" width="12" height="12" rx="4" fill="#FCD34D" />
        {/* Head */}
        <ellipse cx="50" cy="44" rx="16" ry="18" fill="#FDE68A" />
        {/* Dark Hair & Trim Beard */}
        <path d="M34 40 C32 28 40 22 50 22 C60 22 68 28 66 40 C63 36 57 32 50 32 C43 32 37 36 34 40 Z" fill="#1E1B4B" />
        <path d="M40 54 C40 64 60 64 60 54 C56 58 44 58 40 54 Z" fill="#1E1B4B" />
        {/* Gold Circlet / Headband */}
        <path d="M34 32 Q50 28 66 32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="30" r="2.5" fill="#F59E0B" />
        {/* Thoughtful Eyes */}
        <circle cx="44" cy="42" r="2" fill="#1E1B4B" />
        <circle cx="56" cy="42" r="2" fill="#1E1B4B" />
        <path d="M41 38 Q44 36 47 38" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 38 Q56 36 59 38" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Nose & Gentle Smile */}
        <path d="M50 44 L49 48 L52 48" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M46 52 Q50 54 54 52" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hero-samson',
    name: 'Samson',
    title: 'The Nazarite Champion',
    category: 'heroes',
    gender: 'male',
    era: 'Judges',
    description: 'Long flowing warrior braids, lion-skin cloak, broad shoulders, and fearless strength.',
    scriptureReference: 'Judges 15:14',
    primaryColor: '#DC2626',
    badgeBg: '#FEE2E2',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FEE2E2" stroke="#DC2626" strokeWidth="3" />
        {/* Strong Shoulders */}
        <path d="M20 88 C20 68 34 64 50 64 C66 64 80 68 80 88 Z" fill="#991B1B" />
        {/* Lion Mantle Fur */}
        <path d="M28 66 Q35 72 40 66 Q45 74 50 66 Q55 74 60 66 Q65 72 72 66 L75 88 L25 88 Z" fill="#B45309" />
        {/* Neck */}
        <rect x="42" y="54" width="16" height="14" rx="4" fill="#FCD34D" />
        {/* Head */}
        <ellipse cx="50" cy="44" rx="17" ry="18" fill="#FDE68A" />
        {/* Long Nazarite Hair Braids */}
        <path d="M31 38 C28 26 38 20 50 20 C62 20 72 26 69 38 L72 62 L67 62 L66 45 C62 38 58 36 50 36 C42 36 38 38 34 45 L33 62 L28 62 Z" fill="#451A03" />
        {/* Fierce / Competitive Brow */}
        <path d="M39 41 L47 43" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M61 41 L53 43" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="43" cy="45" r="2.2" fill="#451A03" />
        <circle cx="57" cy="45" r="2.2" fill="#451A03" />
        <circle cx="43.7" cy="44.3" r="0.8" fill="#FFFFFF" />
        <circle cx="57.7" cy="44.3" r="0.8" fill="#FFFFFF" />
        {/* Determined Jaw / Smile */}
        <path d="M50 46 L48 51 L52 51" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M44 55 Q50 58 56 55" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hero-elijah',
    name: 'Elijah',
    title: 'The Resolute Prophet',
    category: 'heroes',
    gender: 'male',
    era: 'Kings of Israel',
    description: 'Mature weathered elder, rugged traveler mantle, and passionate eyes that called down fire.',
    scriptureReference: '1 Kings 18:37',
    primaryColor: '#EA580C',
    badgeBg: '#FFEDD5',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFEDD5" stroke="#EA580C" strokeWidth="3" />
        {/* Rough Mantle / Cloak */}
        <path d="M22 88 C22 68 34 65 50 65 C66 65 78 68 78 88 Z" fill="#7C2D12" />
        <path d="M38 65 L50 88 L62 65 Z" fill="#9A3412" />
        {/* Full Prophet Beard */}
        <ellipse cx="50" cy="43" rx="16" ry="17" fill="#FDE68A" />
        <path d="M34 46 C32 62 40 74 50 74 C60 74 68 62 66 46 C60 48 56 46 50 46 C44 46 40 48 34 46 Z" fill="#E2E8F0" />
        {/* Gray/White Hair */}
        <path d="M32 40 C30 26 38 20 50 20 C62 20 70 26 68 40 C62 30 38 30 32 40 Z" fill="#CBD5E1" />
        {/* Resolute Eyes */}
        <circle cx="43" cy="40" r="2.2" fill="#1E293B" />
        <circle cx="57" cy="40" r="2.2" fill="#1E293B" />
        <path d="M39 37 Q44 35 47 37" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <path d="M53 37 Q56 35 61 37" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        {/* Fire Spark Badge */}
        <circle cx="78" cy="24" r="7" fill="#EA580C" />
        <path d="M78 20 Q81 23 81 25 Q81 28 78 29 Q75 28 75 25 Q75 22 78 20 Z" fill="#FBBF24" />
      </svg>
    ),
  },
  {
    id: 'hero-gideon',
    name: 'Gideon',
    title: 'The Valiant Commander',
    category: 'heroes',
    gender: 'male',
    era: 'Judges',
    description: 'Youthful strategist with linen combat sash, observant eyes, and torch of victory.',
    scriptureReference: 'Judges 7:20',
    primaryColor: '#059669',
    badgeBg: '#D1FAE5',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#D1FAE5" stroke="#059669" strokeWidth="3" />
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#065F46" />
        <path d="M36 66 L50 88 L64 66 Z" fill="#10B981" />
        <rect x="44" y="56" width="12" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="16" ry="18" fill="#FDE68A" />
        {/* Headband / Warrior Cloth */}
        <path d="M33 38 C32 28 40 22 50 22 C60 22 68 28 67 38 C64 34 58 32 50 32 C42 32 36 34 33 38 Z" fill="#92400E" />
        <rect x="33" y="32" width="34" height="5" rx="2" fill="#059669" />
        {/* Alert Eyes */}
        <circle cx="43.5" cy="43" r="2.2" fill="#1C1917" />
        <circle cx="56.5" cy="43" r="2.2" fill="#1C1917" />
        <path d="M40 39 Q44 38 47 40" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 40 Q56 38 60 39" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M45 52 Q50 56 55 52" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hero-joseph',
    name: 'Joseph',
    title: 'The Dreamer of Egypt',
    category: 'heroes',
    gender: 'male',
    era: 'Patriarchs',
    description: 'Noble youth adorned in the iconic coat of vibrant colors, visionary and forgiving.',
    scriptureReference: 'Genesis 37:3',
    primaryColor: '#2563EB',
    badgeBg: '#DBEAFE',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#DBEAFE" stroke="#2563EB" strokeWidth="3" />
        {/* Coat of Many Colors Striped Robe */}
        <path d="M22 88 C22 70 34 66 50 66 C66 66 78 70 78 88 Z" fill="#2563EB" />
        <path d="M28 88 L35 68 L42 88 Z" fill="#EF4444" />
        <path d="M42 88 L50 66 L58 88 Z" fill="#F59E0B" />
        <path d="M58 88 L65 68 L72 88 Z" fill="#10B981" />
        <path d="M46 66 L50 88 L54 66 Z" fill="#8B5CF6" />
        {/* Head */}
        <rect x="44" y="56" width="12" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="16" ry="18" fill="#FDE68A" />
        {/* Jet Black Hair */}
        <path d="M33 40 C31 28 39 22 50 22 C61 22 69 28 67 40 C62 34 38 34 33 40 Z" fill="#0F172A" />
        {/* Kind Visionary Eyes */}
        <circle cx="43.5" cy="43" r="2.2" fill="#0F172A" />
        <circle cx="56.5" cy="43" r="2.2" fill="#0F172A" />
        <path d="M40 39 Q44 38 47 40" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 40 Q56 38 60 39" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M44 53 Q50 57 56 53" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hero-nehemiah',
    name: 'Nehemiah',
    title: 'The Master Builder',
    category: 'heroes',
    gender: 'male',
    era: 'Restoration',
    description: 'Determined leader with builder headwrap, vigilant posture, and prayerful dedication.',
    scriptureReference: 'Nehemiah 4:14',
    primaryColor: '#0D9488',
    badgeBg: '#CCFBF1',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#CCFBF1" stroke="#0D9488" strokeWidth="3" />
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#115E59" />
        <path d="M42 66 L50 82 L58 66 Z" fill="#F59E0B" />
        <rect x="44" y="56" width="12" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="16" ry="18" fill="#FDE68A" />
        {/* Builder Headdress */}
        <path d="M30 36 C30 24 40 20 50 20 C60 20 70 24 70 36 L68 44 L32 44 Z" fill="#0D9488" />
        <ellipse cx="50" cy="28" rx="18" ry="6" fill="#14B8A6" />
        {/* Focused Eyes */}
        <circle cx="43.5" cy="43" r="2.2" fill="#134E4A" />
        <circle cx="56.5" cy="43" r="2.2" fill="#134E4A" />
        <path d="M40 40 L47 41" stroke="#134E4A" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M60 40 L53 41" stroke="#134E4A" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M45 53 Q50 56 55 53" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hero-paul',
    name: 'Paul',
    title: 'Apostle to the Nations',
    category: 'heroes',
    gender: 'male',
    era: 'Early Church',
    description: 'Mature scholarly traveler, leather travel cowl, passionate intellectual gaze, writing the Epistles.',
    scriptureReference: '2 Timothy 4:7',
    primaryColor: '#4F46E5',
    badgeBg: '#E0E7FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="3" />
        <path d="M22 88 C22 68 34 65 50 65 C66 65 78 68 78 88 Z" fill="#3730A3" />
        <path d="M40 65 L50 88 L60 65 Z" fill="#6366F1" />
        <ellipse cx="50" cy="43" rx="16" ry="17" fill="#FDE68A" />
        {/* Mature Trim Beard */}
        <path d="M36 46 C36 60 43 68 50 68 C57 68 64 60 64 46 C58 50 54 48 50 48 C46 48 42 50 36 46 Z" fill="#4B5563" />
        {/* Receding Dark / Silver Hair */}
        <path d="M34 40 C32 30 38 24 50 24 C62 24 68 30 66 40 C62 36 58 34 50 34 C42 34 38 36 34 40 Z" fill="#374151" />
        {/* Piercing Intellect Eyes */}
        <circle cx="43.5" cy="41" r="2.2" fill="#1F2937" />
        <circle cx="56.5" cy="41" r="2.2" fill="#1F2937" />
        <path d="M40 37 Q44 35 47 38" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <path d="M53 38 Q56 35 60 37" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 52 Q50 54 54 52" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // ==========================================
  // 2. BIBLICAL HEROINES (FEMALE CHARACTERS)
  // ==========================================
  {
    id: 'heroine-ruth',
    name: 'Ruth',
    title: 'The Faithful Harvester',
    category: 'heroines',
    gender: 'female',
    era: 'Judges',
    description: 'Graceful harvest veil, warm compassionate smile, golden wheat wreath, steadfast loyalty.',
    scriptureReference: 'Ruth 1:16',
    primaryColor: '#F59E0B',
    badgeBg: '#FEF3C7',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
        {/* Graceful Linen Robe */}
        <path d="M25 88 C25 72 36 68 50 68 C64 68 75 72 75 88 Z" fill="#D97706" />
        <path d="M40 68 L50 85 L60 68 Z" fill="#FDE68A" />
        <rect x="45" y="58" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="46" rx="15" ry="18" fill="#FDE68A" />
        {/* Soft Flowing Harvest Veil */}
        <path d="M30 40 C30 24 40 18 50 18 C60 18 70 24 70 40 L73 70 L65 70 L64 48 C60 40 56 36 50 36 C44 36 40 40 36 48 L35 70 L27 70 Z" fill="#FEF08A" />
        {/* Wheat Stalk Accent */}
        <path d="M68 28 Q72 24 76 22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="76" cy="22" r="2.5" fill="#F59E0B" />
        <circle cx="72" cy="26" r="2" fill="#F59E0B" />
        {/* Warm Compassionate Eyes & Smile */}
        <circle cx="44" cy="44" r="2.2" fill="#78350F" />
        <circle cx="56" cy="44" r="2.2" fill="#78350F" />
        <circle cx="44.6" cy="43.3" r="0.7" fill="#FFFFFF" />
        <circle cx="56.6" cy="43.3" r="0.7" fill="#FFFFFF" />
        <path d="M41 40 Q44 38 47 40" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40 Q56 38 59 40" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 54 Q50 58 55 54" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'heroine-esther',
    name: 'Esther',
    title: 'The Courageous Queen',
    category: 'heroines',
    gender: 'female',
    era: 'Persian Empire',
    description: 'Golden diadem crown, royal violet mantle, poised elegance, and unwavering bravery for her people.',
    scriptureReference: 'Esther 4:14',
    primaryColor: '#9333EA',
    badgeBg: '#F3E8FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F3E8FF" stroke="#9333EA" strokeWidth="3" />
        {/* Royal Queen Gown */}
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#7E22CE" />
        <path d="M38 66 L50 88 L62 66 Z" fill="#F59E0B" />
        <rect x="45" y="56" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="15" ry="18" fill="#FDE68A" />
        {/* Dark Lustrous Hair */}
        <path d="M32 40 C30 26 38 20 50 20 C62 20 70 26 68 40 L71 62 L64 62 L63 46 C60 38 40 38 37 46 L36 62 L29 62 Z" fill="#1E1B4B" />
        {/* Golden Queen Diadem */}
        <path d="M36 28 L41 33 L50 24 L59 33 L64 28 L62 34 L38 34 Z" fill="#F59E0B" />
        <circle cx="50" cy="24" r="2" fill="#EF4444" />
        {/* Poised Confident Eyes */}
        <circle cx="44" cy="42" r="2.2" fill="#1E1B4B" />
        <circle cx="56" cy="42" r="2.2" fill="#1E1B4B" />
        <circle cx="44.7" cy="41.3" r="0.7" fill="#FFFFFF" />
        <circle cx="56.7" cy="41.3" r="0.7" fill="#FFFFFF" />
        <path d="M41 38 Q44 36 47 38" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 38 Q56 36 59 38" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 52 Q50 56 55 52" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'heroine-deborah',
    name: 'Deborah',
    title: 'The Judge of Wisdom',
    category: 'heroines',
    gender: 'female',
    era: 'Judges',
    description: 'Dignified elder statesman, woven palm-leaf circlet, deep wisdom, and decisive battlefield leadership.',
    scriptureReference: 'Judges 4:9',
    primaryColor: '#059669',
    badgeBg: '#D1FAE5',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#D1FAE5" stroke="#059669" strokeWidth="3" />
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#047857" />
        <path d="M42 66 L50 82 L58 66 Z" fill="#FCD34D" />
        <rect x="45" y="56" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="15" ry="17" fill="#FDE68A" />
        {/* Palm Crown Headdress */}
        <path d="M30 40 C30 24 40 18 50 18 C60 18 70 24 70 40 L68 56 L32 56 Z" fill="#065F46" />
        <ellipse cx="50" cy="26" rx="17" ry="5" fill="#34D399" />
        {/* Wise Discernment Eyes */}
        <circle cx="44" cy="42" r="2.2" fill="#064E3B" />
        <circle cx="56" cy="42" r="2.2" fill="#064E3B" />
        <path d="M41 38 Q44 36 47 38" stroke="#064E3B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 38 Q56 36 59 38" stroke="#064E3B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M46 52 Q50 55 54 52" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'heroine-miriam',
    name: 'Miriam',
    title: 'The Joyful Singer',
    category: 'heroines',
    gender: 'female',
    era: 'Exodus',
    description: 'Radiant praise leader, embroidered festive headscarf, joyful cheerful expression, and timbrel motif.',
    scriptureReference: 'Exodus 15:20',
    primaryColor: '#0284C7',
    badgeBg: '#E0F2FE',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" />
        <path d="M25 88 C25 72 36 68 50 68 C64 68 75 72 75 88 Z" fill="#0369A1" />
        <path d="M40 68 L50 85 L60 68 Z" fill="#38BDF8" />
        <rect x="45" y="58" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="46" rx="15" ry="18" fill="#FDE68A" />
        {/* Embroidered Blue / Coral Headwrap */}
        <path d="M30 40 C30 24 40 18 50 18 C60 18 70 24 70 40 L72 64 L65 64 L64 48 C60 40 40 40 36 48 L35 64 L28 64 Z" fill="#0284C7" />
        <rect x="34" y="32" width="32" height="4" rx="2" fill="#F43F5E" />
        {/* Radiant Joyful Eyes & Wide Smile */}
        <circle cx="44" cy="44" r="2.2" fill="#0C4A6E" />
        <circle cx="56" cy="44" r="2.2" fill="#0C4A6E" />
        <path d="M41 40 Q44 38 47 40" stroke="#0C4A6E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40 Q56 38 59 40" stroke="#0C4A6E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M44 54 Q50 60 56 54" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'heroine-priscilla',
    name: 'Priscilla',
    title: 'The Teacher of Truth',
    category: 'heroines',
    gender: 'female',
    era: 'Early Church',
    description: 'Scholarly neat hair braids, linen mantle, welcoming articulate smile, explaining the Word accurately.',
    scriptureReference: 'Acts 18:26',
    primaryColor: '#7C3AED',
    badgeBg: '#EDE9FE',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="3" />
        <path d="M25 88 C25 72 36 68 50 68 C64 68 75 72 75 88 Z" fill="#5B21B6" />
        <path d="M42 68 L50 82 L58 68 Z" fill="#A78BFA" />
        <rect x="45" y="58" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="46" rx="15" ry="18" fill="#FDE68A" />
        {/* Neat Braided Dark Hair */}
        <path d="M32 42 C30 28 38 22 50 22 C62 22 70 28 68 42 C64 36 36 36 32 42 Z" fill="#2E1065" />
        <circle cx="34" cy="48" r="4" fill="#2E1065" />
        <circle cx="66" cy="48" r="4" fill="#2E1065" />
        {/* Friendly Intelligent Eyes */}
        <circle cx="44" cy="44" r="2.2" fill="#2E1065" />
        <circle cx="56" cy="44" r="2.2" fill="#2E1065" />
        <circle cx="44.7" cy="43.3" r="0.7" fill="#FFFFFF" />
        <circle cx="56.7" cy="43.3" r="0.7" fill="#FFFFFF" />
        <path d="M41 40 Q44 38 47 40" stroke="#2E1065" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40 Q56 38 59 40" stroke="#2E1065" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 53 Q50 57 55 53" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'heroine-lydia',
    name: 'Lydia',
    title: 'The Visionary Host',
    category: 'heroines',
    gender: 'female',
    era: 'Early Church',
    description: 'Royal Tyrian purple vestments, gold trim clasp, confident hospitable visionary.',
    scriptureReference: 'Acts 16:14',
    primaryColor: '#A855F7',
    badgeBg: '#FAF5FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FAF5FF" stroke="#A855F7" strokeWidth="3" />
        {/* Tyrian Purple Gown */}
        <path d="M24 88 C24 70 36 66 50 66 C64 66 76 70 76 88 Z" fill="#7E22CE" />
        <path d="M40 66 L50 86 L60 66 Z" fill="#F59E0B" />
        <rect x="45" y="56" width="10" height="12" rx="4" fill="#FCD34D" />
        <ellipse cx="50" cy="44" rx="15" ry="18" fill="#FDE68A" />
        {/* Rich Headdress */}
        <path d="M30 38 C30 22 40 18 50 18 C60 18 70 22 70 38 L68 54 L32 54 Z" fill="#6B21A8" />
        <ellipse cx="50" cy="24" rx="16" ry="4" fill="#F59E0B" />
        <circle cx="44" cy="42" r="2.2" fill="#3B0764" />
        <circle cx="56" cy="42" r="2.2" fill="#3B0764" />
        <path d="M41 38 Q44 36 47 38" stroke="#3B0764" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 38 Q56 36 59 38" stroke="#3B0764" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 52 Q50 56 55 52" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },

  // ==========================================
  // 3. FAITH & SCRIPTURE EMBLEMS
  // ==========================================
  {
    id: 'symbol-lion',
    name: 'Lion of Judah',
    title: 'Strength & Sovereignty',
    category: 'symbols',
    description: 'Golden heraldic lion with crown of majesty, symbol of fearless faith and divine power.',
    scriptureReference: 'Revelation 5:5',
    primaryColor: '#D97706',
    badgeBg: '#FEF3C7',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
        {/* Radiant Mane */}
        <circle cx="50" cy="52" r="30" fill="#B45309" />
        <path d="M50 20 L54 30 L64 25 L64 35 L74 34 L70 44 L80 48 L72 56 L80 62 L70 66 L74 76 L64 74 L62 84 L52 79 L48 88 L44 79 L34 84 L36 74 L26 76 L30 66 L20 62 L28 56 L20 48 L30 44 L26 34 L36 35 L36 25 L46 30 Z" fill="#D97706" />
        {/* Lion Face */}
        <ellipse cx="50" cy="54" rx="20" ry="18" fill="#FBBF24" />
        {/* Ears */}
        <circle cx="36" cy="38" r="6" fill="#B45309" />
        <circle cx="36" cy="38" r="3" fill="#FDE68A" />
        <circle cx="64" cy="38" r="6" fill="#B45309" />
        <circle cx="64" cy="38" r="3" fill="#FDE68A" />
        {/* Crown on Lion */}
        <path d="M40 28 L44 32 L50 24 L56 32 L60 28 L58 35 L42 35 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
        <circle cx="50" cy="24" r="1.5" fill="#EF4444" />
        {/* Eyes */}
        <ellipse cx="43" cy="50" rx="3" ry="2.2" fill="#78350F" />
        <ellipse cx="57" cy="50" rx="3" ry="2.2" fill="#78350F" />
        <circle cx="43.5" cy="49.5" r="0.8" fill="#FFFFFF" />
        <circle cx="57.5" cy="49.5" r="0.8" fill="#FFFFFF" />
        {/* Muzzle & Nose */}
        <path d="M47 56 L53 56 L50 60 Z" fill="#78350F" />
        <path d="M50 60 L50 64" stroke="#78350F" strokeWidth="1.5" />
        <path d="M46 64 Q50 66 54 64" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'symbol-dove',
    name: 'Dove of Peace',
    title: 'Spirit of Truth',
    category: 'symbols',
    description: 'Ascending white dove bearing an olive sprig, illuminated by a celestial golden sunburst.',
    scriptureReference: 'Matthew 3:16',
    primaryColor: '#2563EB',
    badgeBg: '#EFF6FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#EFF6FF" stroke="#2563EB" strokeWidth="3" />
        {/* Golden Sunburst Glow */}
        <circle cx="50" cy="48" r="28" fill="#DBEAFE" />
        <circle cx="50" cy="48" r="18" fill="#FEF3C7" />
        {/* Ascending White Dove Wings */}
        <path d="M50 48 C40 32 20 30 18 42 C24 46 36 50 46 54 Z" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
        <path d="M50 48 C60 32 80 30 82 42 C76 46 64 50 54 54 Z" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
        {/* Tail Feathers */}
        <path d="M46 56 L50 74 L54 56 Z" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
        {/* Dove Body & Head */}
        <ellipse cx="50" cy="50" rx="7" ry="11" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
        <circle cx="50" cy="38" r="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
        <circle cx="48" cy="37" r="1.2" fill="#1E3A8A" />
        {/* Beak & Olive Leaf */}
        <path d="M47 38 L42 39 L47 41 Z" fill="#F59E0B" />
        <path d="M42 39 Q36 36 34 40" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="35" cy="38" rx="3" ry="1.5" fill="#10B981" />
      </svg>
    ),
  },
  {
    id: 'symbol-crown',
    name: 'Crown of Life',
    title: 'The Victorious Reward',
    category: 'symbols',
    description: 'Polished multifaceted gold crown on royal violet cushion, representing endurance and victory.',
    scriptureReference: 'James 1:12',
    primaryColor: '#F59E0B',
    badgeBg: '#FFFBEB',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="3" />
        {/* Royal Cushion */}
        <ellipse cx="50" cy="74" rx="30" ry="8" fill="#6B21A8" stroke="#4C1D95" strokeWidth="2" />
        <ellipse cx="50" cy="72" rx="26" ry="6" fill="#7E22CE" />
        {/* Crown Base */}
        <rect x="25" y="56" width="50" height="10" rx="3" fill="#D97706" />
        <rect x="26" y="57" width="48" height="8" rx="2" fill="#F59E0B" />
        {/* Crown Jewels on Base */}
        <circle cx="34" cy="61" r="2.5" fill="#EF4444" />
        <circle cx="42" cy="61" r="2.5" fill="#3B82F6" />
        <circle cx="50" cy="61" r="2.5" fill="#10B981" />
        <circle cx="58" cy="61" r="2.5" fill="#3B82F6" />
        <circle cx="66" cy="61" r="2.5" fill="#EF4444" />
        {/* Crown Peaks */}
        <path d="M25 56 L32 38 L41 48 L50 30 L59 48 L68 38 L75 56 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
        {/* Jewels on Top Peaks */}
        <circle cx="32" cy="38" r="3.5" fill="#EF4444" />
        <circle cx="50" cy="30" r="4.5" fill="#3B82F6" />
        <circle cx="68" cy="38" r="3.5" fill="#EF4444" />
      </svg>
    ),
  },
  {
    id: 'symbol-shield',
    name: 'Shield of Faith',
    title: 'The Fortress Defense',
    category: 'symbols',
    description: 'Burnished gold and royal-blue crested heater shield with faith cross emblem, extinguishing arrows.',
    scriptureReference: 'Ephesians 6:16',
    primaryColor: '#2563EB',
    badgeBg: '#EFF6FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#EFF6FF" stroke="#2563EB" strokeWidth="3" />
        {/* Heater Shield Body */}
        <path d="M26 26 C42 26 50 20 50 20 C50 20 58 26 74 26 C74 54 50 78 50 78 C50 78 26 54 26 26 Z" fill="#1D4ED8" stroke="#F59E0B" strokeWidth="3.5" />
        {/* Inner Shield Rim */}
        <path d="M30 30 C44 30 50 24 50 24 C50 24 56 30 70 30 C70 52 50 72 50 72 C50 72 30 52 30 30 Z" fill="#2563EB" />
        {/* Golden Cross Emblem */}
        <rect x="46" y="32" width="8" height="32" rx="2" fill="#F59E0B" />
        <rect x="36" y="40" width="28" height="8" rx="2" fill="#F59E0B" />
        <circle cx="50" cy="44" r="3" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'symbol-scroll',
    name: 'Living Word Scroll',
    title: 'Eternal Truth',
    category: 'symbols',
    description: 'Unfurled aged parchment scroll with golden wooden rollers and sacred Scripture calligraphy.',
    scriptureReference: 'Psalm 119:105',
    primaryColor: '#D97706',
    badgeBg: '#FFFBEB',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFFBEB" stroke="#D97706" strokeWidth="3" />
        {/* Wooden Roller Knobs */}
        <rect x="20" y="24" width="8" height="52" rx="3" fill="#78350F" />
        <rect x="72" y="24" width="8" height="52" rx="3" fill="#78350F" />
        <circle cx="24" cy="22" r="4" fill="#F59E0B" />
        <circle cx="24" cy="78" r="4" fill="#F59E0B" />
        <circle cx="76" cy="22" r="4" fill="#F59E0B" />
        <circle cx="76" cy="78" r="4" fill="#F59E0B" />
        {/* Unfurled Parchment */}
        <rect x="26" y="28" width="48" height="44" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
        {/* Calligraphy Lines */}
        <line x1="33" y1="36" x2="67" y2="36" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="42" x2="67" y2="42" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="48" x2="61" y2="48" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="54" x2="67" y2="54" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="60" x2="55" y2="60" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'symbol-lamp',
    name: 'Lamp of Truth',
    title: 'The Guiding Light',
    category: 'symbols',
    description: 'Clay biblical oil lamp with brilliant golden flame, lighting the faithful traveler path.',
    scriptureReference: 'Proverbs 6:23',
    primaryColor: '#EA580C',
    badgeBg: '#FFF7ED',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFF7ED" stroke="#EA580C" strokeWidth="3" />
        {/* Radiant Flame Glow */}
        <circle cx="34" cy="34" r="16" fill="#FDE68A" fillOpacity="0.6" />
        {/* Flame */}
        <path d="M34 22 C37 26 42 32 40 37 C39 40 36 42 33 42 C29 42 27 39 28 36 C29 32 32 26 34 22 Z" fill="#F59E0B" />
        <path d="M34 28 C36 31 38 34 37 37 C36 39 34 40 33 40 C31 40 30 38 31 36 C32 34 33 30 34 28 Z" fill="#EF4444" />
        {/* Terracotta Biblical Lamp Body */}
        <path d="M24 46 C24 46 22 52 30 56 C38 60 62 60 68 52 C74 46 70 42 66 42 C62 42 58 44 50 44 C40 44 32 44 24 46 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2" />
        {/* Lamp Base & Handle */}
        <ellipse cx="48" cy="62" rx="18" ry="4" fill="#9A3412" />
        <path d="M66 44 C76 44 78 56 68 56" stroke="#9A3412" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'symbol-anchor',
    name: 'Anchor of Hope',
    title: 'Steadfast & Sure',
    category: 'symbols',
    description: 'Nautical burnished gold anchor entwined with laurel, representing an unshakeable anchor of the soul.',
    scriptureReference: 'Hebrews 6:19',
    primaryColor: '#0284C7',
    badgeBg: '#F0F9FF',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F0F9FF" stroke="#0284C7" strokeWidth="3" />
        {/* Ring on top */}
        <circle cx="50" cy="26" r="6" stroke="#D97706" strokeWidth="3" fill="none" />
        {/* Crossbar */}
        <line x1="34" y1="37" x2="66" y2="37" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
        {/* Vertical Shaft */}
        <line x1="50" y1="28" x2="50" y2="72" stroke="#D97706" strokeWidth="4.5" strokeLinecap="round" />
        {/* Curved Flukes */}
        <path d="M26 56 C26 74 74 74 74 56" stroke="#D97706" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* Left Arrow Fluke */}
        <path d="M23 58 L26 52 L31 57 Z" fill="#B45309" />
        {/* Right Arrow Fluke */}
        <path d="M77 58 L74 52 L69 57 Z" fill="#B45309" />
      </svg>
    ),
  },
  {
    id: 'symbol-olive',
    name: 'Olive Branch',
    title: 'The Covenant of Peace',
    category: 'symbols',
    description: 'Lush green olive branch with ripe olives and ribbon of grace, herald of new beginnings.',
    scriptureReference: 'Genesis 8:11',
    primaryColor: '#16A34A',
    badgeBg: '#F0FDF4',
    renderSvg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F0FDF4" stroke="#16A34A" strokeWidth="3" />
        {/* Main Branch Stem */}
        <path d="M25 75 Q40 55 75 25" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        {/* Leaves */}
        <path d="M42 55 Q35 45 42 38 Q48 45 42 55 Z" fill="#16A34A" stroke="#14532D" strokeWidth="1" />
        <path d="M52 45 Q50 33 58 30 Q60 40 52 45 Z" fill="#22C55E" stroke="#14532D" strokeWidth="1" />
        <path d="M62 35 Q68 22 75 25 Q72 35 62 35 Z" fill="#16A34A" stroke="#14532D" strokeWidth="1" />
        <path d="M35 62 Q25 58 26 50 Q35 52 35 62 Z" fill="#22C55E" stroke="#14532D" strokeWidth="1" />
        <path d="M48 60 Q45 70 52 74 Q56 64 48 60 Z" fill="#15803D" stroke="#14532D" strokeWidth="1" />
        {/* Olives */}
        <ellipse cx="48" cy="48" rx="4" ry="5.5" fill="#4D7C0F" stroke="#365314" strokeWidth="1" />
        <ellipse cx="60" cy="40" rx="4" ry="5.5" fill="#3F6212" stroke="#365314" strokeWidth="1" />
      </svg>
    ),
  },
];

export const avatars = allAvatars;

export const defaultAvatarId = 'hero-david';

export function getAvatarById(id: string): AvatarItem {
  const found = allAvatars.find((a) => a.id === id);
  if (found) return found;

  // Map legacy emojis or names if found
  if (id === '🕊️') return allAvatars.find((a) => a.id === 'symbol-dove') || allAvatars[0];
  if (id === '👑') return allAvatars.find((a) => a.id === 'symbol-crown') || allAvatars[0];
  if (id === '🛡️') return allAvatars.find((a) => a.id === 'symbol-shield') || allAvatars[0];
  if (id === '📜') return allAvatars.find((a) => a.id === 'symbol-scroll') || allAvatars[0];
  if (id === '🏮') return allAvatars.find((a) => a.id === 'symbol-lamp') || allAvatars[0];
  if (id === '🌿') return allAvatars.find((a) => a.id === 'symbol-olive') || allAvatars[0];
  if (id === '🦁') return allAvatars.find((a) => a.id === 'symbol-lion') || allAvatars[0];
  if (id === '⚓') return allAvatars.find((a) => a.id === 'symbol-anchor') || allAvatars[0];

  return allAvatars[0];
}
