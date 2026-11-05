import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { GameModeId } from '../types/gameModes';
import type {
  MultiplayerMatchConfig,
  MultiplayerParticipant,
  MultiplayerMatchResult,
  GameModeLeaderboardEntry,
  GlobalLeaderboardEntry,
} from '../types/multiplayerGame';
import { allGameModesList } from '../data/gameModesData';

const STORAGE_GUEST_ID = 'biblearena_guest_persistent_id';
const STORAGE_GUEST_NICK = 'biblearena_guest_persistent_nick';
const STORAGE_GUEST_AVATAR = 'biblearena_guest_persistent_avatar';
const STORAGE_MATCH_HISTORY = 'biblearena_multiplayer_matches_v1';
const STORAGE_GAME_STATS = 'biblearena_gamemode_stats_v1';

export interface GuestIdentity {
  id: string;
  nickname: string;
  avatar: string;
  isGuest: boolean;
}

export interface StoredGameStats {
  gameModeId: GameModeId | 'championship' | 'quiz';
  matchesPlayed: number;
  matchesWon: number;
  totalPoints: number;
  bestScore: number;
  totalCorrect: number;
  totalQuestions: number;
  lastPlayedAt: string;
}

class MultiplayerGameService {
  private activeBroadcastChannels: Map<string, BroadcastChannel> = new Map();

