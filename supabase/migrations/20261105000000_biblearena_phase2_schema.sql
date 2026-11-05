-- ============================================================================
-- BIBLEARENA — PHASE 2: HARDENED DATABASE ARCHITECTURE & SECURITY POLICIES
-- Migration: 20261105000000_biblearena_phase2_schema.sql
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. DYNAMIC CLEANUP OF ALL OBSOLETE & UNINTENDED RLS POLICIES
-- Ensures no legacy or permissive policies survive under arbitrary names
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  v_tables TEXT[] := ARRAY[
    'profiles', 'quizzes', 'questions', 'question_options', 
    'answer_keys', 'game_sessions', 'participants', 
    'participant_secrets', 'game_answers'
  ];
  t TEXT;
BEGIN
  RAISE NOTICE 'BIBLEARENA PHASE 2: Purging legacy and untracked RLS policies across all tables...';
  FOREACH t IN ARRAY v_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = t
      ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- 3. TABLES & ARCHITECTURE DEFINITIONS
-- ============================================================================

-- PROFILES (Users and Members)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT,
  avatar TEXT DEFAULT '🕊️',
  role TEXT DEFAULT 'member' CHECK (role IN ('guest', 'member', 'admin')),
  group_affiliation TEXT,
  total_points INT DEFAULT 0,
  quizzes_completed INT DEFAULT 0,
  accuracy INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  hosted_arenas_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUIZZES (Unlimited questions per quiz)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  estimated_minutes INT DEFAULT 5,
  question_count INT DEFAULT 0,
  cover_image TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  is_public BOOLEAN DEFAULT true,
  plays_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTIONS (Unlimited questions, validated 5s to 120s limit, mandatory NOT NULL)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_order INT NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  scripture_reference TEXT,
  explanation TEXT,
  time_limit_seconds INT NOT NULL DEFAULT 20 CHECK (time_limit_seconds BETWEEN 5 AND 120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTION OPTIONS (Four distinct choices A, B, C, D)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_index INT NOT NULL CHECK (option_index BETWEEN 0 AND 3),
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, option_index)
);

-- SECURE ANSWER KEYS (Kept separate and private from ordinary client queries)
CREATE TABLE IF NOT EXISTS public.answer_keys (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_option_index INT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MULTIPLAYER GAME SESSIONS (Mandatory quiz backing, validated 10s to 120s limit)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_pin VARCHAR(6) NOT NULL,
  title TEXT NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Bible Challenge',
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'results', 'completed')),
  current_question_index INT DEFAULT 0,
  round_phase TEXT NOT NULL DEFAULT 'answering' CHECK (round_phase IN ('question_intro', 'answering', 'leaderboard', 'podium')),
  round_started_at TIMESTAMPTZ,
  round_deadline TIMESTAMPTZ,
  time_limit_seconds INT NOT NULL DEFAULT 20 CHECK (time_limit_seconds BETWEEN 10 AND 120),
  is_public BOOLEAN DEFAULT true,
  allow_guests BOOLEAN DEFAULT true,
  participant_limit INT DEFAULT 50 CHECK (participant_limit BETWEEN 2 AND 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTICIPANTS (Clean public roster; contains NO secrets or credentials)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🕊️',
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  correct_answers_count INT NOT NULL DEFAULT 0,
  questions_answered_count INT NOT NULL DEFAULT 0,
  total_response_time_ms INT NOT NULL DEFAULT 0,
  rank INT DEFAULT 1,
  position_delta INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'ready', 'answered', 'disconnected')),
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTICIPANT SECRETS (Isolated vault: guest credential hashes never exposed to client SELECT)
CREATE TABLE IF NOT EXISTS public.participant_secrets (
  participant_id UUID PRIMARY KEY REFERENCES public.participants(id) ON DELETE CASCADE,
  guest_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GAME ANSWERS (Server-recorded participant answers)
CREATE TABLE IF NOT EXISTS public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_index INT NOT NULL CHECK (selected_option_index BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded INT NOT NULL DEFAULT 0,
  base_points INT NOT NULL DEFAULT 0,
  speed_bonus INT NOT NULL DEFAULT 0,
  response_time_ms INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_session_id, participant_id, question_id)
);

-- ============================================================================
-- 4. MIGRATION COMPATIBILITY, DATA NORMALIZATION & CONSTRAINT ENFORCEMENT
-- Ensures missing columns are added first before normalization and constraints
-- ============================================================================
DO $$
DECLARE
  v_dup_user_count INT;
  v_dup_nick_count INT;
  v_null_quiz_sessions INT := 0;
