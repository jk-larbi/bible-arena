import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { LiveParticipant } from '../types/bibleArena';
import { multiplayerGameService } from './multiplayerGameService';

export interface JoinGameResult {
  participantId: string;
  sessionId: string;
  pin: string;
  title: string;
  status: string;
  roundPhase: string;
  currentQuestionIndex: number;
  isGameMode?: boolean;
  gameModeId?: string;
}

export interface AnswerSubmissionResult {
  isCorrect: boolean;
  pointsAwarded: number;
  basePoints: number;
  speedBonus: number;
  totalScore: number;
  streak: number;
  rank?: number;
  correctAnswersCount?: number;
  questionsAnsweredCount?: number;
}

export interface ShareInvitationInfo {
  pin: string;
  cleanUrl: string;
  hashUrl: string;
  shareMessage: string;
}

// Generate a client-side persistent guest token
export const getOrCreateGuestToken = (): string => {
  try {
    let token = localStorage.getItem('biblearena_guest_token');
    if (!token) {
      token = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('biblearena_guest_token', token);
    }
    return token;
  } catch {
    return 'guest_ephemeral_' + Date.now();
  }
};

// Generate invitation links and structured invite message
export const getShareInvitationInfo = (pin: string, title?: string): ShareInvitationInfo => {
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/$/, '');
  const cleanUrl = `${origin}${path}/?pin=${pin}#join-arena`;
  const hashUrl = `${origin}${path}/#join-arena?pin=${pin}`;
  const shareMessage = `You're invited to join the BibleArena live challenge${
    title ? ` ("${title}")` : ''
  }! Click to join: ${cleanUrl} (Room PIN: ${pin})`;

  return {
    pin,
    cleanUrl,
    hashUrl,
    shareMessage,
  };
};

// Native Web Share API with clipboard fallback
export const shareCompetition = async (
  pin: string,
  title?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard'; message: string }> => {
  const info = getShareInvitationInfo(pin, title);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: title || 'BibleArena Live Competition',
        text: info.shareMessage,
        url: info.cleanUrl,
      });
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully via device share menu!',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Share cancelled.' };
      }
      // Fall through to clipboard if Web Share failed
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(info.shareMessage);
      return {
        success: true,
        method: 'clipboard',
        message: 'Invitation link and PIN copied to clipboard!',
      };
    } catch {
      // Fallback manual
    }
  }

  return {
    success: false,
    method: 'clipboard',
    message: 'Could not automatically share. Please copy the Game PIN: ' + pin,
  };
};

/**
 * Realtime Game Service
 */
