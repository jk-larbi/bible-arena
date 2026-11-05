-- ============================================================================
-- BIBLEARENA — FULL MULTIPLAYER SYSTEM FOR ALL 18 GAMES & CHAMPIONSHIPS
-- Migration: 20261105030000_multiplayer_game_modes.sql
-- ============================================================================
-- Architecture:
-- 1. Extend game_sessions with game_mode_id, is_ranked, level_number
-- 2. multiplayer_match_history table for auditing, standings & rating deltas
-- 3. user_gamemode_leaderboards table for game-specific competitive statistics
-- 4. Server-Authoritative RPCs for fair match finalization and rating updates
-- 5. Row-Level Security ensuring strict authorization & cheating prevention
-- ============================================================================

-- 1. EXTEND GAME SESSIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_sessions' AND column_name = 'game_mode_id') THEN
    ALTER TABLE public.game_sessions ADD COLUMN game_mode_id TEXT DEFAULT 'trivia';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_sessions' AND column_name = 'is_ranked') THEN
    ALTER TABLE public.game_sessions ADD COLUMN is_ranked BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_sessions' AND column_name = 'level_number') THEN
    ALTER TABLE public.game_sessions ADD COLUMN level_number INT DEFAULT 1;
  END IF;
END $$;

-- 2. MULTIPLAYER MATCH HISTORY
CREATE TABLE IF NOT EXISTS public.multiplayer_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  game_mode_id TEXT NOT NULL,
  game_title TEXT NOT NULL,
  level_number INT NOT NULL DEFAULT 1,
  is_ranked BOOLEAN NOT NULL DEFAULT true,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  total_players INT NOT NULL DEFAULT 1,
  winner_id TEXT,
  winner_name TEXT,
  match_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mp_history_mode_date 
  ON public.multiplayer_match_history(game_mode_id, completed_at DESC);

-- 3. GAME-SPECIFIC COMPETITIVE LEADERBOARDS
CREATE TABLE IF NOT EXISTS public.user_gamemode_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🕊️',
  game_mode_id TEXT NOT NULL,
  total_points INT NOT NULL DEFAULT 0,
  matches_played INT NOT NULL DEFAULT 0,
  matches_won INT NOT NULL DEFAULT 0,
  win_rate_percent INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_challenges INT NOT NULL DEFAULT 0,
  avg_accuracy_percent INT NOT NULL DEFAULT 0,
  competitive_tier TEXT NOT NULL DEFAULT 'Bronze',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, game_mode_id)
);

CREATE INDEX IF NOT EXISTS idx_gamemode_leaderboard_points 
  ON public.user_gamemode_leaderboards(game_mode_id, total_points DESC);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.multiplayer_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamemode_leaderboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on match history" ON public.multiplayer_match_history;
CREATE POLICY "Public read on match history"
  ON public.multiplayer_match_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read on game leaderboards" ON public.user_gamemode_leaderboards;
CREATE POLICY "Public read on game leaderboards"
  ON public.user_gamemode_leaderboards FOR SELECT
  USING (true);

-- Revoke direct mutation from clients
REVOKE INSERT, UPDATE, DELETE ON public.multiplayer_match_history FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_gamemode_leaderboards FROM authenticated, anon;