BEGIN
  -- Step 4.1: Ensure compatibility columns exist on all tables
  -- Profiles Columns
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '🕊️';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS group_affiliation TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quizzes_completed INT DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accuracy INT DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hosted_arenas_count INT DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

  -- Quizzes Columns
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS plays_count INT DEFAULT 0;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS question_count INT DEFAULT 0;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 5;

  -- Game Sessions Columns
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS quiz_id UUID;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMPTZ;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS round_deadline TIMESTAMPTZ;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS round_phase TEXT DEFAULT 'answering';
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT true;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS participant_limit INT DEFAULT 50;
  ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS time_limit_seconds INT DEFAULT 20;

  -- Questions Columns
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS time_limit_seconds INT DEFAULT 20;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_order INT DEFAULT 0;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS scripture_reference TEXT;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation TEXT;

  -- Participants Columns
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS rank INT DEFAULT 1;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS position_delta INT DEFAULT 0;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS correct_answers_count INT DEFAULT 0;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS questions_answered_count INT DEFAULT 0;
  ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS total_response_time_ms INT DEFAULT 0;

  -- Game Answers Columns
  ALTER TABLE public.game_answers ADD COLUMN IF NOT EXISTS base_points INT DEFAULT 0;
  ALTER TABLE public.game_answers ADD COLUMN IF NOT EXISTS speed_bonus INT DEFAULT 0;

  -- Step 4.2: Normalize data across pre-existing rows
  UPDATE public.profiles SET name = 'User' WHERE name IS NULL;
  UPDATE public.profiles SET nickname = 'player' WHERE nickname IS NULL;

  UPDATE public.questions 
  SET time_limit_seconds = 20 
  WHERE time_limit_seconds IS NULL OR time_limit_seconds < 5 OR time_limit_seconds > 120;

  UPDATE public.game_sessions 
  SET time_limit_seconds = 20 
  WHERE time_limit_seconds IS NULL OR time_limit_seconds < 10 OR time_limit_seconds > 120;

  -- Step 4.3: Enforce NOT NULL on essential attributes
  ALTER TABLE public.questions ALTER COLUMN time_limit_seconds SET NOT NULL;
  ALTER TABLE public.game_sessions ALTER COLUMN time_limit_seconds SET NOT NULL;

  -- Check if legacy game_sessions has any rows with NULL quiz_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_sessions') THEN
    SELECT COUNT(*) INTO v_null_quiz_sessions
    FROM public.game_sessions
    WHERE quiz_id IS NULL;

    IF v_null_quiz_sessions > 0 THEN
      RAISE WARNING 'BibleArena Preflight: % historical game_session record(s) have NULL quiz_id. Cannot set NOT NULL on quiz_id without administrative intervention.', v_null_quiz_sessions;
    ELSE
      ALTER TABLE public.game_sessions ALTER COLUMN quiz_id SET NOT NULL;
    END IF;

    -- Ensure foreign key constraint on game_sessions.quiz_id is present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public' 
        AND tc.table_name = 'game_sessions' 
        AND ccu.column_name = 'quiz_id'
    ) THEN
      ALTER TABLE public.game_sessions 
      ADD CONSTRAINT fk_game_sessions_quiz 
      FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- Step 4.4: Add time limit constraints if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'questions' AND constraint_name = 'chk_questions_time_limit'
  ) THEN
    ALTER TABLE public.questions ADD CONSTRAINT chk_questions_time_limit CHECK (time_limit_seconds BETWEEN 5 AND 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'game_sessions' AND constraint_name = 'chk_game_sessions_time_limit'
  ) THEN
    ALTER TABLE public.game_sessions ADD CONSTRAINT chk_game_sessions_time_limit CHECK (time_limit_seconds BETWEEN 10 AND 120);
  END IF;

  -- Step 4.5: Audit existing duplicate records before index creation (preserves all data without silent deletion)
  SELECT COUNT(*) INTO v_dup_user_count
  FROM (
    SELECT game_session_id, user_id
    FROM public.participants
    WHERE user_id IS NOT NULL
    GROUP BY game_session_id, user_id
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_user_count > 0 THEN
    RAISE WARNING 'BibleArena Preflight Audit: Found % session(s) with duplicate registered user entries. Unique index creation requires manual deduplication.', v_dup_user_count;
  END IF;

  SELECT COUNT(*) INTO v_dup_nick_count
  FROM (
    SELECT game_session_id, LOWER(nickname)
    FROM public.participants
    GROUP BY game_session_id, LOWER(nickname)
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_nick_count > 0 THEN
    RAISE WARNING 'BibleArena Preflight Audit: Found % session(s) with case-insensitive nickname duplicates. Unique index creation requires manual deduplication.', v_dup_nick_count;
  END IF;
END;
$$;

-- ============================================================================
-- 5. INDEXES & CONCURRENCY CONSTRAINTS
-- ============================================================================

-- Active PIN uniqueness: PINs are recyclable once a game reaches results or completed
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_active_pin 
  ON public.game_sessions(game_pin) 
  WHERE status IN ('lobby', 'active');

-- Case-insensitive nickname uniqueness per game session
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_lower_nickname 
  ON public.participants(game_session_id, LOWER(nickname));

-- Unique registered participant per game session (prevents duplicate joins by same user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_user 
  ON public.participants(game_session_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_is_public ON public.game_sessions(is_public);
CREATE INDEX IF NOT EXISTS idx_participants_session ON public.participants(game_session_id);
CREATE INDEX IF NOT EXISTS idx_participants_score ON public.participants(game_session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_participants_session_ranking 
  ON public.participants(game_session_id, score DESC, correct_answers_count DESC, total_response_time_ms ASC);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id, question_order);
CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id, option_index);
CREATE INDEX IF NOT EXISTS idx_game_answers_session_q ON public.game_answers(game_session_id, question_id);

-- ============================================================================
-- 6. ACTIVE GAME QUIZ MUTATION PROTECTION
-- (Enforces deadlock-free sorted row locking on parent quizzes during changes)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_active_quiz_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_raw_quiz_ids UUID[] := ARRAY[]::UUID[];
  v_sorted_quiz_ids UUID[];
  v_qid UUID;
BEGIN
  -- 1. Identify all affected quiz IDs across OLD and NEW records
  IF TG_TABLE_NAME = 'quizzes' THEN
    IF TG_OP = 'DELETE' THEN
      v_raw_quiz_ids := ARRAY[OLD.id];
    ELSIF TG_OP = 'UPDATE' THEN
      v_raw_quiz_ids := ARRAY[OLD.id, NEW.id];
    END IF;
  ELSIF TG_TABLE_NAME = 'questions' THEN
    IF TG_OP = 'DELETE' THEN
      v_raw_quiz_ids := ARRAY[OLD.quiz_id];
    ELSIF TG_OP = 'INSERT' THEN
      v_raw_quiz_ids := ARRAY[NEW.quiz_id];
    ELSIF TG_OP = 'UPDATE' THEN
      v_raw_quiz_ids := ARRAY[OLD.quiz_id, NEW.quiz_id];
    END IF;
  ELSIF TG_TABLE_NAME = 'question_options' OR TG_TABLE_NAME = 'answer_keys' THEN
    IF TG_OP = 'DELETE' THEN
      SELECT quiz_id INTO v_qid FROM public.questions WHERE id = OLD.question_id;
      IF v_qid IS NOT NULL THEN v_raw_quiz_ids := ARRAY[v_qid]; END IF;
    ELSIF TG_OP = 'INSERT' THEN
      SELECT quiz_id INTO v_qid FROM public.questions WHERE id = NEW.question_id;
      IF v_qid IS NOT NULL THEN v_raw_quiz_ids := ARRAY[v_qid]; END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      SELECT quiz_id INTO v_qid FROM public.questions WHERE id = OLD.question_id;
      IF v_qid IS NOT NULL THEN v_raw_quiz_ids := array_append(v_raw_quiz_ids, v_qid); END IF;
      SELECT quiz_id INTO v_qid FROM public.questions WHERE id = NEW.question_id;
      IF v_qid IS NOT NULL THEN v_raw_quiz_ids := array_append(v_raw_quiz_ids, v_qid); END IF;
    END IF;
  END IF;

  -- 2. Sort and deduplicate quiz IDs to prevent deadlocks when locking multiple rows
  SELECT COALESCE(array_agg(DISTINCT q_id ORDER BY q_id), ARRAY[]::UUID[])
  INTO v_sorted_quiz_ids
  FROM unnest(v_raw_quiz_ids) AS q_id
  WHERE q_id IS NOT NULL;

  -- 3. Acquire row lock on parent quizzes and verify no active sessions reference them
  FOREACH v_qid IN ARRAY v_sorted_quiz_ids LOOP
    -- FOR NO KEY UPDATE synchronizes with create_game_session()
    PERFORM 1 FROM public.quizzes WHERE id = v_qid FOR NO KEY UPDATE;

    IF EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE quiz_id = v_qid AND status IN ('lobby', 'active')
    ) THEN
      RAISE EXCEPTION 'Operation rejected: Cannot modify or delete quiz content while active game sessions are using it. Please wait until games conclude.';
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_active_quiz_mutation ON public.quizzes;
CREATE TRIGGER trg_prevent_active_quiz_mutation
  BEFORE UPDATE OR DELETE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_active_quiz_mutation();

DROP TRIGGER IF EXISTS trg_prevent_active_questions_mutation ON public.questions;
CREATE TRIGGER trg_prevent_active_questions_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_active_quiz_mutation();

DROP TRIGGER IF EXISTS trg_prevent_active_options_mutation ON public.question_options;
CREATE TRIGGER trg_prevent_active_options_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.question_options
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_active_quiz_mutation();

DROP TRIGGER IF EXISTS trg_prevent_active_keys_mutation ON public.answer_keys;
CREATE TRIGGER trg_prevent_active_keys_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.answer_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_active_quiz_mutation();

-- ============================================================================
-- 7. SECURITY DEFINER HELPER FUNCTIONS (PARAMETERLESS / NON-RECURSIVE)
-- ============================================================================

-- Safe Administrator Evaluation (Evaluates auth.uid() directly)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  END;
$$;

-- Session Membership Evaluation using caller's auth.uid()
CREATE OR REPLACE FUNCTION public.is_session_member(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.participants
      WHERE game_session_id = p_session_id AND user_id = auth.uid()
    )
  END;
$$;

-- Session Host or Public Check using caller's auth.uid()
CREATE OR REPLACE FUNCTION public.is_session_host_or_public(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_sessions
    WHERE id = p_session_id AND (is_public = true OR (auth.uid() IS NOT NULL AND host_id = auth.uid()))
  );
$$;

-- ============================================================================
-- 8. PUBLIC PROJECTION VIEW (REMOVES SENSITIVE EMAIL & ADMIN ATTRIBUTES)
-- ============================================================================

CREATE OR REPLACE VIEW public.public_profiles WITH (security_barrier = true) AS
SELECT 
  id,
  nickname,
  avatar,
  total_points,
  quizzes_completed,
  accuracy,
  streak_days,
  hosted_arenas_count,
  created_at
FROM public.profiles;

ALTER VIEW public.public_profiles OWNER TO postgres;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES — EXPLICIT & NON-RECURSIVE
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;

-- 9.1 PROFILES POLICIES
CREATE POLICY "Users can view own profile or admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_admin()
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 9.2 PROFILE STAT & ROLE TAMPERING PREVENTION (TRIGGER)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_call_stack TEXT;
BEGIN
  -- Registration: Bind email to verified auth identity, force member role and zero stats
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT email INTO NEW.email FROM auth.users WHERE id = auth.uid();
      IF NEW.email IS NULL AND auth.jwt() IS NOT NULL THEN
        NEW.email := auth.jwt() ->> 'email';
      END IF;
    ELSE
      NEW.email := NULL;
    END IF;

    NEW.role := 'member';
    NEW.total_points := 0;
    NEW.quizzes_completed := 0;
    NEW.accuracy := 0;
    NEW.streak_days := 0;
    NEW.hosted_arenas_count := 0;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Profile Update: Prevent unauthorized role or email alteration and prevent NULL stats
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can modify roles.';
      END IF;
    END IF;

    -- Protect user email from being overwritten via ordinary profile update
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      IF NOT public.is_admin() THEN
        NEW.email := OLD.email;
      END IF;
    END IF;

    -- Protect lifetime statistics: verify that any modification comes from trusted server routines or an admin
    IF (NEW.total_points IS DISTINCT FROM OLD.total_points OR
        NEW.quizzes_completed IS DISTINCT FROM OLD.quizzes_completed OR
        NEW.accuracy IS DISTINCT FROM OLD.accuracy OR
        NEW.streak_days IS DISTINCT FROM OLD.streak_days OR
        NEW.hosted_arenas_count IS DISTINCT FROM OLD.hosted_arenas_count) THEN

      GET DIAGNOSTICS v_call_stack = PG_CONTEXT;
      -- Direct client updates to statistics are forbidden.
      -- Modification is permitted strictly via authorized internal procedures (end_game_session, create_game_session) or administrators.
      -- No caller-configurable variables (GUC settings) are accepted as authorization.
      IF NOT (
        public.is_admin() OR
        v_call_stack LIKE '%end_game_session%' OR
        v_call_stack LIKE '%create_game_session%'
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of lifetime profile statistics is prohibited.';
      END IF;
    END IF;

    -- Ensure statistics are never set to NULL
    NEW.total_points := COALESCE(NEW.total_points, OLD.total_points, 0);
    NEW.quizzes_completed := COALESCE(NEW.quizzes_completed, OLD.quizzes_completed, 0);
    NEW.accuracy := COALESCE(NEW.accuracy, OLD.accuracy, 0);
    NEW.streak_days := COALESCE(NEW.streak_days, OLD.streak_days, 0);
    NEW.hosted_arenas_count := COALESCE(NEW.hosted_arenas_count, OLD.hosted_arenas_count, 0);
    NEW.updated_at := NOW();

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- 9.3 QUIZZES POLICIES
CREATE POLICY "Quizzes are viewable by everyone" ON public.quizzes
  FOR SELECT USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can modify their quizzes" ON public.quizzes
  FOR ALL USING (auth.uid() = author_id);

-- 9.4 QUESTIONS & OPTIONS POLICIES
CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND (is_public = true OR author_id = auth.uid()))
  );

CREATE POLICY "Quiz authors can insert questions" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND author_id = auth.uid())
  );

