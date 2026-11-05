import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import { allGameModesList } from '../../data/gameModesData';
import type { GameModeId } from '../../types/gameModes';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import {
  Trophy,
  Crown,
  Globe,
  Gamepad2,
  Users,
  Search,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

type RankingTier = 'global' | 'game_modes' | 'recent_matches';

interface LeaderboardViewProps {
  onExploreQuizzes?: () => void;
  onSelectGameMode?: (modeId: GameModeId) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onExploreQuizzes,
  onSelectGameMode,
}) => {
  void onExploreQuizzes;
  const { currentUser } = useAuth();
  const [rankingTier, setRankingTier] = useState<RankingTier>('global');
  const [selectedGameMode, setSelectedGameMode] = useState<GameModeId | 'championship'>('trivia');
  const [searchMember, setSearchMember] = useState<string>('');
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState(false);

  // Data Sources from Multiplayer Service
  const globalEntries = multiplayerGameService.getGlobalLeaderboard();
  const gameModeEntries = multiplayerGameService.getGameModeLeaderboard(selectedGameMode);
  const recentMatches = multiplayerGameService.getMatchHistory();

  // Search filtering
  const filteredGlobal = globalEntries.filter((e) =>
    e.nickname.toLowerCase().includes(searchMember.toLowerCase())
  );
  const filteredGameMode = gameModeEntries.filter((e) =>
    e.nickname.toLowerCase().includes(searchMember.toLowerCase())
  );

  const selectedGameInfo = allGameModesList.find((g) => g.id === selectedGameMode);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-purple-400/30 text-center space-y-3.5 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-amber-300 text-xs font-bold uppercase tracking-wider font-outfit">
          <Trophy className="w-3.5 h-3.5" /> Competitive Ranking System
        </div>

        <h1 className="text-3xl sm:text-4xl font-black font-outfit tracking-tight">
          Scripture Knowledge Leaderboards
        </h1>

        <p className="text-xs sm:text-sm text-purple-100 max-w-xl mx-auto font-inter leading-relaxed">
          Track competitive performance across all 18 interactive games, solo progression, and live multiplayer challenges.
        </p>

        {/* 3-Tier Mode Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setRankingTier('global')}
            className={`px-4 py-2 rounded-2xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center gap-2 ${
              rankingTier === 'global'
                ? 'bg-amber-400 text-slate-900 shadow-sm scale-105'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Global Championship</span>
          </button>

          <button
            onClick={() => setRankingTier('game_modes')}
            className={`px-4 py-2 rounded-2xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center gap-2 ${
              rankingTier === 'game_modes'
                ? 'bg-amber-400 text-slate-900 shadow-sm scale-105'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Game-Specific Rankings (18 Games)</span>
          </button>

          <button
            onClick={() => setRankingTier('recent_matches')}
            className={`px-4 py-2 rounded-2xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center gap-2 ${
              rankingTier === 'recent_matches'
                ? 'bg-amber-400 text-slate-900 shadow-sm scale-105'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Recent Match History</span>
          </button>
        </div>

        {/* Fairness Explainer Trigger */}
        <button
          onClick={() => setIsFairnessModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-purple-200 hover:text-white underline pt-2 cursor-pointer transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How rankings & XP are calculated (Fairness Formula)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TIER 1: GLOBAL BIBLEARENA RANKINGS                                   */}
      {/* ==================================================================== */}
      {rankingTier === 'global' && (
        <div className="space-y-6">
          {/* Top 3 Global Champions Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {globalEntries.slice(0, 3).map((entry, idx) => (
              <div
                key={entry.id}
                className={`relative rounded-3xl p-6 text-center border-2 shadow-sm transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300 md:-translate-y-2'
                    : idx === 1
                    ? 'bg-gradient-to-b from-slate-50 to-white border-slate-300'
                    : 'bg-gradient-to-b from-orange-50 to-white border-orange-200'
                }`}
              >
                <div className="absolute top-4 right-4 text-xs font-black font-outfit text-slate-400">
                  #{entry.rank}
                </div>

                <div className="w-16 h-16 mx-auto relative mb-3">
                  {idx === 0 && (
                    <Crown className="w-7 h-7 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" />
                  )}
                  <AvatarDisplay avatar={entry.avatar} size="lg" />
                </div>

                <h3 className="text-base font-black text-[#0F172A] font-outfit truncate">
                  {entry.nickname}
                </h3>
                <p className="text-xs font-bold text-[#7C3AED] font-outfit mt-0.5">
                  {entry.tier}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs font-inter">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total XP</span>
                    <span className="font-black text-[#0F172A] text-sm font-outfit">{entry.totalXP.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Win Rate</span>
                    <span className="font-black text-emerald-600 text-sm font-outfit">{entry.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Search global competitors by nickname..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-white text-xs font-inter text-[#0F172A] focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          {/* Global Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 font-outfit tracking-wider">
                    <th className="py-3 px-4 text-center w-12">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 text-center">Tier</th>
                    <th className="py-3 px-4 text-right">Total XP</th>
                    <th className="py-3 px-4 text-center">Matches</th>
                    <th className="py-3 px-4 text-center">Wins</th>
                    <th className="py-3 px-4 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-inter">
                  {filteredGlobal.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-purple-50/40 transition-colors ${
                        entry.id === currentUser.id || entry.nickname.includes('(You)')
                          ? 'bg-purple-50/70 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-black font-outfit">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <AvatarDisplay avatar={entry.avatar} size="xs" />
                        <div>
                          <p className="font-black text-slate-900 font-outfit">{entry.nickname}</p>
                          {entry.badge && (
                            <span className="text-[10px] font-bold text-slate-400 font-inter">
                              {entry.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] font-black text-[10px] font-outfit">
                          {entry.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black font-outfit text-slate-900">
                        {entry.totalXP.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-bold">
                        {entry.matchesPlayed}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-bold">
                        {entry.matchesWon}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 font-outfit">
                        {entry.winRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TIER 2: GAME-SPECIFIC RANKINGS (All 18 Games)                         */}
      {/* ==================================================================== */}
      {rankingTier === 'game_modes' && (
        <div className="space-y-6">
          {/* Game Mode Selector Grid / Dropdown */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-outfit">
                  Select Game Leaderboard
                </h3>
                <p className="text-xs text-slate-500 font-inter">
                  View specialized competitive stats for each of BibleArena's 18 game modes.
                </p>
              </div>

              <select
                value={selectedGameMode}
                onChange={(e) => setSelectedGameMode(e.target.value as any)}
                className="px-4 py-2.5 rounded-2xl border-2 border-purple-200 bg-purple-50/50 font-outfit font-black text-xs text-[#7C3AED] focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {allGameModesList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.title} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedGameInfo && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-inter">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedGameInfo.icon}</span>
                  <div>
                    <p className="font-black text-slate-900 font-outfit">{selectedGameInfo.title}</p>
                    <p className="text-[11px] text-slate-500">{selectedGameInfo.subtitle}</p>
                  </div>
                </div>
                {onSelectGameMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectGameMode(selectedGameInfo.id)}
                    className="font-bold text-xs"
                  >
                    Play This Mode
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Game-Specific Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 font-outfit tracking-wider">
                    <th className="py-3 px-4 text-center w-12">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4 text-center">Played</th>
                    <th className="py-3 px-4 text-center">Wins</th>
                    <th className="py-3 px-4 text-center">Win %</th>
                    <th className="py-3 px-4 text-center">Best Score</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-inter">
                  {filteredGameMode.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-purple-50/40 transition-colors ${
                        entry.id === currentUser.id || entry.nickname.includes('(You)')
                          ? 'bg-purple-50/70 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-black font-outfit">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <AvatarDisplay avatar={entry.avatar} size="xs" />
                        <div>
                          <p className="font-black text-slate-900 font-outfit">{entry.nickname}</p>
                          <span className="text-[10px] text-purple-600 font-bold font-inter">
                            {entry.tier}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black font-outfit text-slate-900">
                        {entry.points.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-bold">
                        {entry.matchesPlayed}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-bold">
                        {entry.matchesWon}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-600 font-outfit">
                        {entry.winRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {entry.bestScore}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-purple-700 font-outfit">
                        {entry.avgAccuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TIER 3: RECENT MULTIPLAYER MATCH HISTORY                             */}
      {/* ==================================================================== */}
      {rankingTier === 'recent_matches' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs font-inter">
            <span className="text-slate-600 font-medium">
              Private and ranked multiplayer matches you played with friends are preserved here.
            </span>
            <span className="text-purple-700 font-bold font-outfit">
              {recentMatches.length} Matches Recorded
            </span>
          </div>

          {recentMatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-800 font-outfit">
                No multiplayer matches played yet
              </h4>
              <p className="text-xs text-slate-500 font-inter max-w-sm mx-auto">
                Host a game with friends from the Game Modes Hub to compete and see match standings here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((m) => (
                <div
                  key={m.matchId}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black font-outfit ${
                      m.myRank === 1
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : m.myRank === 2
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {m.myRank === 1 ? '🥇' : `#${m.myRank}`}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 font-outfit">
                        {m.gameTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-inter">
                        {m.date} &bull; {m.totalPlayers} Players &bull; {m.isRanked ? 'Ranked' : 'Casual'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-[#7C3AED] font-outfit">
                      {m.myScore} pts
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 font-inter">
                      +{m.xpEarned} XP ({m.myAccuracy}% acc)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* FAIRNESS FORMULA EXPLAINER MODAL                                    */}
      {/* ==================================================================== */}
      {isFairnessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-purple-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-[#0F172A] font-outfit">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>Fair Competitive Scoring System</span>
              </div>
              <button
                onClick={() => setIsFairnessModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 font-inter space-y-3 leading-relaxed">
              <p>
                BibleArena prevents XP farming and spamming through our verified server-authoritative scoring model:
              </p>
              <div className="p-3 rounded-xl bg-purple-50 font-mono text-[11px] text-purple-900 space-y-1">
                <p><strong>Match Score:</strong> Base Pts (100) + Speed Bonus (0-50) + Streak (up to 60)</p>
                <p><strong>XP Formula:</strong> Score + (Rank Bonus) + Accuracy Bonus &times; Ranked Multiplier</p>
                <p><strong>Global XP:</strong> (Wins &times; 150) + (Matches &times; 30) + (Avg Acc &times; 10) + (Stars &times; 25)</p>
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Players cannot farm ranks simply by repeatedly opening and abandoning matches.</li>
                <li>Accuracy % and win rate are heavily weighted to reward biblical scholarship over pure repetition.</li>
                <li>Ranked and Casual matches are strictly segregated.</li>
              </ul>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsFairnessModalOpen(false)}
              className="font-black font-outfit text-xs"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
