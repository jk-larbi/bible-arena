import React from 'react';
import type { MultiplayerMatchResult } from '../../types/multiplayerGame';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import {
  Trophy,
  Crown,
  Medal,
  Zap,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react';

interface MultiplayerMatchResultsPodiumProps {
  result: MultiplayerMatchResult;
  onRematch: () => void;
  onExit: () => void;
}

export const MultiplayerMatchResultsPodium: React.FC<MultiplayerMatchResultsPodiumProps> = ({
  result,
  onRematch,
  onExit,
}) => {
  const topThree = result.standings.slice(0, 3);
  const remainingPlayers = result.standings.slice(3);
  const isWinner = result.myRank === 1;

  const handleShareResult = async () => {
    const text = `🏆 I placed #${result.myRank} in ${result.gameTitle} on BibleArena with ${result.myScore} points! Can you beat my score?`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `BibleArena Match Victory`,
          text,
          url: window.location.origin,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      alert('Match result copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center px-4 py-6">
      {/* Celebration Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider font-outfit">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          {result.isRanked ? 'Ranked Match Completed' : 'Casual Match Completed'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-outfit">
          {isWinner ? '🎉 Victory! Match Champion!' : `Finished #${result.myRank} Place!`}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] font-inter max-w-md mx-auto">
          {result.gameTitle} &bull; {result.totalPlayers} Competitors &bull; {result.date}
        </p>
      </div>

      {/* Rewards & Rating Card */}
      <div className="grid grid-cols-3 gap-3 bg-gradient-to-tr from-purple-50 via-white to-indigo-50 p-4 rounded-3xl border border-purple-200 shadow-sm">
        <div className="p-2 text-center">
          <p className="text-[11px] font-bold text-slate-500 uppercase font-outfit">Score</p>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A] font-outfit mt-0.5">
            {result.myScore}
          </p>
        </div>
        <div className="p-2 text-center border-x border-purple-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase font-outfit">XP Earned</p>
          <p className="text-xl sm:text-2xl font-black text-[#7C3AED] font-outfit mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" /> +{result.xpEarned}
          </p>
        </div>
        <div className="p-2 text-center">
          <p className="text-[11px] font-bold text-slate-500 uppercase font-outfit">Accuracy</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 font-outfit mt-0.5">
            {result.myAccuracy}%
          </p>
        </div>
      </div>

      {/* 3D Visual Podium */}
      <div className="pt-6 pb-2">
        <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 relative">
                <AvatarDisplay avatar={topThree[1].avatar} size="md" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-black text-slate-700 font-outfit shadow-xs">
                  2
                </div>
              </div>
              <p className="text-xs font-black text-slate-800 font-outfit truncate max-w-[100px]">
                {topThree[1].nickname}
              </p>
              <p className="text-[11px] font-bold text-slate-500 font-inter">
                {topThree[1].score} pts
              </p>
              <div className="w-full h-24 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-slate-300 shadow-inner">
                <Medal className="w-8 h-8 text-slate-400 opacity-60" />
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {topThree[0] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                  <Crown className="w-7 h-7 text-amber-400 drop-shadow-md" />
                </div>
                <AvatarDisplay avatar={topThree[0].avatar} size="lg" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-black text-slate-900 font-outfit shadow-sm">
                  1
                </div>
              </div>
              <p className="text-sm font-black text-slate-900 font-outfit truncate max-w-[120px]">
                {topThree[0].nickname}
              </p>
              <p className="text-xs font-black text-[#7C3AED] font-inter">
                {topThree[0].score} pts
              </p>
              <div className="w-full h-32 bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-amber-300 shadow-sm">
                <Trophy className="w-10 h-10 text-amber-500" />
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-2 relative">
                <AvatarDisplay avatar={topThree[2].avatar} size="md" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 border-2 border-white flex items-center justify-center text-xs font-black text-white font-outfit shadow-xs">
                  3
                </div>
              </div>
              <p className="text-xs font-black text-slate-800 font-outfit truncate max-w-[100px]">
                {topThree[2].nickname}
              </p>
              <p className="text-[11px] font-bold text-slate-500 font-inter">
                {topThree[2].score} pts
              </p>
              <div className="w-full h-20 bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-orange-300 shadow-inner">
                <Medal className="w-7 h-7 text-amber-700 opacity-60" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remaining Participants Roster */}
      {remainingPlayers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-left shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-700 font-outfit uppercase tracking-wider">
            Match Standings (Positions 4 - {result.standings.length})
          </div>
          <div className="divide-y divide-slate-100">
            {remainingPlayers.map((p) => (
              <div key={p.participantId} className="p-3 flex items-center justify-between text-xs font-inter">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-black font-outfit text-slate-400 text-center">
                    #{p.rank}
                  </span>
                  <AvatarDisplay avatar={p.avatar} size="xs" />
                  <span className="font-bold text-slate-800">{p.nickname}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>{p.accuracy}% acc</span>
                  <span className="font-black font-outfit text-slate-800">{p.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions: Rematch, Share, Exit */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="gold"
          size="md"
          onClick={onRematch}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="font-black font-outfit shadow-sm"
        >
          Rematch / Play Again
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={handleShareResult}
          leftIcon={<Share2 className="w-4 h-4 text-purple-600" />}
          className="font-bold font-outfit border-purple-200 text-purple-700"
        >
          Share Victory
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={onExit}
          className="font-bold font-outfit text-slate-600"
        >
          Return to Game Modes
        </Button>
      </div>
    </div>
  );
};