CREATE POLICY "Quiz authors can modify questions" ON public.questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND author_id = auth.uid())
  );

CREATE POLICY "Question options are viewable by everyone" ON public.question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON q.quiz_id = z.id
      WHERE q.id = question_id AND (z.is_public = true OR z.author_id = auth.uid())
    )
  );

CREATE POLICY "Quiz authors can modify question options" ON public.question_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON q.quiz_id = z.id
      WHERE q.id = question_id AND z.author_id = auth.uid()
    )
  );

-- 9.5 ANSWER KEYS POLICIES (Strictly hidden from players)
CREATE POLICY "Answer keys visible only to quiz author" ON public.answer_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON q.quiz_id = z.id
      WHERE q.id = answer_keys.question_id AND z.author_id = auth.uid()
    )
  );

CREATE POLICY "Quiz authors can insert answer keys" ON public.answer_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON q.quiz_id = z.id
      WHERE q.id = answer_keys.question_id AND z.author_id = auth.uid()
    )
  );

-- 9.6 GAME SESSIONS POLICIES
CREATE POLICY "Public sessions viewable or private sessions by members" ON public.game_sessions
  FOR SELECT USING (
    is_public = true 
    OR auth.uid() = host_id
    OR public.is_session_member(id)
  );

-- 9.7 PARTICIPANTS POLICIES
CREATE POLICY "Participants viewable by room members" ON public.participants
  FOR SELECT USING (
    public.is_session_host_or_public(game_session_id)
    OR public.is_session_member(game_session_id)
  );

-- 9.8 PARTICIPANT SECRETS POLICIES (Zero client read/write access)
-- No policies granted to anon or authenticated. Only internal SECURITY DEFINER functions access this table.

-- 9.9 GAME ANSWERS POLICIES
CREATE POLICY "Game answers viewable by participant or host" ON public.game_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = game_answers.participant_id AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.game_sessions s
      WHERE s.id = game_answers.game_session_id AND s.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. STORED PROCEDURES & SECURE RPCS
-- ============================================================================