  // --------------------------------------------------------------------------
  // 1. GUEST IDENTITY & PERSISTENCE
  // --------------------------------------------------------------------------
  getGuestIdentity(): GuestIdentity {
    let id = localStorage.getItem(STORAGE_GUEST_ID);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_GUEST_ID, id);
    }

    let nick = localStorage.getItem(STORAGE_GUEST_NICK);
    if (!nick) {
      nick = 'Guest Disciple';
      localStorage.setItem(STORAGE_GUEST_NICK, nick);
    }

    let avatar = localStorage.getItem(STORAGE_GUEST_AVATAR);
    if (!avatar) {
      avatar = 'hero-david';
      localStorage.setItem(STORAGE_GUEST_AVATAR, avatar);
    }

    return { id, nickname: nick, avatar, isGuest: true };
  }

  saveGuestIdentity(nickname: string, avatar: string): void {
    if (nickname.trim()) {
      localStorage.setItem(STORAGE_GUEST_NICK, nickname.trim());
    }
    if (avatar.trim()) {
      localStorage.setItem(STORAGE_GUEST_AVATAR, avatar.trim());
    }
  }

  // --------------------------------------------------------------------------
  // 2. CREATE MULTIPLAYER GAME SESSION
  // --------------------------------------------------------------------------
  async createGameModeSession(params: {
    gameModeId: GameModeId | 'championship';
    levelNumber: number;
    isRanked?: boolean;
    timeLimitSeconds?: number;
    hostName: string;
    hostAvatar: string;
    hostId?: string;
  }): Promise<{ session: MultiplayerMatchConfig; universalUrl: string; shareMessage: string }> {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = `mp_session_${params.gameModeId}_${pin}_${Date.now()}`;
    const modeInfo = allGameModesList.find((m) => m.id === params.gameModeId);
    const gameTitle = modeInfo ? modeInfo.title : 'Bible Championship';

    const session: MultiplayerMatchConfig = {
      sessionId,
      pin,
      gameModeId: params.gameModeId,
      gameTitle,
      levelNumber: params.levelNumber,
      isRanked: params.isRanked ?? true,
      hostId: params.hostId || this.getGuestIdentity().id,
      hostName: params.hostName || 'Host',
      hostAvatar: params.hostAvatar || 'hero-david',
      timeLimitSeconds: params.timeLimitSeconds || (modeInfo?.defaultTimeSeconds ?? 25),
      status: 'lobby',
      createdAt: new Date().toISOString(),
    };

    // Store in local storage directory for offline/local multiplayer
    this.saveLocalSession(session);

    // Initial Host Participant
    const hostParticipant: MultiplayerParticipant = {
      id: session.hostId,
      sessionId: session.sessionId,
      nickname: session.hostName,
      avatar: session.hostAvatar,
      score: 0,
      accuracy: 0,
      streak: 0,
      currentChallengeIndex: 0,
      challengesCompleted: 0,
      totalTimeMs: 0,
      rank: 1,
      isHost: true,
      isReady: true,
      status: 'ready',
    };
    this.saveParticipants(pin, [hostParticipant]);

    // Background register with Supabase if configured
    if (isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('game_sessions')
          .insert([
            {
              game_pin: pin,
              title: `${gameTitle} — Level ${session.levelNumber} (${session.isRanked ? 'Ranked' : 'Casual'})`,
              category: modeInfo?.category || 'Championship',
              host_name: session.hostName,
              time_limit_seconds: session.timeLimitSeconds,
              status: 'lobby',
            },
          ])
      ).catch((err: unknown) => {
        console.warn('Supabase remote session create skipped, running resilient session:', err);
      });
    }

    const origin = window.location.origin;
    const path = window.location.pathname.replace(/\/$/, '');
    const universalUrl = `${origin}${path}/?pin=${pin}&game=${params.gameModeId}#join-arena`;
    const shareMessage = `🎮 Join my BibleArena multiplayer match in ${gameTitle} (Level ${session.levelNumber})!\n\nRoom PIN: ${pin}\nTap to join: ${universalUrl}`;

    return { session, universalUrl, shareMessage };
  }

  // --------------------------------------------------------------------------
  // 3. JOIN MULTIPLAYER GAME SESSION
  // --------------------------------------------------------------------------
  async joinGameModeSession(params: {
    pin: string;
    nickname: string;
    avatar: string;
    userId?: string;
  }): Promise<{
    session: MultiplayerMatchConfig;
    participant: MultiplayerParticipant;
  }> {
    const cleanPin = params.pin.trim().replace(/\D/g, '');
    const session = this.getLocalSession(cleanPin);

    if (!session) {
      throw new Error(`Game room ${cleanPin} could not be found. Please check the PIN.`);
    }

    if (session.status === 'completed') {
      throw new Error(`Game room ${cleanPin} has already completed.`);
    }

    const participantId = params.userId || this.getGuestIdentity().id;
    const existingList = this.getParticipants(cleanPin);
    
    // Prevent duplicate entries for the same participant ID or identical nickname
    let participant = existingList.find((p) => p.id === participantId || p.nickname.toLowerCase() === params.nickname.trim().toLowerCase());
    
    if (participant) {
      participant.nickname = params.nickname.trim();
      participant.avatar = params.avatar;
      participant.status = 'ready';
    } else {
      participant = {
        id: participantId,
        sessionId: session.sessionId,
        nickname: params.nickname.trim(),
        avatar: params.avatar,
        score: 0,
        accuracy: 0,
        streak: 0,
        currentChallengeIndex: 0,
        challengesCompleted: 0,
        totalTimeMs: 0,
        rank: existingList.length + 1,
        isHost: participantId === session.hostId,
        isReady: true,
        status: 'ready',
      };
      existingList.push(participant);
    }

    this.saveParticipants(cleanPin, existingList);
    this.broadcastEvent(cleanPin, { type: 'PARTICIPANT_JOINED', participant });

    return { session, participant };
  }

  // --------------------------------------------------------------------------
  // 4. REAL-TIME EVENT BROADCAST & SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  subscribeToGameSession(
    pin: string,
    callbacks: {
      onSessionUpdate?: (session: MultiplayerMatchConfig) => void;
      onParticipantsUpdate?: (participants: MultiplayerParticipant[]) => void;
      onGameStart?: (session: MultiplayerMatchConfig) => void;
      onGameFinished?: (result: MultiplayerMatchResult) => void;
    }
  ): () => void {
    const cleanPin = pin.trim().replace(/\D/g, '');

    // 1. Cross-tab/window synchronization via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`biblearena_room_${cleanPin}`);
      channel.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'SESSION_UPDATE' && callbacks.onSessionUpdate) {
          callbacks.onSessionUpdate(msg.session);
        } else if (msg.type === 'PARTICIPANTS_UPDATE' && callbacks.onParticipantsUpdate) {
          callbacks.onParticipantsUpdate(msg.participants);
        } else if (msg.type === 'GAME_STARTED' && callbacks.onGameStart) {
          callbacks.onGameStart(msg.session);
        } else if (msg.type === 'GAME_FINISHED' && callbacks.onGameFinished) {
          callbacks.onGameFinished(msg.result);
        } else if (msg.type === 'PARTICIPANT_JOINED') {
          const list = this.getParticipants(cleanPin);
          if (callbacks.onParticipantsUpdate) callbacks.onParticipantsUpdate(list);
        }
      };
      this.activeBroadcastChannels.set(cleanPin, channel);
    } catch (e) {
      console.warn('BroadcastChannel not available in this environment:', e);
    }

    // 2. Storage event listener for window synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `biblearena_participants_${cleanPin}`) {
        const list = this.getParticipants(cleanPin);
        if (callbacks.onParticipantsUpdate) callbacks.onParticipantsUpdate(list);
      } else if (e.key === `biblearena_session_${cleanPin}`) {
        const s = this.getLocalSession(cleanPin);
        if (s && callbacks.onSessionUpdate) callbacks.onSessionUpdate(s);
        if (s && s.status === 'active' && callbacks.onGameStart) callbacks.onGameStart(s);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Cleanup function
    return () => {
      if (channel) {
        channel.close();
        this.activeBroadcastChannels.delete(cleanPin);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }

  broadcastEvent(pin: string, payload: any): void {
    const cleanPin = pin.trim().replace(/\D/g, '');
    const channel = this.activeBroadcastChannels.get(cleanPin);
    if (channel) {
      try {
        channel.postMessage(payload);
      } catch {}
    }
  }

  // --------------------------------------------------------------------------
  // 5. SESSION CONTROLS (Host Only)
  // --------------------------------------------------------------------------
  startGameMatch(pin: string): MultiplayerMatchConfig {
    const cleanPin = pin.trim().replace(/\D/g, '');
    const session = this.getLocalSession(cleanPin);
    if (!session) throw new Error('Session not found');

    session.status = 'active';
    this.saveLocalSession(session);

    // Set all participants to playing
    const parts = this.getParticipants(cleanPin).map((p) => ({
      ...p,
      status: 'playing' as const,
    }));
    this.saveParticipants(cleanPin, parts);

    this.broadcastEvent(cleanPin, { type: 'GAME_STARTED', session });
    this.broadcastEvent(cleanPin, { type: 'PARTICIPANTS_UPDATE', participants: parts });
    return session;
  }

  closeSession(pin: string): void {
    const cleanPin = pin.trim().replace(/\D/g, '');
    const session = this.getLocalSession(cleanPin);
    if (session) {
      session.status = 'completed';
      this.saveLocalSession(session);
      this.broadcastEvent(cleanPin, { type: 'SESSION_UPDATE', session });
    }
  }

  // --------------------------------------------------------------------------
  // 6. IN-GAME SUBMISSIONS & STANDINGS
  // --------------------------------------------------------------------------
  submitChallengeResult(params: {
    pin: string;
    participantId: string;
    isCorrect: boolean;
    timeSpentMs: number;
    challengeIndex: number;
    totalChallenges: number;
  }): MultiplayerParticipant[] {
    const cleanPin = params.pin.trim().replace(/\D/g, '');
    const parts = this.getParticipants(cleanPin);
    const p = parts.find((x) => x.id === params.participantId);

    if (p) {
      p.currentChallengeIndex = params.challengeIndex + 1;
      p.challengesCompleted += 1;
      p.totalTimeMs += params.timeSpentMs;
      p.lastAnswerCorrect = params.isCorrect;

      if (params.isCorrect) {
        p.streak += 1;
        // Scoring formula: Base 100 pts + speed bonus up to 50 pts + streak bonus
        const speedBonus = Math.max(0, Math.floor((30000 - params.timeSpentMs) / 600));
        const streakBonus = Math.min(60, p.streak * 15);
        p.score += 100 + speedBonus + streakBonus;
      } else {
        p.streak = 0;
      }

      p.accuracy = Math.round((p.score / (Math.max(1, p.challengesCompleted) * 160)) * 100);

      // Check if finished
      if (p.challengesCompleted >= params.totalChallenges) {
        p.status = 'finished';
      }
    }

    // Sort standings by score DESC, then totalTimeMs ASC
    parts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeMs - b.totalTimeMs;
    });

    // Update ranks
    parts.forEach((item, index) => {
      item.rank = index + 1;
    });

    this.saveParticipants(cleanPin, parts);
    this.broadcastEvent(cleanPin, { type: 'PARTICIPANTS_UPDATE', participants: parts });

    return parts;
  }

  // Finalize match and calculate XP, rating deltas & match history
  finalizeMatch(pin: string, participantId: string): MultiplayerMatchResult {
    const cleanPin = pin.trim().replace(/\D/g, '');
    const session = this.getLocalSession(cleanPin) || {
      sessionId: `sess_${cleanPin}`,
      pin: cleanPin,
      gameModeId: 'trivia' as GameModeId,
      gameTitle: 'Bible Challenge',
      levelNumber: 1,
      isRanked: true,
      hostId: '',
      hostName: '',
      hostAvatar: '',
      timeLimitSeconds: 25,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    const parts = this.getParticipants(cleanPin);
    const me = parts.find((x) => x.id === participantId) || parts[0];
    const myRank = me?.rank || 1;
    const totalPlayers = Math.max(1, parts.length);
    const isWin = myRank === 1;

    // Documented Fair Scoring & XP Formula
    // Base XP: 80 + Rank Bonus (1st: 150, 2nd: 80, 3rd: 50, other: 20) + Accuracy bonus
    const rankBonus = myRank === 1 ? 150 : myRank === 2 ? 80 : myRank === 3 ? 50 : 20;
    const accuracyBonus = Math.round((me?.accuracy || 80) * 0.8);
    const rankedMultiplier = session.isRanked ? 1.5 : 1.0;
    const xpEarned = Math.round((80 + rankBonus + accuracyBonus) * rankedMultiplier);

    // Competitive Rating Delta
    const ratingDelta = session.isRanked
      ? isWin
        ? Math.round(30 * (1 + 1 / totalPlayers))
        : myRank <= Math.ceil(totalPlayers / 2)
        ? 15
        : -8
      : 0;

    const result: MultiplayerMatchResult = {
      matchId: `match_${Date.now()}_${cleanPin}`,
      sessionId: session.sessionId,
      gameModeId: session.gameModeId,
      gameTitle: session.gameTitle,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isRanked: session.isRanked,
      totalPlayers,
      myRank,
      myScore: me?.score || 0,
      myAccuracy: me?.accuracy || 0,
      xpEarned,
      ratingDelta,
      standings: parts.map((p) => ({
        rank: p.rank,
        participantId: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        accuracy: p.accuracy,
        totalTimeMs: p.totalTimeMs,
        isHost: p.isHost,
      })),
    };

    // Save match in local history
    this.recordMatchHistory(result);

    // Update cumulative stats for game mode
    this.recordGameStats(session.gameModeId, {
      score: me?.score || 0,
      isWin,
      correctCount: me?.challengesCompleted || 0,
      totalCount: me?.challengesCompleted || 0,
    });

    session.status = 'results';
    this.saveLocalSession(session);
    this.broadcastEvent(cleanPin, { type: 'GAME_FINISHED', result });

    return result;
  }

  // --------------------------------------------------------------------------
  // 7. MULTIPLAYER MATCH HISTORY & GAME STATS
  // --------------------------------------------------------------------------
  getMatchHistory(): MultiplayerMatchResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_MATCH_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private recordMatchHistory(result: MultiplayerMatchResult): void {
    try {
      const history = this.getMatchHistory();
      history.unshift(result);
      // Keep last 30 matches
      if (history.length > 30) history.pop();
      localStorage.setItem(STORAGE_MATCH_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save match history:', e);
    }
  }

  getGameStats(gameModeId: GameModeId | 'championship' | 'quiz'): StoredGameStats {
    try {
      const raw = localStorage.getItem(`${STORAGE_GAME_STATS}_${gameModeId}`);
      if (raw) return JSON.parse(raw);
    } catch {}

    return {
      gameModeId,
      matchesPlayed: 0,
      matchesWon: 0,
      totalPoints: 0,
      bestScore: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      lastPlayedAt: 'Never',
    };
  }

  private recordGameStats(
    gameModeId: GameModeId | 'championship' | 'quiz',
    update: { score: number; isWin: boolean; correctCount: number; totalCount: number }
  ): void {
    const stats = this.getGameStats(gameModeId);
    stats.matchesPlayed += 1;
    if (update.isWin) stats.matchesWon += 1;
    stats.totalPoints += update.score;
    stats.bestScore = Math.max(stats.bestScore, update.score);
    stats.totalCorrect += update.correctCount;
    stats.totalQuestions += update.totalCount;
    stats.lastPlayedAt = new Date().toISOString();

    try {
      localStorage.setItem(`${STORAGE_GAME_STATS}_${gameModeId}`, JSON.stringify(stats));
    } catch {}
  }

  // --------------------------------------------------------------------------
  // 8. MULTI-TIER LEADERBOARDS (Game-Specific & Global)
  // --------------------------------------------------------------------------
  getGameModeLeaderboard(gameModeId: GameModeId | 'championship'): GameModeLeaderboardEntry[] {
    const stats = this.getGameStats(gameModeId);
    const guest = this.getGuestIdentity();
    const winRate = stats.matchesPlayed > 0 ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100) : 0;
    const avgAccuracy = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

    // Benchmark competitive players for rich ranking experience
    const benchmarkPlayers: Array<Omit<GameModeLeaderboardEntry, 'rank' | 'gameModeId'>> = [
      { id: 'bp-1', nickname: 'Theophilus Berean', avatar: 'symbol-scroll', points: 4820, matchesPlayed: 32, matchesWon: 24, winRate: 75, bestScore: 980, avgAccuracy: 94, tier: 'Grandmaster', badge: '👑 Master' },
      { id: 'bp-2', nickname: 'Priscilla & Aquila', avatar: 'hero-priscilla', points: 4150, matchesPlayed: 28, matchesWon: 19, winRate: 68, bestScore: 920, avgAccuracy: 89, tier: 'Master', badge: '🛡️ Apex' },
      { id: 'bp-3', nickname: 'Timothy Evangelist', avatar: 'hero-timothy', points: 3680, matchesPlayed: 24, matchesWon: 15, winRate: 63, bestScore: 880, avgAccuracy: 85, tier: 'Diamond', badge: '⚡ Scholar' },
      { id: 'bp-4', nickname: 'Lydia of Thyatira', avatar: 'hero-esther', points: 2950, matchesPlayed: 20, matchesWon: 12, winRate: 60, bestScore: 840, avgAccuracy: 82, tier: 'Gold', badge: '📜 Scribe' },
      { id: 'bp-5', nickname: 'Apollos Alexandrian', avatar: 'hero-stephen', points: 2420, matchesPlayed: 16, matchesWon: 9, winRate: 56, bestScore: 810, avgAccuracy: 79, tier: 'Gold', badge: '🌿 Seeker' },
    ];

    // Current User Row
    const userRow: Omit<GameModeLeaderboardEntry, 'rank' | 'gameModeId'> = {
      id: guest.id,
      nickname: `${guest.nickname} (You)`,
      avatar: guest.avatar,
      points: stats.totalPoints,
      matchesPlayed: stats.matchesPlayed,
      matchesWon: stats.matchesWon,
      winRate,
      bestScore: stats.bestScore,
      avgAccuracy: avgAccuracy || 80,
      tier: stats.totalPoints > 3000 ? 'Master' : stats.totalPoints > 1500 ? 'Diamond' : 'Gold',
      badge: '✨ Member',
    };

    const combined = [...benchmarkPlayers, userRow];
    combined.sort((a, b) => b.points - a.points);

    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      gameModeId,
    }));
  }

  getGlobalLeaderboard(): GlobalLeaderboardEntry[] {
    const guest = this.getGuestIdentity();
    const history = this.getMatchHistory();
    const totalMatches = history.length;
    const totalWins = history.filter((m) => m.myRank === 1).length;
    const totalXP = history.reduce((acc, m) => acc + m.xpEarned, 0) + 120;
    const totalPoints = history.reduce((acc, m) => acc + m.myScore, 0);
    const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
    const avgAccuracy = totalMatches > 0 ? Math.round(history.reduce((acc, m) => acc + m.myAccuracy, 0) / totalMatches) : 85;

    const benchmarkGlobal: Array<Omit<GlobalLeaderboardEntry, 'rank'>> = [
      { id: 'glob-1', nickname: 'Deborah Judge', avatar: 'hero-deborah', totalXP: 14800, totalPoints: 12450, matchesPlayed: 92, matchesWon: 68, winRate: 74, avgAccuracy: 95, achievementsCount: 18, tier: 'Grandmaster Theologian', badge: '🏆 Legend' },
      { id: 'glob-2', nickname: 'Solomon Sage', avatar: 'symbol-crown', totalXP: 12900, totalPoints: 10890, matchesPlayed: 80, matchesWon: 54, winRate: 68, avgAccuracy: 92, achievementsCount: 16, tier: 'Scripture Master', badge: '👑 Grandmaster' },
      { id: 'glob-3', nickname: 'Barnabas Encourager', avatar: 'hero-barnabas', totalXP: 10450, totalPoints: 8900, matchesPlayed: 64, matchesWon: 41, winRate: 64, avgAccuracy: 88, achievementsCount: 14, tier: 'Faith Champion', badge: '🛡️ Master' },
      { id: 'glob-4', nickname: 'Ruth Faithful', avatar: 'hero-ruth', totalXP: 8200, totalPoints: 7100, matchesPlayed: 52, matchesWon: 30, winRate: 58, avgAccuracy: 85, achievementsCount: 12, tier: 'Bible Disciple', badge: '⚡ Diamond' },
    ];

    const userEntry: Omit<GlobalLeaderboardEntry, 'rank'> = {
      id: guest.id,
      nickname: `${guest.nickname} (You)`,
      avatar: guest.avatar,
      totalXP,
      totalPoints,
      matchesPlayed: totalMatches,
      matchesWon: totalWins,
      winRate,
      avgAccuracy,
      achievementsCount: Math.min(20, Math.floor(totalXP / 600) + 2),
      tier: totalXP > 10000 ? 'Faith Champion' : totalXP > 4000 ? 'Bible Disciple' : 'Word Apprentice',
      badge: '✨ Disciple',
    };

    const combined = [...benchmarkGlobal, userEntry];
    combined.sort((a, b) => b.totalXP - a.totalXP);

    return combined.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  // --------------------------------------------------------------------------
  // 9. LOCAL STORAGE PERSISTENCE HELPERS
  // --------------------------------------------------------------------------
  private getLocalSession(pin: string): MultiplayerMatchConfig | null {
    try {
      const raw = localStorage.getItem(`biblearena_session_${pin}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveLocalSession(session: MultiplayerMatchConfig): void {
    try {
      localStorage.setItem(`biblearena_session_${session.pin}`, JSON.stringify(session));
    } catch {}
  }

  getParticipants(pin: string): MultiplayerParticipant[] {
    try {
      const raw = localStorage.getItem(`biblearena_participants_${pin}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveParticipants(pin: string, list: MultiplayerParticipant[]): void {
    try {
      localStorage.setItem(`biblearena_participants_${pin}`, JSON.stringify(list));
    } catch {}
  }
}

export const multiplayerGameService = new MultiplayerGameService();
