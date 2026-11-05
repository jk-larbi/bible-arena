import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, Quiz, Question } from '../types/bibleArena';

export interface ConnectionCheckResult {
  connected: boolean;
  status: 'connected' | 'missing_credentials' | 'network_error' | 'database_error';
  message: string;
  url?: string;
  errorDetails?: string;
}

/**
 * Verifies real communication with the Supabase database.
 */
export async function checkDatabaseConnection(): Promise<ConnectionCheckResult> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      status: 'missing_credentials',
      message: 'Supabase credentials are missing or set to placeholder values in .env',
      errorDetails: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be populated with your project values.',
    };
  }

  const startTime = performance.now();
  try {
    // Attempt a light SELECT against public.profiles table
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - startTime);

    if (error) {
      // Table might not exist yet if migrations haven't run, or invalid API key
      return {
        connected: false,
        status: 'database_error',
        message: `Supabase responded with an error (${latency}ms): ${error.message}`,
        url: import.meta.env.VITE_SUPABASE_URL,
        errorDetails: `Code: ${error.code} | Hint: ${error.hint || 'Check if the SQL migration has been applied.'}`,
      };
    }

    return {
      connected: true,
      status: 'connected',
      message: `Successfully connected to Supabase PostgreSQL database (${latency}ms latency).`,
      url: import.meta.env.VITE_SUPABASE_URL,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'network_error',
      message: `Failed to communicate with Supabase: ${err.message || 'Network error'}`,
      errorDetails: err.stack,
    };
  }
}

/**
 * Database Service Layer
 */
export const dbService = {
  // 1. PROFILES
  profiles: {
    async get(id: string): Promise<UserProfile | null> {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        name: data.name,
        nickname: data.nickname,
        email: data.email,
        avatar: data.avatar || '🕊️',
        role: data.role || 'member',
        groupAffiliation: data.group_affiliation,
        totalPoints: data.total_points || 0,
        quizzesCompleted: data.quizzes_completed || 0,
        accuracy: data.accuracy || 0,
        streakDays: data.streak_days || 0,
        hostedArenasCount: data.hosted_arenas_count || 0,
      };
    },

    async update(id: string, updates: Partial<UserProfile>): Promise<boolean> {
      if (!isSupabaseConfigured) return false;
      // Prevent client-side self-elevation to admin
      const sanitizedUpdates: any = {
        name: updates.name,
        nickname: updates.nickname,
        avatar: updates.avatar,
        group_affiliation: updates.groupAffiliation,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('id', id);

      return !error;
    },
  },

  // 2. QUIZZES
  quizzes: {
    async list(): Promise<Quiz[]> {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        questionCount: q.question_count,
        estimatedMinutes: q.estimated_minutes,
        coverImage: q.cover_image,
        authorName: q.author_name,
        questions: [],
        playsCount: q.plays_count || 0,
        isCustom: true,
      }));
    },

    async getWithQuestions(quizId: string): Promise<Quiz | null> {
      if (!isSupabaseConfigured) return null;
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError || !quizData) return null;

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          scripture_reference,
          explanation,
          question_order,
          question_options (
            option_index,
            option_text
          )
        `)
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (qError) return null;

      const questions: Question[] = (qData || []).map((row: any) => {
        const sortedOptions = (row.question_options || [])
          .sort((a: any, b: any) => a.option_index - b.option_index)
          .map((o: any) => o.option_text);

        return {
          id: row.id,
          text: row.text,
          options: sortedOptions,
          correctAnswerIndex: 0, // answer key is protected by RLS
          scriptureReference: row.scripture_reference || '',
          explanation: row.explanation || '',
        };
      });

      return {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        questionCount: questions.length,
        estimatedMinutes: quizData.estimated_minutes || 5,
        authorName: quizData.author_name,
        questions,
        playsCount: quizData.plays_count || 0,
        isCustom: true,
      };
    },
  },

  // 3. GAME SESSIONS
  sessions: {
    async getByPin(pin: string) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.rpc('get_game_session_by_pin', {
        p_pin: pin.trim(),
      });

      if (error || !data) return null;
      return data;
    },
  },

  // 4. PARTICIPANTS
  participants: {
    async listBySession(sessionId: string) {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('score', { ascending: false });

      if (error || !data) return [];
      return data;
    },
  },
};