-- Function: Cryptographically Secure Random 6-digit PIN Generation
CREATE OR REPLACE FUNCTION public.generate_unique_game_pin()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_bytes BYTEA;
  v_num BIGINT;
BEGIN
  -- Pure 32-bit unsigned arithmetic avoids bit shift overflow and invalid string-to-bit conversion
  v_bytes := gen_random_bytes(4);
  v_num := (get_byte(v_bytes, 0)::bigint * 16777216) +
           (get_byte(v_bytes, 1)::bigint * 65536) +
           (get_byte(v_bytes, 2)::bigint * 256) +
           (get_byte(v_bytes, 3)::bigint);
  RETURN (100000 + (v_num % 900000))::VARCHAR(6);
END;
$$;

-- Function: Create Game Session (Locks Quiz FOR NO KEY UPDATE, Validates Integrity, Sequence & Options)
CREATE OR REPLACE FUNCTION public.create_game_session(
  p_title TEXT,
  p_quiz_id UUID,
  p_category TEXT DEFAULT 'Bible Challenge',
  p_time_limit_seconds INT DEFAULT 20,
  p_is_public BOOLEAN DEFAULT true,
  p_allow_guests BOOLEAN DEFAULT true,
  p_participant_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_host_name TEXT;
  v_quiz RECORD;
  v_pin VARCHAR(6);
  v_session RECORD;
  v_clean_title TEXT;
  v_attempts INT := 0;
  v_q_count INT;
  v_validated_time INT;
  v_validated_limit INT;
BEGIN
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be signed in to create and host an Arena competition.';
  END IF;

  IF p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'A valid quiz ID is mandatory to create an Arena competition.';
  END IF;

  v_clean_title := TRIM(p_title);
  IF LENGTH(v_clean_title) < 3 THEN
    RAISE EXCEPTION 'Arena title must be at least 3 characters long.';
  END IF;

  v_validated_time := GREATEST(10, LEAST(COALESCE(p_time_limit_seconds, 20), 120));
  v_validated_limit := GREATEST(2, LEAST(COALESCE(p_participant_limit, 50), 200));

  -- 1. Lock Quiz row FOR NO KEY UPDATE: Serializes validation with concurrent quiz edits/deletions
  SELECT * INTO v_quiz FROM public.quizzes 
  WHERE id = p_quiz_id AND (is_public = true OR author_id = v_host_id)
  FOR NO KEY UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected quiz is private or does not exist.';
  END IF;

  -- 2. At least one question
  SELECT COUNT(*) INTO v_q_count FROM public.questions WHERE quiz_id = p_quiz_id;
  IF v_q_count = 0 THEN
    RAISE EXCEPTION 'Cannot start game: Selected quiz contains no questions.';
  END IF;

  -- 3. Check question ordering: strictly sequential starting from 0 without gaps or duplicates
  IF EXISTS (
    SELECT 1 
    FROM (
      SELECT question_order, (row_number() OVER (ORDER BY question_order)) - 1 as expected_order
      FROM public.questions
      WHERE quiz_id = p_quiz_id
    ) q_seq
    WHERE question_order <> expected_order
  ) THEN
    RAISE EXCEPTION 'Cannot start game: Quiz questions must be sequentially ordered starting from 0 without gaps or duplicates.';
  END IF;

  -- 4. Exactly four distinct options per question: indexes 0, 1, 2, 3
  IF EXISTS (
    SELECT q.id
    FROM public.questions q
    LEFT JOIN public.question_options qo ON q.id = qo.question_id
    WHERE q.quiz_id = p_quiz_id
    GROUP BY q.id
    HAVING COUNT(DISTINCT qo.option_index) <> 4
        OR array_agg(qo.option_index ORDER BY qo.option_index) <> ARRAY[0, 1, 2, 3]
  ) THEN
    RAISE EXCEPTION 'Cannot start game: Every question in the quiz must have all four distinct option indexes (0, 1, 2, 3).';
  END IF;

  -- 5. Exactly one valid answer key per question
  IF EXISTS (
    SELECT q.id
    FROM public.questions q
    LEFT JOIN public.answer_keys ak ON q.id = ak.question_id
    WHERE q.quiz_id = p_quiz_id
    GROUP BY q.id
    HAVING COUNT(ak.question_id) <> 1
  ) THEN
    RAISE EXCEPTION 'Cannot start game: Every question in the quiz must have exactly one correct answer key defined.';
  END IF;

  SELECT COALESCE(name, nickname, 'Host') INTO v_host_name FROM public.profiles WHERE id = v_host_id;
  IF v_host_name IS NULL THEN
    v_host_name := 'Arena Host';
  END IF;

  -- Retry loop handles rare race collisions on active PIN partial unique index
  LOOP
    v_attempts := v_attempts + 1;
    v_pin := public.generate_unique_game_pin();

    BEGIN
      INSERT INTO public.game_sessions (
        game_pin,
        title,
        quiz_id,
        host_id,
        host_name,
        category,
        time_limit_seconds,
        is_public,
        allow_guests,
        participant_limit,
        status,
        round_phase,
        current_question_index
      ) VALUES (
        v_pin,
        v_clean_title,
        p_quiz_id,
        v_host_id,
        v_host_name,
        p_category,
        v_validated_time,
        p_is_public,
        p_allow_guests,
        v_validated_limit,
        'lobby',
        'answering',
        0
      ) RETURNING * INTO v_session;

      EXIT; -- Insert succeeded
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempts >= 10 THEN
          RAISE EXCEPTION 'Failed to allocate unique Game PIN after multiple attempts.';
        END IF;
    END;
  END LOOP;

  -- Increment host arena count via security definer context
  UPDATE public.profiles
  SET hosted_arenas_count = COALESCE(hosted_arenas_count, 0) + 1
  WHERE id = v_host_id;

  RETURN jsonb_build_object(
    'id', v_session.id,
    'pin', v_session.game_pin,
    'title', v_session.title,
    'status', v_session.status,
    'host_name', v_session.host_name,
    'time_limit_seconds', v_session.time_limit_seconds,
    'is_public', v_session.is_public
  );
END;
$$;

-- Function: Join Game Session (Row-Locked Participant Limit, Anti-Duplicate User, Guest Rejoining & Mid-Game Check)
CREATE OR REPLACE FUNCTION public.join_game_session(
  p_game_pin VARCHAR(6),
  p_nickname TEXT,
  p_avatar TEXT DEFAULT '🕊️',
  p_guest_credential TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_clean_pin VARCHAR(6);
  v_session RECORD;
  v_user_id UUID := auth.uid();
  v_participant RECORD;
  v_existing_user RECORD;
  v_existing_guest RECORD;
  v_count INT;
  v_sanitized_nick TEXT;
  v_raw_guest_token TEXT := NULL;
  v_guest_token_hash TEXT := NULL;
BEGIN
  v_sanitized_nick := TRIM(p_nickname);
  IF LENGTH(v_sanitized_nick) < 2 OR LENGTH(v_sanitized_nick) > 25 THEN
    RAISE EXCEPTION 'Nickname must be between 2 and 25 characters long.';
  END IF;

  v_clean_pin := regexp_replace(TRIM(p_game_pin), '[^0-9]', '', 'g');
  IF LENGTH(v_clean_pin) <> 6 THEN
    RAISE EXCEPTION 'Invalid Game PIN format. Must be a 6-digit numeric code.';
  END IF;

  -- Lock session row to serialize concurrent joins and enforce exact participant limit
  SELECT * INTO v_session FROM public.game_sessions
  WHERE game_pin = v_clean_pin AND status IN ('lobby', 'active')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition session not found or has concluded.';
  END IF;

  -- GUEST REJOINING CHECK:
  -- If guest credential is provided, reconnect existing guest record
  IF v_user_id IS NULL AND p_guest_credential IS NOT NULL AND LENGTH(p_guest_credential) >= 10 THEN
    SELECT p.* INTO v_existing_guest
    FROM public.participants p
    JOIN public.participant_secrets ps ON p.id = ps.participant_id
    WHERE p.game_session_id = v_session.id 
      AND ps.guest_token_hash = encode(digest(p_guest_credential, 'sha256'), 'hex');

    IF FOUND THEN
      UPDATE public.participants 
      SET status = 'connected', updated_at = NOW() 
      WHERE id = v_existing_guest.id;

      RETURN jsonb_build_object(
        'participant_id', v_existing_guest.id,
        'session_id', v_session.id,
        'pin', v_session.game_pin,
        'title', v_session.title,
        'status', v_session.status,
        'round_phase', v_session.round_phase,
        'current_question_index', v_session.current_question_index,
        'guest_credential', NULL,
        'rejoined', true
      );
    END IF;
  END IF;

  -- REGISTERED USER REJOINING CHECK:
  IF v_user_id IS NOT NULL THEN
    SELECT * INTO v_existing_user FROM public.participants
    WHERE game_session_id = v_session.id AND user_id = v_user_id;

    IF FOUND THEN
      UPDATE public.participants 
      SET status = 'connected', updated_at = NOW() 
      WHERE id = v_existing_user.id;

      RETURN jsonb_build_object(
        'participant_id', v_existing_user.id,
        'session_id', v_session.id,
        'pin', v_session.game_pin,
        'title', v_session.title,
        'status', v_session.status,
        'round_phase', v_session.round_phase,
        'current_question_index', v_session.current_question_index,
        'guest_credential', NULL,
        'rejoined', true
      );
    END IF;
  END IF;

  -- MID-GAME JOIN RESTRICTION FOR NEW PARTICIPANTS:
  -- New participants can only join during the 'lobby' phase
  IF v_session.status <> 'lobby' THEN
    RAISE EXCEPTION 'Competition has already started. New participants cannot join an arena in progress.';
  END IF;

  -- Check guest permission
  IF v_user_id IS NULL AND NOT v_session.allow_guests THEN
    RAISE EXCEPTION 'This Arena competition does not allow guest participants. Please sign in to join.';
  END IF;

  -- Check room capacity
  SELECT COUNT(*) INTO v_count FROM public.participants WHERE game_session_id = v_session.id;
  IF v_count >= v_session.participant_limit THEN
    RAISE EXCEPTION 'This Arena competition has reached its player limit of % participants.', v_session.participant_limit;
  END IF;

  -- Check nickname collision within session (case-insensitive)
  SELECT * INTO v_participant FROM public.participants
  WHERE game_session_id = v_session.id AND LOWER(nickname) = LOWER(v_sanitized_nick);

  IF FOUND THEN
    RAISE EXCEPTION 'Nickname "%" is already taken in this room. Please choose another nickname.', v_sanitized_nick;
  END IF;

  -- Generate server-side cryptographic credential for guests
  IF v_user_id IS NULL THEN
    v_raw_guest_token := encode(gen_random_bytes(32), 'hex');
    v_guest_token_hash := encode(digest(v_raw_guest_token, 'sha256'), 'hex');
  END IF;

  INSERT INTO public.participants (
    game_session_id,
    user_id,
    nickname,
    avatar,
    score,
    streak,
    rank,
    position_delta,
    status
  ) VALUES (
    v_session.id,
    v_user_id,
    v_sanitized_nick,
    p_avatar,
    0,
    0,
    v_count + 1,
    0,
    'connected'
  ) RETURNING * INTO v_participant;

  -- Store credential hash in isolated vault table
  IF v_guest_token_hash IS NOT NULL THEN
    INSERT INTO public.participant_secrets (participant_id, guest_token_hash)
    VALUES (v_participant.id, v_guest_token_hash);
  END IF;

  -- Raw credential is returned ONCE to the guest client
  RETURN jsonb_build_object(
    'participant_id', v_participant.id,
    'session_id', v_session.id,
    'pin', v_session.game_pin,
    'title', v_session.title,
    'status', v_session.status,
    'round_phase', v_session.round_phase,
    'current_question_index', v_session.current_question_index,
    'guest_credential', v_raw_guest_token,
    'rejoined', false
  );
END;
$$;

-- Function: Submit Game Answer (Locks Session/Participant, Mandatory Timestamps, Anti-Replay)
CREATE OR REPLACE FUNCTION public.submit_game_answer(
  p_session_id UUID,
  p_participant_id UUID,
  p_question_id UUID,
  p_selected_option_index INT,
  p_guest_credential TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_participant RECORD;
  v_stored_hash TEXT;
  v_computed_hash TEXT;
  v_correct_idx INT;
  v_is_correct BOOLEAN := false;
  v_points INT := 0;
  v_base_points INT := 0;
  v_speed_bonus INT := 0;
  v_new_score INT;
  v_new_streak INT;
  v_new_correct INT;
  v_new_questions_answered INT;
  v_new_total_response_time INT;
  v_my_rank INT;
  v_total_seconds FLOAT;
  v_remaining_seconds FLOAT;
  v_response_time_ms INT := 0;
  v_elapsed_seconds FLOAT;
  v_question RECORD;
  v_opt_exists BOOLEAN;
BEGIN
  -- 1. Validate session with FOR SHARE lock to serialize with question advance/close
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id FOR SHARE;
  IF NOT FOUND OR v_session.status <> 'active' OR v_session.round_phase <> 'answering' THEN
    RAISE EXCEPTION 'Answering period is not currently active for this game.';
  END IF;

  -- 2. Mandatory round timestamps & server-side deadline verification
  IF v_session.round_started_at IS NULL OR v_session.round_deadline IS NULL THEN
    RAISE EXCEPTION 'Active round timing is uninitialized. Answers cannot be accepted without valid round timestamps.';
  END IF;

  IF CLOCK_TIMESTAMP() > (v_session.round_deadline + INTERVAL '1.5 seconds') THEN
    RAISE EXCEPTION 'The answering deadline has expired for this question.';
  END IF;

  -- 3. Verify question identity: must belong to selected quiz and match current question index
  SELECT * INTO v_question FROM public.questions 
  WHERE id = p_question_id 
    AND quiz_id = v_session.quiz_id 
    AND question_order = v_session.current_question_index;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submitted question does not match the active round question.';
  END IF;

  -- 4. Validate selected option index and ensure option exists
  IF p_selected_option_index NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'Invalid option index. Must be between 0 and 3.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.question_options 
    WHERE question_id = p_question_id AND option_index = p_selected_option_index
  ) INTO v_opt_exists;

  IF NOT v_opt_exists THEN
    RAISE EXCEPTION 'Selected option does not exist for this question.';
  END IF;

  -- 5. Participant identity verification & row locking to serialize concurrent answer attempts
  SELECT * INTO v_participant FROM public.participants
  WHERE id = p_participant_id AND game_session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found in this game session.';
  END IF;

  -- Registered User: Must be authenticated as the exact user
  IF v_participant.user_id IS NOT NULL THEN
    IF auth.uid() IS NULL OR auth.uid() <> v_participant.user_id THEN
      RAISE EXCEPTION 'Unauthorized: Caller identity does not match registered participant.';
    END IF;
  ELSE
    -- Guest User: Must provide valid raw credential matching stored SHA-256 hash
    IF p_guest_credential IS NULL OR LENGTH(p_guest_credential) < 10 THEN
      RAISE EXCEPTION 'Authentication required: Missing guest credential.';
    END IF;

    SELECT guest_token_hash INTO v_stored_hash
    FROM public.participant_secrets
    WHERE participant_id = p_participant_id;

    IF v_stored_hash IS NULL THEN
      RAISE EXCEPTION 'Guest credential record not found.';
    END IF;

    v_computed_hash := encode(digest(p_guest_credential, 'sha256'), 'hex');
    IF v_computed_hash <> v_stored_hash THEN
      RAISE EXCEPTION 'Unauthorized: Invalid guest credential.';
    END IF;
  END IF;

  -- 6. Duplicate answer prevention
  IF EXISTS (
    SELECT 1 FROM public.game_answers
    WHERE game_session_id = p_session_id
      AND participant_id = p_participant_id
      AND question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'Answer already submitted for this question.';
  END IF;

  -- 7. Calculate response timing entirely on server
  v_elapsed_seconds := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_session.round_started_at));
  v_total_seconds := COALESCE(v_question.time_limit_seconds, v_session.time_limit_seconds, 20)::FLOAT;
  v_remaining_seconds := GREATEST(0.0, LEAST(v_total_seconds, v_total_seconds - v_elapsed_seconds));
  v_response_time_ms := GREATEST(0, ROUND(v_elapsed_seconds * 1000)::INT);

  -- 8. Check protected answer key on server and compute scoring:
  -- Base score: 700 points.
  -- Speed bonus: Up to 300 additional points.
  -- Maximum score per correct answer: 1,000 points.
  -- Formula: score = 700 + floor(300 * remaining_time / total_time)
  -- Incorrect or timed-out answer: 0 points.
  SELECT correct_option_index INTO v_correct_idx
  FROM public.answer_keys
  WHERE question_id = p_question_id;

  IF v_correct_idx IS NOT NULL AND v_correct_idx = p_selected_option_index THEN
    v_is_correct := true;
    v_base_points := 700;
    v_speed_bonus := FLOOR(300.0 * (v_remaining_seconds / v_total_seconds))::INT;
    v_points := v_base_points + v_speed_bonus;
    v_new_streak := v_participant.streak + 1;
  ELSE
    v_is_correct := false;
    v_base_points := 0;
    v_speed_bonus := 0;
    v_points := 0;
    v_new_streak := 0;
  END IF;

  v_new_score := v_participant.score + v_points;
  v_new_correct := v_participant.correct_answers_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END);
  v_new_questions_answered := v_participant.questions_answered_count + 1;
  v_new_total_response_time := v_participant.total_response_time_ms + v_response_time_ms;

  -- 9. Record answer with granular base points, speed bonus and timing
  INSERT INTO public.game_answers (
    game_session_id,
    participant_id,
    question_id,
    selected_option_index,
    is_correct,
    points_awarded,
    base_points,
    speed_bonus,
    response_time_ms
  ) VALUES (
    p_session_id,
    p_participant_id,
    p_question_id,
    p_selected_option_index,
    v_is_correct,
    v_points,
    v_base_points,
    v_speed_bonus,
    v_response_time_ms
  );

  -- 10. Update participant record with accumulated totals
  UPDATE public.participants
  SET score = v_new_score,
      streak = v_new_streak,
      correct_answers_count = v_new_correct,
      questions_answered_count = v_new_questions_answered,
      total_response_time_ms = v_new_total_response_time,
      status = 'answered',
      updated_at = CLOCK_TIMESTAMP()
  WHERE id = p_participant_id;

  -- 11. Recalculate caller's current rank using deterministic tie-breaking without peer lock contention:
  -- Tie-breaking order:
  -- 1. Highest total points (score DESC)
  -- 2. Highest number of correct answers (correct_answers_count DESC)
  -- 3. Lowest cumulative response time (total_response_time_ms ASC)
  -- 4. Shared rank on equal scores
  SELECT count(*) + 1 INTO v_my_rank
  FROM public.participants
  WHERE game_session_id = p_session_id
    AND id <> p_participant_id
    AND (
      score > v_new_score
      OR (score = v_new_score AND correct_answers_count > v_new_correct)
      OR (score = v_new_score AND correct_answers_count = v_new_correct AND total_response_time_ms < v_new_total_response_time)
    );

  UPDATE public.participants
  SET rank = v_my_rank
  WHERE id = p_participant_id;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_awarded', v_points,
    'base_points', v_base_points,
    'speed_bonus', v_speed_bonus,
    'total_score', v_new_score,
    'streak', v_new_streak,
    'rank', v_my_rank,
    'correct_answers_count', v_new_correct,
    'questions_answered_count', v_new_questions_answered
  );
