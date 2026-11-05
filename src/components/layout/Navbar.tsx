import React, { useState, useRef, useEffect } from 'react';
import { BibleCrossIcon } from '../ui/BibleCrossIcon';
import { Button } from '../ui/Button';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { QRScannerModal } from '../ui/QRScannerModal';
import {
  Gamepad2,
  BookOpen,
  Trophy,
  UserCheck,
  PlusCircle,
  LogOut,
  LogIn,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Hash,
  Crown,
  Flame,
  Camera,
} from 'lucide-react';

export type AppPage =
  | 'home'
  | 'explore'
  | 'join-arena'
  | 'create-arena'
  | 'leaderboard'
  | 'profile'
  | 'my-progress'
  | 'create-quiz'
  | 'championship'
  | 'game-modes';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage, extraParams?: { quizId?: string; pin?: string }) => void;
  onQuickJoinPin?: (pin: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onQuickJoinPin,
}) => {
  const { currentUser, userRole, logout, isSupabaseReady } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickPin, setQuickPin] = useState('');
  const [showQuickPinBar, setShowQuickPinBar] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks: { id: AppPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <BibleCrossIcon className="w-4 h-4" /> },
    { id: 'championship', label: '200 Levels', icon: <Crown className="w-4 h-4 text-[#F59E0B]" />, badge: 'NEW' },
    { id: 'game-modes', label: '18 Modes', icon: <Flame className="w-4 h-4 text-[#7C3AED]" /> },
    { id: 'explore', label: 'Quizzes', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'join-arena', label: 'Join Game', icon: <Gamepad2 className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserCheck className="w-4 h-4 text-[#7C3AED]" /> },
  ];

  const handleQuickPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPin.trim().length === 6) {
      if (onQuickJoinPin) {
        onQuickJoinPin(quickPin.trim());
      } else {
        onNavigate('join-arena', { pin: quickPin.trim() });
      }
      setQuickPin('');
      setShowQuickPinBar(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#0F172A] shadow-xs border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Tagline */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-150">
                <BibleCrossIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-[#0F172A] flex items-center gap-0.5">
                  Bible<span className="text-[#7C3AED]">Arena</span>
                </span>
                <span className="hidden sm:inline text-[10px] text-[#64748B] font-bold tracking-wider uppercase">
                  Scripture Knowledge & Gaming
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id || (link.id === 'profile' && currentPage === 'my-progress');
                return (
                  <button
                    key={link.id}
                    onClick={() => onNavigate(link.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-xs translate-y-[-1px]'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                        link.badge === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cloud Sync Status Indicator */}
              <div className="hidden lg:flex items-center">
                {isSupabaseReady ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    title="Connected to Supabase Realtime backend"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Live
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200"
                    title="Running in local mode"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Local Mode
                  </span>
                )}
              </div>

              {/* Quick PIN button */}
              <button
                onClick={() => setShowQuickPinBar(!showQuickPinBar)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] hover:bg-[#E2E8F0] transition-all cursor-pointer shadow-xs active:translate-y-0.5"
                title="Quick enter Game PIN"
              >
                <Hash className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Enter PIN</span>
              </button>

              {/* Quick QR Scanner button */}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] hover:bg-[#DDD6FE] transition-all cursor-pointer shadow-xs active:translate-y-0.5"
                title="Scan Host QR Code with Camera"
              >
                <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Scan QR</span>
              </button>

              {/* Create Game Button (Host CTA) */}
              <Button
                variant="gold"
                size="sm"
                onClick={() => onNavigate('create-arena')}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                className="hidden md:inline-flex font-black text-xs"
              >
                Host Arena
              </Button>

              {/* Profile / Avatar Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-[#F1F5F9] transition-colors border border-[#CBD5E1] cursor-pointer bg-white"
                  aria-label="User profile menu"
                >
                  <AvatarDisplay
                    avatar={currentUser.avatar}
                    size="sm"
                    bordered={false}
                    className="w-7 h-7 sm:w-8 sm:h-8"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-black text-[#0F172A] leading-tight line-clamp-1">
                      {currentUser.nickname}
                    </span>
                    <span className="text-[10px] text-[#7C3AED] font-extrabold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {currentUser.totalPoints} pts
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-[#0F172A] rounded-3xl shadow-xl border border-[#CBD5E1] py-3 z-50 animate-scale-in">
                    <div className="px-4 pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-3">
                        <AvatarDisplay
                          avatar={currentUser.avatar}
                          size="md"
                          className="w-12 h-12 rounded-2xl"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#0F172A] truncate">{currentUser.name}</p>
                          <p className="text-xs text-[#64748B] truncate">@{currentUser.nickname}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-black rounded-full bg-[#EDE9FE] text-[#7C3AED] uppercase">
                            {userRole === 'admin' ? 'Admin' : userRole === 'member' ? 'Member' : 'Guest'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#F1F5F9] text-center">
                        <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                          <span className="block text-[10px] font-bold text-[#64748B]">Score</span>
                          <span className="text-xs font-black text-[#7C3AED]">{currentUser.totalPoints} pts</span>
                        </div>
                        <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                          <span className="block text-[10px] font-bold text-[#64748B]">Accuracy</span>
                          <span className="text-xs font-black text-emerald-600">
                            {currentUser.accuracy || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-[#7C3AED]" />
                        <span>Player Profile & Avatars</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onNavigate('create-arena');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
                        <span>Host Live Arena</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] px-3">
                      {userRole === 'guest' ? (
                        <Button
                          variant="gold"
                          size="sm"
                          fullWidth
                          onClick={() => {
                            setIsProfileOpen(false);
                            setAuthMode('signin');
                            setIsAuthModalOpen(true);
                          }}
                          leftIcon={<LogIn className="w-4 h-4" />}
                          className="font-bold text-xs"
                        >
                          Sign In / Register
                        </Button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick PIN Input Expansion Dropdown */}
        {showQuickPinBar && (
          <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-3 sm:px-6">
            <form onSubmit={handleQuickPinSubmit} className="max-w-md mx-auto flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#7C3AED] shrink-0 font-outfit">Game PIN:</span>
              <input
                type="text"
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits (e.g. 842915)"
                maxLength={6}
                className="w-full px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] font-outfit font-black text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
              <Button type="submit" variant="gold" size="sm" className="shrink-0 font-bold">
                Join
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickPinBar(false);
                  setIsScannerOpen(true);
                }}
                className="p-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7C3AED] transition-colors cursor-pointer shrink-0"
                title="Scan QR Code instead"
              >
                <Camera className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#E2E8F0] px-4 py-4 space-y-2 animate-fade-in shadow-xl">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsScannerOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] font-black text-xs flex items-center justify-center gap-2 cursor-pointer font-outfit shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR to Join Live Arena</span>
            </button>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate(link.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm font-extrabold cursor-pointer ${
                  currentPage === link.id
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    link.badge === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Real QR Code Camera Scanner */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedPin) => {
          setIsScannerOpen(false);
          if (onQuickJoinPin) {
            onQuickJoinPin(scannedPin);
          } else {
            onNavigate('join-arena', { pin: scannedPin });
          }
        }}
      />
    </>
  );
};
