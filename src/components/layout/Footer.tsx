import React from 'react';
import type { AppPage } from './Navbar';
import { BibleCrossIcon } from '../ui/BibleCrossIcon';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white text-[#64748B] border-t border-[#E2E8F0] pt-12 pb-24 lg:pb-12 mt-16 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#E2E8F0]">
          {/* Logo & Church Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED]">
                <BibleCrossIcon className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-[#0F172A]">
                Bible<span className="text-[#7C3AED]">Arena</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#475569] max-w-md">
              An open Scripture learning and live quiz platform for everyone. Testing biblical knowledge, hosting live competitions, and encouraging believers, families, and study groups in God’s holy Word.
            </p>
            <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-purple-200 max-w-md">
              <p className="text-xs italic text-[#7C3AED] leading-relaxed font-semibold">
                "Your word is a lamp to my feet and a light to my path."
              </p>
              <p className="text-[11px] font-bold text-[#64748B] mt-1 text-right">— Psalm 119:105 (NKJV)</p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              Platform Features
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  Home & Daily Scripture
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('join-arena')}
                  className="hover:text-[#7C3AED] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Join Live Arena</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full font-bold">LIVE</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('create-arena')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer text-[#D97706] font-bold"
                >
                  Host an Arena
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  Bible Quizzes Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('leaderboard')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  Global Leaderboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('profile')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  Player Profile & Faith Avatars
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('create-quiz')}
                  className="hover:text-[#7C3AED] transition-colors cursor-pointer text-[#7C3AED]"
                >
                  + Create a Bible Quiz
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              Bible Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">Old Testament Foundations</li>
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">The Gospels & Parables</li>
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">Acts & The Early Church</li>
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">Heroes of Faith & Prophets</li>
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">Practical Christian Living</li>
              <li className="hover:text-[#7C3AED] transition-colors cursor-pointer">Scripture Memory Challenges</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© 2026 BibleArena. One Word. Many Players. Endless Challenges.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#475569] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> FunkWiz Light Theme • 24 Faith Avatars
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