END;
$$;

-- Function: Host Advances Question (Locks Session, Enforces Strictly Sequential +1 & Phase Check)
CREATE OR REPLACE FUNCTION public.advance_game_question(
  p_session_id UUID,
  p_next_question_index INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_now TIMESTAMPTZ := CLOCK_TIMESTAMP();
  v_deadline TIMESTAMPTZ;
  v_target_q RECORD;
  v_round_seconds INT;
BEGIN
  IF p_next_question_index IS NULL OR p_next_question_index < 0 THEN
    RAISE EXCEPTION 'Question index must be a non-negative integer.';
  END IF;

  -- Lock session row to serialize question advances
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_session.host_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the verified room host can advance questions.';
  END IF;

  IF v_session.status NOT IN ('lobby', 'active') THEN
    RAISE EXCEPTION 'Cannot advance question in status "%".', v_session.status;
  END IF;

  -- State Transition & Sequence Verification
  IF v_session.status = 'lobby' THEN
    IF p_next_question_index <> 0 THEN
      RAISE EXCEPTION 'Initial question must start at index 0.';
    END IF;
  ELSE
    -- When active, host MUST close active round to leaderboard before advancing to next question
    IF v_session.round_phase <> 'leaderboard' THEN
      RAISE EXCEPTION 'Cannot advance question: You must close the active question to leaderboard phase before advancing.';
    END IF;

    -- Active session must advance strictly sequentially (+1)
    IF p_next_question_index <> (v_session.current_question_index + 1) THEN
      RAISE EXCEPTION 'Question advancement must be strictly sequential (expected %, got %).', 
        (v_session.current_question_index + 1), p_next_question_index;
    END IF;
  END IF;

  -- Verify target question exists for this session's quiz
  SELECT * INTO v_target_q FROM public.questions 
  WHERE quiz_id = v_session.quiz_id AND question_order = p_next_question_index;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot advance: Question order % does not exist in this quiz.', p_next_question_index;
  END IF;

  v_round_seconds := GREATEST(5, LEAST(COALESCE(v_target_q.time_limit_seconds, v_session.time_limit_seconds, 20), 120));
  v_deadline := v_now + (v_round_seconds || ' seconds')::INTERVAL;

  UPDATE public.game_sessions
  SET current_question_index = p_next_question_index,
      status = 'active',
      round_phase = 'answering',
      round_started_at = v_now,
      round_deadline = v_deadline,
      time_limit_seconds = v_round_seconds,
      updated_at = v_now
  WHERE id = p_session_id;

  UPDATE public.participants
  SET status = 'connected',
      updated_at = v_now
  WHERE game_session_id = p_session_id;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'question_index', p_next_question_index,
    'round_phase', 'answering',
    'round_deadline', v_deadline,
    'time_limit_seconds', v_round_seconds
  );
