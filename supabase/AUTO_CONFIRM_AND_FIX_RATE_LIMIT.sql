-- ==============================================================================
-- BibleArena — Auto-Confirm Users & Resolve Email Rate Limit Script
-- ==============================================================================
-- Run this in the Supabase Dashboard -> SQL Editor (New Query)
-- Project: https://supabase.com/dashboard/project/omevbndidzgmnweypjyl/sql

-- 1. Instantly confirm all existing accounts that were stuck due to email rate limit
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Optional Postgres trigger to auto-confirm any new registrations at the database level
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_users();

-- ==============================================================================
-- IMPORTANT DASHBOARD STEP:
-- In addition to this script, go to:
-- https://supabase.com/dashboard/project/omevbndidzgmnweypjyl/auth/providers
-- 1. Click "Email"
-- 2. Toggle "Confirm email" to OFF
-- 3. Click "Save"
-- This stops GoTrue from attempting to send emails through the rate-limited free mailer.
-- ==============================================================================
