import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { allAvatars, getAvatarById } from '../../data/avatars.tsx';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { mockAchievements } from '../../data/mockAchievements';
import { championshipService } from '../../services/championshipService';
import type { AchievementBadge } from '../../types/bibleArena';
import {
  Trophy,
  Crown,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Palette,
  Check,
  Star,
  Lock,
  Edit3,
} from 'lucide-react';

interface ProfileViewProps {
  onExploreQuizzes: () => void;
  onHostArena?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onExploreQuizzes, onHostArena }) => {
  const { currentUser, userAttempts, saveAvatar, updateProfile } = useAuth();

  // Tab State: 'overview' or 'avatar-customizer'
  const [activeTab, setActiveTab] = useState<'overview' | 'avatar-customizer'>('overview');

  // Avatar Gallery State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(currentUser.avatar || 'hero-david');
  const [avatarCategoryFilter, setAvatarCategoryFilter] = useState<string>('all');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Edit Nickname Modal state
  const [isEditNicknameOpen, setIsEditNicknameOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(currentUser.nickname || '');

  // Achievement Modal state
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  // Championship local progress
  const champProgress = championshipService.loadProgress();

  // -------------------------------------------------------------------------
  // DYNAMIC LEVEL & STATS CALCULATION (Actual Player Data)
  // -------------------------------------------------------------------------
  const totalPoints = currentUser.totalPoints || 0;
  // Level threshold: 400 pts per level
  const playerLevel = Math.max(1, Math.floor(totalPoints / 400) + 1);
  const currentLevelBasePoints = (playerLevel - 1) * 400;
  const levelProgressPoints = totalPoints - currentLevelBasePoints;
  const levelProgressPercent = Math.min(100, Math.max(0, Math.round((levelProgressPoints / 400) * 100)));

  const getLevelTitle = (lvl: number): string => {
    if (lvl <= 2) return 'Scripture Seeker';
    if (lvl <= 5) return 'Word Apprentice';
    if (lvl <= 9) return 'Bible Disciple';
    if (lvl <= 15) return 'Faith Champion';
    if (lvl <= 25) return 'Scripture Master';
    return 'Grandmaster Theologian';
  };

  // Actual Games Played
  const gamesPlayed = (currentUser.quizzesCompleted || 0) + (champProgress.totalLevelsCompleted || 0);

  // Actual Games Won (Quizzes with >= 80% + completed championship levels)
  const passedQuizzes = userAttempts.filter((a) => a.percentage >= 80).length;
  const gamesWon = passedQuizzes + (champProgress.totalLevelsCompleted || 0);

  // Filtered Avatars
  const filteredAvatars = allAvatars.filter((av) => {
    if (avatarCategoryFilter === 'all') return true;
    return av.category === avatarCategoryFilter;
  });

  const previewAvatar = getAvatarById(selectedAvatarId);
  const isCurrentEquipped = (currentUser.avatar || 'hero-david') === selectedAvatarId;

  const handleSaveAvatar = async () => {
    setIsSavingAvatar(true);
    await saveAvatar(selectedAvatarId);
    setIsSavingAvatar(false);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setActiveTab('overview');
    }, 1200);
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    await updateProfile({ nickname: nicknameInput.trim(), name: nicknameInput.trim() });
    setIsEditNicknameOpen(false);
  };

  const getBadgeIcon = (icon: string) => {
    switch (icon) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'Award':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-purple-500" />;
      default:
        return <Award className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-24 text-[#0F172A]">
      {/* ------------------------------------------------------------------ */}
      {/* 1. PLAYER HERO CARD (Bright, Modern FunkWiz Style)                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Soft decorative background accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#7C3AED]/5 via-[#2563EB]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Player Identifiers */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('avatar-customizer')}>
              <AvatarDisplay
                avatar={currentUser.avatar}
                size="xl"
                className="w-22 h-22 sm:w-28 sm:h-28 rounded-3xl border-3 border-[#7C3AED] shadow-md transition-transform group-hover:scale-105"
              />
              <button
                className="absolute -bottom-2 -right-2 p-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl shadow-md transition-transform active:scale-95 border-2 border-white"
                title="Customize Avatar"
                aria-label="Change Avatar"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {currentUser.nickname || currentUser.name}
                </h1>
                <button
                  onClick={() => {
                    setNicknameInput(currentUser.nickname || '');
                    setIsEditNicknameOpen(true);
                  }}
                  className="p-1 text-[#64748B] hover:text-[#7C3AED] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
                  title="Edit nickname"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                  Level {playerLevel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#475569]">
                  {currentUser.role === 'member' ? 'Member' : 'Guest Contender'}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-[#64748B]">
                {getLevelTitle(playerLevel)} • {currentUser.groupAffiliation || 'BibleArena Community'}
              </p>

              {/* Word Study Streak */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                  <span>{currentUser.streakDays || 1}-Day Streak</span>
                </span>
                {currentUser.rank && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                    <Trophy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rank #{currentUser.rank}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Button
              variant={activeTab === 'avatar-customizer' ? 'primary' : 'outline'}
              size="md"
              onClick={() => setActiveTab(activeTab === 'avatar-customizer' ? 'overview' : 'avatar-customizer')}
              leftIcon={<Palette className="w-4 h-4" />}
              className="font-black text-xs sm:text-sm"
            >
              {activeTab === 'avatar-customizer' ? 'View Profile' : 'Change Avatar'}
            </Button>

            {onHostArena && (
              <Button
                variant="outline"
                size="md"
                onClick={onHostArena}
                className="font-bold text-xs sm:text-sm"
              >
                Host Arena
              </Button>
            )}

            <Button
              variant="gold"
              size="md"
              onClick={onExploreQuizzes}
              leftIcon={<BookOpen className="w-4 h-4" />}
              className="font-black text-xs sm:text-sm shadow-xs"
            >
              Play Quizzes
            </Button>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[#F1F5F9] space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#475569]">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Level {playerLevel} Progression</span>
            </span>
            <span className="font-mono text-[#7C3AED]">
              {levelProgressPoints} / 400 XP ({levelProgressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] transition-all duration-500"
              style={{ width: `${Math.max(4, levelProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. AVATAR CUSTOMIZER GALLERY TAB (Accessible right from Profile)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'avatar-customizer' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-8 animate-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-black uppercase tracking-wider mb-1">
                <Palette className="w-3.5 h-3.5" /> Faith Avatar Gallery
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                Choose Your Faith Avatar
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Select an illustrated biblical hero, heroine, or holy emblem to represent your identity across all live arenas and leaderboards.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="self-start sm:self-auto font-bold"
            >
              Done Customising
            </Button>
          </div>

          {/* Active Preview & Save Panel */}
          <div className="bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EDE9FE] rounded-3xl border-2 border-[#7C3AED]/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-5">
              <AvatarDisplay
                avatar={previewAvatar.id}
                size="2xl"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-md border-3 border-[#7C3AED]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                    {previewAvatar.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#7C3AED] text-white">
                    {previewAvatar.category}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#7C3AED]">
                  {previewAvatar.title} • {previewAvatar.scriptureReference}
                </p>
                <p className="text-xs sm:text-sm text-[#475569] max-w-lg leading-relaxed">
                  {previewAvatar.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {saveSuccessNotice ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-md animate-scale-in">
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Avatar Saved!</span>
                </div>
              ) : isCurrentEquipped ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4" /> Equipped
                </span>
              ) : (
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSaveAvatar}
                  disabled={isSavingAvatar}
                  leftIcon={<Check className="w-5 h-5 stroke-[3]" />}
                  className="font-black text-sm shadow-md w-full sm:w-auto"
                >
                  {isSavingAvatar ? 'Saving...' : 'Save Faith Avatar'}
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Avatars (24)' },
              { id: 'heroes', label: 'Biblical Heroes' },
              { id: 'heroines', label: 'Biblical Heroines' },
              { id: 'symbols', label: 'Faith Emblems' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAvatarCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  avatarCategoryFilter === cat.id
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Responsive Avatars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {filteredAvatars.map((av) => {
              const isSelected = selectedAvatarId === av.id;
              const isEquipped = (currentUser.avatar || 'hero-david') === av.id;

              return (
                <div
                  key={av.id}
                  onClick={() => setSelectedAvatarId(av.id)}
                  className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 group ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-md scale-105 ring-2 ring-[#7C3AED]/20'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {isEquipped && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" title="Currently equipped" />
                  )}
                  <AvatarDisplay
                    avatar={av.id}
                    size="lg"
                    bordered={false}
                    className="w-14 h-14 rounded-2xl shadow-xs"
                  />
                  <div className="text-center w-full min-w-0">
                    <span className="text-xs font-black text-[#0F172A] block truncate">
                      {av.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] block truncate">
                      {av.category === 'symbols' ? 'Emblem' : av.gender === 'female' ? 'Heroine' : 'Hero'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. FOUR CORE PLAYER METRICS (Actual Data)                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-100">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#0F172A] block">
            {totalPoints.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-[#64748B]">Total Points</span>
        </div>

        {/* Games Played */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#0F172A] block">
            {gamesPlayed}
          </span>
          <span className="text-xs font-bold text-[#64748B]">Games Played</span>
        </div>

        {/* Games Won */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
            {gamesWon}
          </span>
          <span className="text-xs font-bold text-[#64748B]">Games Won (80%+)</span>
        </div>

        {/* Biblical Accuracy */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 border border-purple-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-700 block">
            {currentUser.accuracy || 0}%
          </span>
          <span className="text-xs font-bold text-[#64748B]">Scripture Accuracy</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. 100-LEVEL CHAMPIONSHIP PROGRESS ROADMAP                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-200">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>100-Level Bible Championship Status</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#0F172A]">
            Current Rank: <span className="text-[#7C3AED]">{champProgress.highestStageUnlocked}</span>
          </h3>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl leading-relaxed">
            Progress is preserved locally. Master all 66 Protestant books across 5 difficulty stages by achieving 70%+ per level.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-[#64748B] font-bold">Levels Cleared: </span>
              <strong className="text-[#0F172A] font-black">{champProgress.totalLevelsCompleted} / 100</strong>
            </div>
            <div className="bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-[#64748B] font-bold">Stars Earned: </span>
              <strong className="text-amber-600 font-black">{champProgress.totalStarsEarned} ★</strong>
            </div>
            <div className="bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-[#64748B] font-bold">Active Level: </span>
              <strong className="text-[#7C3AED] font-black">Level {champProgress.currentLevel}</strong>
            </div>
          </div>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={() => {
            window.location.hash = 'championship';
          }}
          leftIcon={<Crown className="w-4 h-4 fill-current" />}
          className="font-black shrink-0 shadow-xs"
        >
          Resume Championship
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ACHIEVEMENTS SECTION (Light FunkWiz Theme)                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F59E0B]" />
              <span>Scripture Achievements</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Milestones unlocked through faithful study and competition
            </p>
          </div>
          <span className="text-xs font-black text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-full border border-[#7C3AED]/20">
            {mockAchievements.filter((a) => a.isUnlocked).length} / {mockAchievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mockAchievements.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                badge.isUnlocked
                  ? 'bg-white border-[#E2E8F0] hover:border-[#7C3AED] hover:shadow-md'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60 hover:opacity-100'
              }`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
                    badge.isUnlocked
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  {badge.isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <h4 className="text-xs sm:text-sm font-black text-[#0F172A] line-clamp-1">
                  {badge.title}
                </h4>
                <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2 leading-tight">
                  {badge.description}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-[#F1F5F9]">
                {badge.isUnlocked ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> {badge.unlockedDate || 'Unlocked'}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#94A3B8] font-bold block">
                    {badge.progressLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. RECENT GAME HISTORY (Actual user attempts)                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <h3 className="font-black text-[#0F172A] text-base sm:text-lg">
            Recent Game History ({userAttempts.length})
          </h3>
          <span className="text-xs font-semibold text-[#64748B]">Personal attempt log</span>
        </div>

        {userAttempts.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-[#0F172A]">
                No game history recorded yet.
              </h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Complete self-paced quizzes or live multiplayer rounds to see your scores and dates recorded here.
              </p>
            </div>
            <Button
              variant="gold"
              size="md"
              onClick={onExploreQuizzes}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-black"
            >
              Start First Quiz
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {userAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F1F5F9] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#7C3AED]/10 text-[#7C3AED]">
                      {att.category}
                    </span>
                    <span className="text-xs text-[#94A3B8]">{att.date}</span>
                  </div>
                  <h4 className="text-sm font-black text-[#0F172A]">
                    {att.quizTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#64748B] block uppercase">Score</span>
                    <span
                      className={`text-sm font-black ${
                        att.percentage >= 80 ? 'text-emerald-600' : 'text-[#7C3AED]'
                      }`}
                    >
                      {att.score}/{att.totalQuestions} ({att.percentage}%)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#64748B] block uppercase">Duration</span>
                    <span className="text-xs font-mono font-bold text-[#0F172A]">
                      {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nickname Edit Modal */}
      {isEditNicknameOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditNicknameOpen(false)}
          title="Update Player Nickname"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveNickname} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Player Nickname
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={24}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                placeholder="e.g. David, Grace, TruthSeeker"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditNicknameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" size="sm" className="font-bold">
                Save Nickname
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Achievement Detail Modal */}
      {selectedBadge && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBadge(null)}
          title="Achievement Milestone"
          maxWidth="sm"
        >
          <div className="text-center space-y-4 py-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
              {getBadgeIcon(selectedBadge.icon)}
            </div>
            <div>
              <h3 className="text-base font-black text-[#0F172A]">{selectedBadge.title}</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs font-bold text-[#475569] border border-[#E2E8F0]">
              {selectedBadge.isUnlocked ? (
                <span className="text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Unlocked on {selectedBadge.unlockedDate || 'Active Milestone'}
                </span>
              ) : (
                <span>Requirement: {selectedBadge.progressLabel}</span>
              )}
            </div>
            <Button variant="outline" size="sm" fullWidth onClick={() => setSelectedBadge(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