END;
$$;

-- Function: Host Closes Question (Locks Session, Prevents Repeated Closing)
CREATE OR REPLACE FUNCTION public.close_current_question(
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  r RECORD;
  v_new_rank INT := 0;
BEGIN
  -- Lock session row to prevent race conditions
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_session.host_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the verified room host can close questions.';
  END IF;

  IF v_session.status <> 'active' OR v_session.round_phase <> 'answering' THEN
    RAISE EXCEPTION 'Cannot close question: session is not in answering phase (current phase is "%").', v_session.round_phase;
  END IF;

  UPDATE public.game_sessions
  SET round_phase = 'leaderboard',
      updated_at = CLOCK_TIMESTAMP()
  WHERE id = p_session_id;

  -- Tie-breaking order:
  -- 1. Highest total points (score DESC)
  -- 2. Highest number of correct answers (correct_answers_count DESC)
  -- 3. Lowest cumulative response time (total_response_time_ms ASC)
  -- 4. Shared rank on equal scores
  FOR r IN (
    SELECT id, rank as old_rank,
           RANK() OVER (
             ORDER BY score DESC, correct_answers_count DESC, total_response_time_ms ASC
           ) as new_rank
    FROM public.participants
    WHERE game_session_id = p_session_id
  ) LOOP
    UPDATE public.participants
    SET position_delta = COALESCE(r.old_rank, r.new_rank) - r.new_rank,
        rank = r.new_rank,
        updated_at = CLOCK_TIMESTAMP()
    WHERE id = r.id;
  END LOOP;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'round_phase', 'leaderboard'
  );
