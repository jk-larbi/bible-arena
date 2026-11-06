-- ============================================================================
-- BIBLEARENA — MIGRATION: 20261106060000_character_learning_and_notifications.sql
-- Character Learning Profiles, 20 Biblical Qualities, Mastery Tracking & User Notification Preferences
-- NOTE: Local schema file only for review. DO NOT EXECUTE REMOTELY per instructions.
-- ============================================================================

-- 1. BIBLE CHARACTERS CANONICAL REPOSITORY
CREATE TABLE IF NOT EXISTS public.bible_characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('Old', 'New')),
  role TEXT NOT NULL,
  era TEXT NOT NULL,
  background TEXT NOT NULL,
  family_relationships TEXT NOT NULL,
  major_accomplishments JSONB NOT NULL DEFAULT '[]'::jsonb,
  important_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  positive_qualities JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses_or_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  growth_and_development TEXT NOT NULL,
  life_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_scripture_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  famous_quote JSONB,
  sample_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 20 BIBLICAL QUALITIES CANONICAL REPOSITORY
CREATE TABLE IF NOT EXISTS public.bible_qualities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  scriptural_foundations JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_exemplars JSONB NOT NULL DEFAULT '[]'::jsonb,
  practical_life_application TEXT NOT NULL,
  reflection_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CHARACTER MASTERY & PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS public.character_mastery_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES public.bible_characters(id) ON DELETE CASCADE,
  times_studied INT NOT NULL DEFAULT 0,
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN questions_attempted > 0 
      THEN ROUND((questions_correct::numeric / questions_attempted::numeric) * 100, 2)
      ELSE 0
    END
  ) STORED,
  mastery_level TEXT NOT NULL DEFAULT 'Beginner' CHECK (mastery_level IN ('Beginner', 'Familiar', 'Proficient', 'Master')),
  last_studied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, character_id)
);

-- 4. USER NOTIFICATION PREFERENCES (5-Hour Interval, Quiet Hours, Anti-Spam)
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  interval_hours INT NOT NULL DEFAULT 5 CHECK (interval_hours BETWEEN 1 AND 24),
  quiet_hours_start TIME NOT NULL DEFAULT '22:00:00',
  quiet_hours_end TIME NOT NULL DEFAULT '08:00:00',
  permission_status TEXT NOT NULL DEFAULT 'default' CHECK (permission_status IN ('granted', 'denied', 'default', 'unsupported')),
  last_reminder_sent_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  has_shown_registration_prompt BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bible_characters_testament ON public.bible_characters(testament);
CREATE INDEX IF NOT EXISTS idx_char_mastery_user ON public.character_mastery_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_char_mastery_char ON public.character_mastery_progress(character_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_enabled ON public.user_notification_preferences(enabled);

-- Row Level Security (RLS)
ALTER TABLE public.bible_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_qualities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_mastery_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Read policies for public reference data
CREATE POLICY "Public read for bible_characters"
  ON public.bible_characters FOR SELECT
  USING (true);

CREATE POLICY "Public read for bible_qualities"
  ON public.bible_qualities FOR SELECT
  USING (true);

-- User-scoped policies for mastery progress
CREATE POLICY "Users can manage own character mastery"
  ON public.character_mastery_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User-scoped policies for notification preferences
CREATE POLICY "Users can manage own notification preferences"
  ON public.user_notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