export const gameService = {
  /**
   * Create a multiplayer game session
   */
  async createGame(params: {
    title: string;
    quizId?: string;
    category?: string;
    timeLimitSeconds?: number;
    isPublic?: boolean;
    allowGuests?: boolean;
    participantLimit?: number;
  }): Promise<{ sessionId: string; pin: string; title: string }> {
    if (!isSupabaseConfigured) {
      // Offline fallback: generate local session
      const localPin = Math.floor(100000 + Math.random() * 900000).toString();
      const localSessionId = `local_session_${Date.now()}`;
      return {
        sessionId: localSessionId,
        pin: localPin,
        title: params.title,
      };
    }

    try {
      const rpcPromise = supabase.rpc('create_game_session', {
        p_title: params.title,
        p_quiz_id: params.quizId || null,
        p_category: params.category || 'Bible Challenge',
        p_time_limit_seconds: params.timeLimitSeconds || 20,
        p_is_public: params.isPublic ?? true,
        p_allow_guests: params.allowGuests ?? true,
        p_participant_limit: params.participantLimit || 50,
      });

      // 2.5s timeout for resilient fallback on network latency
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase RPC timeout')), 2500)
      );

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

      if (error || !data) {
        console.warn('Supabase create_game_session error, using local fallback:', error?.message || 'No data');
        const localPin = Math.floor(100000 + Math.random() * 900000).toString();
        const localSessionId = `local_session_${Date.now()}`;
        return {
          sessionId: localSessionId,
          pin: localPin,
          title: params.title,
        };
      }

      return {
        sessionId: data.id,
        pin: data.pin,
        title: data.title,
      };
    } catch (err: any) {
      console.warn('Supabase create_game_session failed/timed out, using local fallback:', err?.message);
      const localPin = Math.floor(100000 + Math.random() * 900000).toString();
      const localSessionId = `local_session_${Date.now()}`;
      return {
        sessionId: localSessionId,
        pin: localPin,
        title: params.title,
      };
    }
  },

  /**
   * Look up public session metadata by 6-digit PIN before joining
   */
  async getSessionDetails(pin: string): Promise<{
    id?: string;
    pin: string;
    title: string;
    hostName: string;
    category: string;
    status: string;
    allowGuests: boolean;
    participantCount: number;
    participantLimit: number;
    isGameMode?: boolean;
    gameModeId?: string;
  } | null> {
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) return null;

    // Check if this PIN belongs to a Multiplayer Game Mode session
    const mpSession = multiplayerGameService.getSessionByPin(cleanPin);
    if (mpSession) {
      const parts = multiplayerGameService.getParticipants(cleanPin);
      return {
        id: mpSession.sessionId,
        pin: mpSession.pin,
        title: mpSession.gameTitle,
        hostName: mpSession.hostName,
        category: 'Interactive Game',
        status: mpSession.status,
        allowGuests: true,
        participantCount: parts.length,
        participantLimit: 50,
        isGameMode: true,
        gameModeId: mpSession.gameModeId,
      };
    }

    if (!isSupabaseConfigured) {
      // Local/offline fallback
      return {
        id: `local_sess_${cleanPin}`,
        pin: cleanPin,
        title: 'Community Bible Arena',
        hostName: 'Arena Host',
        category: 'Bible Challenge',
        status: 'lobby',
        allowGuests: true,
        participantCount: 3,
        participantLimit: 50,
      };
    }

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('id, game_pin, title, host_name, category, status, allow_guests, participant_limit')
        .eq('game_pin', cleanPin)
        .maybeSingle();

      if (!error && data) {
        const { count } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('game_session_id', data.id);

        return {
          id: data.id,
          pin: data.game_pin,
          title: data.title,
          hostName: data.host_name || 'Host',
          category: data.category || 'Bible Challenge',
          status: data.status,
          allowGuests: data.allow_guests ?? true,
          participantCount: count || 0,
          participantLimit: data.participant_limit || 50,
        };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_game_session_by_pin', {
        p_pin: cleanPin,
      });

      if (!rpcError && rpcData) {
        return {
          pin: rpcData.game_pin,
          title: rpcData.title,
          hostName: 'Arena Host',
          category: rpcData.category || 'Bible Challenge',
          status: rpcData.status,
          allowGuests: rpcData.allow_guests ?? true,
          participantCount: 0,
          participantLimit: 50,
        };
      }
    } catch (err) {
      console.warn('Error fetching session details by PIN:', err);
    }

    return null;
  },

  /**
   * Join an existing game session using a 6-digit PIN
   */
  async joinGame(params: {
    pin: string;
    nickname: string;
    avatar?: string;
  }): Promise<JoinGameResult> {
    const cleanPin = params.pin.trim().replace(/\D/g, '');

    // Check if PIN belongs to an interactive game mode session
    const mpSession = multiplayerGameService.getSessionByPin(cleanPin);
    if (mpSession) {
      const res = await multiplayerGameService.joinGameModeSession({
        pin: cleanPin,
        nickname: params.nickname,
        avatar: params.avatar || 'hero-david',
      });
      return {
        participantId: res.participant.id,
        sessionId: res.session.sessionId,
        pin: res.session.pin,
        title: res.session.gameTitle,
        status: res.session.status,
        roundPhase: res.session.roundPhase || 'answering',
        currentQuestionIndex: res.session.currentQuestionIndex || 0,
        isGameMode: true,
        gameModeId: res.session.gameModeId,
      };
    }

    if (!isSupabaseConfigured) {
      // Offline fallback
      return {
        participantId: `local_part_${Date.now()}`,
        sessionId: `local_sess_${params.pin}`,
        pin: params.pin,
        title: 'Community Bible Arena',
        status: 'lobby',
        roundPhase: 'answering',
        currentQuestionIndex: 0,
      };
    }

    try {
      const joinPromise = supabase.rpc('join_game_session', {
        p_game_pin: params.pin.trim(),
        p_nickname: params.nickname.trim(),
        p_avatar: params.avatar || 'hero-david',
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('join_game_session timeout')), 2500)
      );

      const { data, error } = await Promise.race([joinPromise, timeoutPromise]);

      if (error || !data) {
        console.warn('Supabase join error, falling back to local session:', error?.message);
        return {
          participantId: `local_part_${Date.now()}`,
          sessionId: `local_sess_${params.pin}`,
          pin: params.pin,
          title: 'Community Bible Arena',
          status: 'lobby',
          roundPhase: 'answering',
          currentQuestionIndex: 0,
        };
      }

      // Persist server-issued cryptographic guest credential
      if (data.guest_credential) {
        try {
          localStorage.setItem('biblearena_guest_credential', data.guest_credential);
        } catch {}
      }

      return {
        participantId: data.participant_id,
        sessionId: data.session_id,
        pin: data.pin || params.pin,
        title: data.title || 'Community Bible Arena',
        status: data.status || 'lobby',
        roundPhase: data.round_phase || 'answering',
        currentQuestionIndex: data.current_question_index || 0,
      };
    } catch (err: any) {
      console.warn('Supabase join failed/timed out, falling back to local session:', err?.message);
      return {
        participantId: `local_part_${Date.now()}`,
        sessionId: `local_sess_${params.pin}`,
        pin: params.pin,
        title: 'Community Bible Arena',
        status: 'lobby',
        roundPhase: 'answering',
        currentQuestionIndex: 0,
      };
    }
  },

  /**
   * Submit an answer for the current active question (Server calculates response timing)
   */
  async submitAnswer(params: {
    sessionId: string;
    participantId: string;
    questionId: string;
    selectedOptionIndex: number;
    responseTimeMs?: number;
    totalTimeSeconds?: number;
  }): Promise<AnswerSubmissionResult> {
    if (!isSupabaseConfigured) {
      // Offline calculation fallback: mirrors server formula
      // score = 700 + floor(300 * remaining_time / total_time)
      const isCorrect = true;
      const totalTime = params.totalTimeSeconds || 20;
      const elapsedSeconds = Math.max(0, (params.responseTimeMs || 0) / 1000);
      const remainingSeconds = Math.max(0, Math.min(totalTime, totalTime - elapsedSeconds));
      const basePoints = 700;
      const speedBonus = Math.floor(300 * (remainingSeconds / totalTime));
      const points = basePoints + speedBonus;
      return {
        isCorrect,
        pointsAwarded: points,
        basePoints,
        speedBonus,
        totalScore: points,
        streak: 1,
        rank: 1,
        correctAnswersCount: 1,
        questionsAnsweredCount: 1,
      };
    }

    let guestCredential: string | null = null;
    try {
      guestCredential = localStorage.getItem('biblearena_guest_credential');
    } catch {}

    const { data, error } = await supabase.rpc('submit_game_answer', {
      p_session_id: params.sessionId,
      p_participant_id: params.participantId,
      p_question_id: params.questionId,
      p_selected_option_index: params.selectedOptionIndex,
      p_guest_credential: guestCredential,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      isCorrect: data.is_correct,
      pointsAwarded: data.points_awarded,
      basePoints: data.base_points ?? (data.is_correct ? 700 : 0),
      speedBonus: data.speed_bonus ?? (data.points_awarded > 700 ? data.points_awarded - 700 : 0),
      totalScore: data.total_score,
      streak: data.streak,
      rank: data.rank,
      correctAnswersCount: data.correct_answers_count,
      questionsAnsweredCount: data.questions_answered_count,
    };
  },

  /**
   * Fetch current active question safely from server
   */
  async getActiveQuestion(sessionId: string, participantId?: string) {
    if (!isSupabaseConfigured) return null;
    let guestCredential: string | null = null;
    try {
      guestCredential = localStorage.getItem('biblearena_guest_credential');
    } catch {}

    const { data, error } = await supabase.rpc('get_active_game_question', {
      p_session_id: sessionId,
      p_participant_id: participantId || null,
      p_guest_credential: guestCredential,
    });

    if (error || !data) return null;
    return {
      id: data.id,
      questionOrder: data.question_order,
      text: data.text,
      scriptureReference: data.scripture_reference,
      explanation: data.explanation,
      timeLimitSeconds: data.time_limit_seconds || 20,
      options: (data.options || []).map((o: any) => o.option_text),
    };
  },

  /**
   * Fetch current participants for a game session (Supports both public sessions and private-room guests)
   */
  async getParticipants(sessionId: string, participantId?: string): Promise<LiveParticipant[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('game_session_id', sessionId)
      .order('score', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        nickname: row.nickname,
        avatar: row.avatar,
        score: row.score,
        streak: row.streak,
        rank: row.rank,
        positionDelta: row.position_delta,
        status: row.status,
        isHost: row.is_host,
        correctAnswersCount: row.correct_answers_count || 0,
        questionsAnsweredCount: row.questions_answered_count || 0,
        totalResponseTimeMs: row.total_response_time_ms || 0,
      }));
    }

    // In private rooms, unauthenticated guests access the leaderboard through the authorized RPC
    try {
      let guestCredential: string | null = null;
      try {
        guestCredential = localStorage.getItem('biblearena_guest_credential');
      } catch {}

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_session_leaderboard', {
        p_session_id: sessionId,
        p_participant_id: participantId || null,
        p_guest_credential: guestCredential,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((row: any) => ({
          id: row.id,
          nickname: row.nickname,
          avatar: row.avatar,
          score: row.score,
          streak: row.streak,
          rank: row.rank,
          positionDelta: row.position_delta,
          status: row.status,
          isHost: false,
          correctAnswersCount: row.correct_answers_count || 0,
          questionsAnsweredCount: row.questions_answered_count || 0,
          totalResponseTimeMs: row.total_response_time_ms || 0,
        }));
      }
    } catch {}

    if (error) {
      console.error('Error fetching participants:', error);
    }
    return [];
  },

  /**
   * Host Control: Advance to the next question
   */
  async advanceQuestion(sessionId: string, nextIndex: number): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.rpc('advance_game_question', {
      p_session_id: sessionId,
      p_next_question_index: nextIndex,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Host Control: Close current question & recalculate live rankings
   */
  async closeQuestion(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.rpc('close_current_question', {
      p_session_id: sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Host Control: End competition and trigger final podium
   */
  async endGame(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.rpc('end_game_session', {
      p_session_id: sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Subscribe to real-time session state changes
   */
  subscribeToSession(sessionId: string, onUpdate: (payload: any) => void) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  /**
   * Subscribe to real-time participants and leaderboard updates
   */
  subscribeToParticipants(sessionId: string, onUpdate: () => void) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `game_session_id=eq.${sessionId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