END;
$$;

-- Function: Host Ends Game Session (Strictly Idempotent; Awards Lifetime Stats Once)
CREATE OR REPLACE FUNCTION public.end_game_session(
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  p RECORD;
BEGIN
  -- Atomic state transition: Only updates if session is currently active or lobby
  UPDATE public.game_sessions
  SET status = 'results',
      round_phase = 'podium',
      updated_at = CLOCK_TIMESTAMP()
  WHERE id = p_session_id 
    AND status IN ('lobby', 'active')
    AND host_id = auth.uid()
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    -- Check if session already completed (idempotent caller)
    IF EXISTS (
      SELECT 1 FROM public.game_sessions 
      WHERE id = p_session_id AND status IN ('results', 'completed') AND host_id = auth.uid()
    ) THEN
      RETURN jsonb_build_object(
        'session_id', p_session_id,
        'status', 'results',
        'round_phase', 'podium',
        'already_ended', true
      );
    ELSE
      RAISE EXCEPTION 'Session not found or caller is unauthorized.';
    END IF;
  END IF;

  -- Finalize rankings with official tie-breaking rules
  WITH ranked AS (
    SELECT id,
           RANK() OVER (
             ORDER BY score DESC, correct_answers_count DESC, total_response_time_ms ASC
           ) as computed_rank
    FROM public.participants
    WHERE game_session_id = p_session_id
  )
  UPDATE public.participants p
  SET rank = r.computed_rank,
      updated_at = CLOCK_TIMESTAMP()
  FROM ranked r
  WHERE p.id = r.id;

  -- Award registered participants' lifetime stats strictly once
  FOR p IN (
    SELECT user_id, score, correct_answers_count, questions_answered_count
    FROM public.participants
    WHERE game_session_id = p_session_id AND user_id IS NOT NULL
  ) LOOP
    UPDATE public.profiles
    SET total_points = COALESCE(total_points, 0) + p.score,
        quizzes_completed = COALESCE(quizzes_completed, 0) + 1,
        accuracy = CASE 
          WHEN (COALESCE(quizzes_completed, 0) + 1) > 0 AND p.questions_answered_count > 0 
          THEN ROUND((p.correct_answers_count::NUMERIC / p.questions_answered_count::NUMERIC) * 100, 2)
          ELSE accuracy 
        END,
        updated_at = CLOCK_TIMESTAMP()
    WHERE id = p.user_id;
  END LOOP;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'status', 'results',
    'round_phase', 'podium'
  );
END;
$$;

-- Function: Safe PIN Resolver (Exposes ONLY sanitized metadata; protects host & quiz metadata)
CREATE OR REPLACE FUNCTION public.get_game_session_by_pin(
  p_pin VARCHAR(6)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_clean_pin VARCHAR(6);
  v_session RECORD;
BEGIN
  v_clean_pin := regexp_replace(TRIM(p_pin), '[^0-9]', '', 'g');
  IF LENGTH(v_clean_pin) <> 6 THEN
    RETURN NULL;
  END IF;

  SELECT 
    game_pin, 
    title, 
    category, 
    status, 
    allow_guests, 
    is_public
  INTO v_session
  FROM public.game_sessions
  WHERE game_pin = v_clean_pin AND status IN ('lobby', 'active');

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_session);
END;
$$;

