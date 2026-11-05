import React from 'react';
import type { AppPage } from './Navbar';
import { Compass, Gamepad2, House, Trophy, UserRound } from 'lucide-react';

interface AppNavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isGameplayActive?: boolean;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentPage,
  onNavigate,
  isGameplayActive = false,
}) => {
  // Route-Aware Active States
  const isDiscoverActive = currentPage === 'explore' || currentPage === 'create-quiz';
  const isGamesActive = currentPage === 'game-modes';
  const isHomeActive = currentPage === 'home';
  const isCompeteActive =
    currentPage === 'championship' ||
    currentPage === 'leaderboard' ||
    currentPage === 'join-arena' ||
    currentPage === 'create-arena';
  const isProfileActive = currentPage === 'profile' || currentPage === 'my-progress';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 select-none pb-[env(safe-area-inset-bottom,0px)] sm:bottom-6 sm:pb-0 transition-all duration-300 transform ${
        isGameplayActive
          ? 'translate-y-36 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100 pointer-events-none'
      }`}
      aria-label="Main Bottom Navigation"
      data-testid="main-bottom-navigation"
    >
      <div className="max-w-[480px] sm:max-w-[500px] w-full mx-auto px-3 sm:px-4 pointer-events-auto">
        {/* Sculptural Dock Container with Precision SVG Notch & Wave Silhouette */}
        <div className="relative filter drop-shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          {/* Background Frame: Left Wing, Fixed-Center SVG Wave Notch, Right Wing */}
          <div className="flex items-end h-[88px] sm:h-[92px] w-full">
            {/* Left Shoulder Wing with rounded top-left corner */}
            <div className="flex-1 h-[66px] sm:h-[68px] bg-white rounded-tl-[28px] sm:rounded-tl-[32px] sm:rounded-bl-[24px]" />

            {/* Precision Wave Silhouette with Crests and Circular Valley Notch */}
            <svg
              width="140"
              height="92"
              viewBox="0 0 140 92"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 -mb-[0.5px]"
              aria-hidden="true"
            >
              <path
                d="
                  M 0 24
                  C 12 24 22 18 30 12
                  C 38 6 46 12 52 24
                  C 58 36 62 66 70 66
                  C 78 66 82 36 88 24
                  C 94 12 102 6 110 12
                  C 118 18 128 24 140 24
                  L 140 92
                  L 0 92
                  Z
                "
                fill="#FFFFFF"
              />
            </svg>

            {/* Right Shoulder Wing with rounded top-right corner */}
            <div className="flex-1 h-[66px] sm:h-[68px] bg-white rounded-tr-[28px] sm:rounded-tr-[32px] sm:rounded-br-[24px]" />
          </div>

          {/* Bottom extension to fill mobile safe-area on iOS / Android */}
          <div className="bg-white h-[max(env(safe-area-inset-bottom,0px),4px)] sm:hidden w-full" />

          {/* Center Elevated Action: Floating Gradient Home Sphere with Radiant Glow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[2px] sm:top-[4px] z-20 flex flex-col items-center justify-center pointer-events-auto">
            {/* Vibrant Multi-Tone Ambient Blur Glow (Magenta / Purple / Blue) */}
            <div
              className={`absolute top-[12px] sm:top-[14px] w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full pointer-events-none transition-all duration-300 ${
                isHomeActive ? 'opacity-90 scale-105' : 'opacity-65 hover:opacity-85'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 50% 60%, rgba(236, 72, 153, 0.7) 0%, rgba(139, 92, 246, 0.6) 45%, rgba(37, 99, 235, 0.75) 100%)',
                filter: 'blur(16px)',
              }}
            />

            {/* Raised Circular Sphere with Electric Blue / Royal Gradient */}
            <button
              onClick={() => onNavigate('home')}
              className={`group relative w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] rounded-full flex items-center justify-center text-white cursor-pointer focus:outline-none transition-all duration-200 active:scale-95 ${
                isHomeActive
                  ? 'scale-105 shadow-[0_12px_28px_rgba(37,99,235,0.48)]'
                  : 'shadow-[0_10px_24px_rgba(37,99,235,0.4)] hover:scale-105 hover:shadow-[0_14px_28px_rgba(37,99,235,0.5)]'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 38% 28%, #3B82F6 0%, #2563EB 45%, #1D4ED8 80%, #3730A3 100%)',
              }}
              title="Home Dashboard"
              aria-label="Home"
              aria-current={isHomeActive ? 'page' : undefined}
              data-nav-destination="home"
            >
              <House className="w-7 h-7 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-transform duration-200 group-hover:scale-105" />
            </button>
            {/* Active glowing micro-indicator beneath central home button */}
            <div
              className={`h-[3px] rounded-full transition-all duration-300 mt-1 ${
                isHomeActive
                  ? 'w-3 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_2px_8px_rgba(37,99,235,0.8)] opacity-100 scale-100'
                  : 'w-0 bg-transparent opacity-0 scale-50'
              }`}
            />
          </div>

          {/* Interactive Navigation Icons Overlay: Discover | Games | [HOME] | Compete | Profile */}
          <div className="absolute bottom-0 left-0 right-0 h-[66px] sm:h-[68px] flex items-center justify-between px-2 sm:px-5 z-10 pointer-events-auto">
            {/* Left Wing Icons: Discover (explore) & Games (game-modes) */}
            <div className="flex-1 flex items-center justify-around pr-1">
              {/* 1. Discover Destination */}
              <button
                onClick={() => onNavigate('explore')}
                className="group relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl cursor-pointer focus:outline-none transition-all duration-200 active:scale-90"
                title="Discover Quizzes & Curriculum"
                aria-label="Discover"
                aria-current={isDiscoverActive ? 'page' : undefined}
                data-nav-destination="discover"
              >
                <div
                  className={`flex flex-col items-center transition-all duration-200 transform ${
                    isDiscoverActive
                      ? 'text-[#2563EB] -translate-y-0.5 scale-105 drop-shadow-[0_4px_10px_rgba(37,99,235,0.35)]'
                      : 'text-[#8E9AA8] group-hover:text-[#0F172A] group-hover:-translate-y-0.5'
                  }`}
                >
                  <Compass className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={2} />
                  <span
                    className={`text-[10px] font-semibold tracking-tight mt-0.5 transition-colors duration-200 ${
                      isDiscoverActive ? 'text-[#2563EB]' : 'text-[#8E9AA8] group-hover:text-[#0F172A]'
                    }`}
                  >
                    Discover
                  </span>
                </div>
                {/* Active Indicator Glow Pill */}
                <div
                  className={`h-[3px] rounded-full transition-all duration-300 mt-0.5 ${
                    isDiscoverActive
                      ? 'w-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_2px_8px_rgba(37,99,235,0.7)] opacity-100 scale-100'
                      : 'w-0 bg-transparent opacity-0 scale-50'
                  }`}
                  data-nav-indicator="discover"
                />
              </button>

              {/* 2. Games Destination */}
              <button
                onClick={() => onNavigate('game-modes')}
                className="group relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl cursor-pointer focus:outline-none transition-all duration-200 active:scale-90"
                title="Interactive Games & Game Modes"
                aria-label="Games"
                aria-current={isGamesActive ? 'page' : undefined}
                data-nav-destination="games"
              >
                <div
                  className={`flex flex-col items-center transition-all duration-200 transform ${
                    isGamesActive
                      ? 'text-[#2563EB] -translate-y-0.5 scale-105 drop-shadow-[0_4px_10px_rgba(37,99,235,0.35)]'
                      : 'text-[#8E9AA8] group-hover:text-[#0F172A] group-hover:-translate-y-0.5'
                  }`}
                >
                  <Gamepad2 className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={2} />
                  <span
                    className={`text-[10px] font-semibold tracking-tight mt-0.5 transition-colors duration-200 ${
                      isGamesActive ? 'text-[#2563EB]' : 'text-[#8E9AA8] group-hover:text-[#0F172A]'
                    }`}
                  >
                    Games
                  </span>
                </div>
                {/* Active Indicator Glow Pill */}
                <div
                  className={`h-[3px] rounded-full transition-all duration-300 mt-0.5 ${
                    isGamesActive
                      ? 'w-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_2px_8px_rgba(37,99,235,0.7)] opacity-100 scale-100'
                      : 'w-0 bg-transparent opacity-0 scale-50'
                  }`}
                  data-nav-indicator="games"
                />
              </button>
            </div>

            {/* Center Clearance Spacer for the floating Home sphere */}
            <div className="w-[90px] sm:w-[100px] shrink-0 pointer-events-none" aria-hidden="true" />

            {/* Right Wing Icons: Compete (championship) & Profile (profile) */}
            <div className="flex-1 flex items-center justify-around pl-1">
              {/* 4. Compete Destination */}
              <button
                onClick={() => onNavigate('championship')}
                className="group relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl cursor-pointer focus:outline-none transition-all duration-200 active:scale-90"
                title="Championship, Tournaments & Leaderboards"
                aria-label="Compete"
                aria-current={isCompeteActive ? 'page' : undefined}
                data-nav-destination="compete"
              >
                <div
                  className={`flex flex-col items-center transition-all duration-200 transform ${
                    isCompeteActive
                      ? 'text-[#2563EB] -translate-y-0.5 scale-105 drop-shadow-[0_4px_10px_rgba(37,99,235,0.35)]'
                      : 'text-[#8E9AA8] group-hover:text-[#0F172A] group-hover:-translate-y-0.5'
                  }`}
                >
                  <Trophy className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={2} />
                  <span
                    className={`text-[10px] font-semibold tracking-tight mt-0.5 transition-colors duration-200 ${
                      isCompeteActive ? 'text-[#2563EB]' : 'text-[#8E9AA8] group-hover:text-[#0F172A]'
                    }`}
                  >
                    Compete
                  </span>
                </div>
                {/* Active Indicator Glow Pill */}
                <div
                  className={`h-[3px] rounded-full transition-all duration-300 mt-0.5 ${
                    isCompeteActive
                      ? 'w-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_2px_8px_rgba(37,99,235,0.7)] opacity-100 scale-100'
                      : 'w-0 bg-transparent opacity-0 scale-50'
                  }`}
                  data-nav-indicator="compete"
                />
              </button>

              {/* 5. Profile Destination */}
              <button
                onClick={() => onNavigate('profile')}
                className="group relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl cursor-pointer focus:outline-none transition-all duration-200 active:scale-90"
                title="Player Profile, Stats & Achievements"
                aria-label="Profile"
                aria-current={isProfileActive ? 'page' : undefined}
                data-nav-destination="profile"
              >
                <div
                  className={`flex flex-col items-center transition-all duration-200 transform ${
                    isProfileActive
                      ? 'text-[#2563EB] -translate-y-0.5 scale-105 drop-shadow-[0_4px_10px_rgba(37,99,235,0.35)]'
                      : 'text-[#8E9AA8] group-hover:text-[#0F172A] group-hover:-translate-y-0.5'
                  }`}
                >
                  <UserRound className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={2} />
                  <span
                    className={`text-[10px] font-semibold tracking-tight mt-0.5 transition-colors duration-200 ${
                      isProfileActive ? 'text-[#2563EB]' : 'text-[#8E9AA8] group-hover:text-[#0F172A]'
                    }`}
                  >
                    Profile
                  </span>
                </div>
                {/* Active Indicator Glow Pill */}
                <div
                  className={`h-[3px] rounded-full transition-all duration-300 mt-0.5 ${
                    isProfileActive
                      ? 'w-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_2px_8px_rgba(37,99,235,0.7)] opacity-100 scale-100'
                      : 'w-0 bg-transparent opacity-0 scale-50'
                  }`}
                  data-nav-indicator="profile"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavigation;