-- Function: Safe Question Resolver (Exposes question WITHOUT answer key; validates caller authorization)
CREATE OR REPLACE FUNCTION public.get_active_game_question(
  p_session_id UUID,
  p_participant_id UUID DEFAULT NULL,
  p_guest_credential TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_question RECORD;
  v_options JSONB;
  v_guest_hash TEXT;
BEGIN
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Caller Authorization: Public sessions accessible; private sessions require host or member credentials
  IF NOT v_session.is_public THEN
    IF auth.uid() IS NOT NULL THEN
      IF auth.uid() <> v_session.host_id AND NOT public.is_session_member(p_session_id) THEN
        RAISE EXCEPTION 'Unauthorized: Private room access requires participant membership or host privileges.';
      END IF;
    ELSE
      IF p_participant_id IS NULL OR p_guest_credential IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Private room access requires valid guest credentials.';
      END IF;

      SELECT guest_token_hash INTO v_guest_hash
      FROM public.participant_secrets ps
      JOIN public.participants p ON ps.participant_id = p.id
      WHERE ps.participant_id = p_participant_id AND p.game_session_id = p_session_id;

      IF v_guest_hash IS NULL OR encode(digest(p_guest_credential, 'sha256'), 'hex') <> v_guest_hash THEN
        RAISE EXCEPTION 'Unauthorized: Invalid guest credential for private room.';
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_question FROM public.questions
  WHERE quiz_id = v_session.quiz_id AND question_order = v_session.current_question_index;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object('option_index', option_index, 'option_text', option_text)
    ORDER BY option_index ASC
  ) INTO v_options
  FROM public.question_options
  WHERE question_id = v_question.id;

  RETURN jsonb_build_object(
    'id', v_question.id,
    'question_order', v_question.question_order,
    'text', v_question.text,
    'scripture_reference', v_question.scripture_reference,
    'explanation', CASE WHEN v_session.round_phase IN ('leaderboard', 'podium') THEN v_question.explanation ELSE NULL END,
    'time_limit_seconds', v_question.time_limit_seconds,
    'options', v_options
  );
END;
$$;

-- Function: Safe Session Leaderboard Resolver (Exposes scores; validates caller authorization for private rooms)
CREATE OR REPLACE FUNCTION public.get_session_leaderboard(
  p_session_id UUID,
  p_participant_id UUID DEFAULT NULL,
  p_guest_credential TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_list JSONB;
  v_guest_hash TEXT;
BEGIN
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Caller Authorization: Private sessions require host or member credentials
  IF NOT v_session.is_public THEN
    IF auth.uid() IS NOT NULL THEN
      IF auth.uid() <> v_session.host_id AND NOT public.is_session_member(p_session_id) THEN
        RAISE EXCEPTION 'Unauthorized: Private room access requires participant membership or host privileges.';
      END IF;
    ELSE
      IF p_participant_id IS NULL OR p_guest_credential IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Private room access requires valid guest credentials.';
      END IF;

      SELECT guest_token_hash INTO v_guest_hash
      FROM public.participant_secrets ps
      JOIN public.participants p ON ps.participant_id = p.id
      WHERE ps.participant_id = p_participant_id AND p.game_session_id = p_session_id;

      IF v_guest_hash IS NULL OR encode(digest(p_guest_credential, 'sha256'), 'hex') <> v_guest_hash THEN
        RAISE EXCEPTION 'Unauthorized: Invalid guest credential for private room.';
      END IF;
    END IF;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nickname', nickname,
      'avatar', avatar,
      'score', score,
      'streak', streak,
      'rank', rank,
      'position_delta', position_delta,
      'status', status,
      'correct_answers_count', correct_answers_count,
      'questions_answered_count', questions_answered_count,
      'total_response_time_ms', total_response_time_ms
    )
    ORDER BY rank ASC, score DESC, correct_answers_count DESC, total_response_time_ms ASC, joined_at ASC, id ASC
  ) INTO v_list
  FROM (
    SELECT 
      id,
      nickname,
      avatar,
      score,
      streak,
      RANK() OVER (
        ORDER BY score DESC, correct_answers_count DESC, total_response_time_ms ASC
      ) as rank,
      position_delta,
      status,
      correct_answers_count,
      questions_answered_count,
      total_response_time_ms,
      joined_at
    FROM public.participants
    WHERE game_session_id = p_session_id
  ) p;

  RETURN COALESCE(v_list, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- 11. LEAST-PRIVILEGE FUNCTION PERMISSIONS & EXPLICIT REVOCATIONS
-- ============================================================================

-- Schema Defense: Prevent non-superusers from creating objects or spoofing functions in public schema
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;

-- Internal helpers & triggers (No public execution)
REVOKE ALL ON FUNCTION public.generate_unique_game_pin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_active_quiz_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;

-- Helper predicates
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

REVOKE ALL ON FUNCTION public.is_session_member(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_member(UUID) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.is_session_host_or_public(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_host_or_public(UUID) TO authenticated, anon;

-- Host-Only RPCs: Explicitly revoke anon execution before granting authenticated
REVOKE ALL ON FUNCTION public.create_game_session(TEXT, UUID, TEXT, INT, BOOLEAN, BOOLEAN, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_game_session(TEXT, UUID, TEXT, INT, BOOLEAN, BOOLEAN, INT) TO authenticated;

REVOKE ALL ON FUNCTION public.advance_game_question(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_game_question(UUID, INT) TO authenticated;

REVOKE ALL ON FUNCTION public.close_current_question(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_current_question(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.end_game_session(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_game_session(UUID) TO authenticated;

-- Player / Participant RPCs
REVOKE ALL ON FUNCTION public.join_game_session(VARCHAR(6), TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_game_session(VARCHAR(6), TEXT, TEXT, TEXT) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.submit_game_answer(UUID, UUID, UUID, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_game_answer(UUID, UUID, UUID, INT, TEXT) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_game_session_by_pin(VARCHAR(6)) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_game_session_by_pin(VARCHAR(6)) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_active_game_question(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_game_question(UUID, UUID, TEXT) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_session_leaderboard(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_leaderboard(UUID, UUID, TEXT) TO authenticated, anon;

-- TABLE-LEVEL & COLUMN-LEVEL DIRECT WRITE RESTRICTIONS

-- 1. Profiles: Explicit table-level revocation clears legacy grants; column-level grant isolates updates
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL (id, name, nickname, email, avatar, role, group_affiliation, total_points, quizzes_completed, accuracy, streak_days, hosted_arenas_count, created_at, updated_at) ON public.profiles FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT (id, name, nickname, email, avatar, group_affiliation, created_at, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (name, nickname, email, avatar, group_affiliation, updated_at) ON public.profiles TO authenticated;

-- 2. Public Profiles View
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Game Sessions: Direct client writes strictly revoked; mutations proceed via RPCs
REVOKE ALL ON public.game_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.game_sessions TO anon, authenticated;

-- 4. Participants: Direct client writes strictly revoked; mutations proceed via join_game_session
REVOKE ALL ON public.participants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.participants TO anon, authenticated;

-- 5. Participant Secrets: Vault table completely isolated from client access
REVOKE ALL ON public.participant_secrets FROM PUBLIC, anon, authenticated;

-- 6. Game Answers: Direct client writes strictly revoked; mutations proceed via submit_game_answer
REVOKE ALL ON public.game_answers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.game_answers TO anon, authenticated;

-- 7. Content Authoring: Quizzes, Questions, Options, Answer Keys
REVOKE ALL ON public.quizzes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.quizzes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;

REVOKE ALL ON public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;

REVOKE ALL ON public.question_options FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.question_options TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.question_options TO authenticated;

REVOKE ALL ON public.answer_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answer_keys TO authenticated;

-- ============================================================================
-- 12. REALTIME REPLICATION PUBLICATION
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;
