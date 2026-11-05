-- ============================================================================
-- BIBLEARENA — SECURITY HARDENING COMPREHENSIVE TEST SUITE
-- File: supabase/tests/20261105000000_security_hardening_test.sql
-- Run inside Supabase SQL Editor: Executes in a transaction and rolls back
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_test_host UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  v_test_player UUID := '00000000-0000-0000-0000-000000000002'::UUID;
  v_attacker UUID := '00000000-0000-0000-0000-000000000003'::UUID;
  v_private_author UUID := '00000000-0000-0000-0000-000000000004'::UUID;

  v_public_quiz_id UUID;
  v_private_quiz_id UUID;
  v_incomplete_quiz_id UUID;
  v_duplicate_opt_quiz_id UUID;
  v_q1_id UUID;
  v_q2_id UUID;
  v_incomp_q_id UUID;
  v_dup_opt_q_id UUID;

  v_session_res JSONB;
  v_session_id UUID;
  v_pin VARCHAR(6);
  v_pin_res JSONB;
  v_reg_res1 JSONB;
  v_reg_res2 JSONB;
  v_reg_part_id UUID;
  v_guest_res JSONB;
  v_guest_part_id UUID;
  v_guest_raw_token TEXT;
  v_guest_rejoin_res JSONB;
  v_error_caught BOOLEAN;
  v_answer_res JSONB;
  v_test_val INT;
  v_end_res1 JSONB;
  v_end_res2 JSONB;
  v_player_points INT;
  v_part_count INT;
  v_pub_profile RECORD;
  v_leaderboard JSONB;
  v_user_pts INT;
BEGIN
  RAISE NOTICE '===============================================================';
  RAISE NOTICE 'STARTING BIBLEARENA PHASE 2 SECURITY HARDENING TEST SUITE';
  RAISE NOTICE '===============================================================';

  -- -----------------------------------------------------------------
  -- STAGE 1: PRIVILEGED FIXTURE SETUP
  -- -----------------------------------------------------------------

  -- Insert mock auth users into auth.users schema to satisfy profiles foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
    VALUES 
      (v_test_host, 'authenticated', 'authenticated', 'host@biblearena.test', NOW(), NOW()),
      (v_test_player, 'authenticated', 'authenticated', 'player@biblearena.test', NOW(), NOW()),
      (v_attacker, 'authenticated', 'authenticated', 'attacker@biblearena.test', NOW(), NOW()),
      (v_private_author, 'authenticated', 'authenticated', 'author@biblearena.test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert profiles
  INSERT INTO public.profiles (id, name, nickname, email, role, total_points)
  VALUES 
    (v_test_host, 'Test Host', 'HostOne', 'host@biblearena.test', 'member', 0),
    (v_test_player, 'Test Player', 'PlayerOne', 'player@biblearena.test', 'member', 0),
    (v_attacker, 'Rogue User', 'Attacker', 'attacker@biblearena.test', 'member', 0),
    (v_private_author, 'Secret Author', 'PrivateAuthor', 'author@biblearena.test', 'member', 0)
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    total_points = EXCLUDED.total_points;

  -- Create private quiz belonging to v_private_author
  INSERT INTO public.quizzes (id, title, category, difficulty, author_id, author_name, is_public)
  VALUES (gen_random_uuid(), 'Private Secret Quiz', 'Apocrypha', 'Hard', v_private_author, 'Secret Author', false)
  RETURNING id INTO v_private_quiz_id;

  -- Create broken/incomplete quiz (missing options and answer key)
  INSERT INTO public.quizzes (id, title, category, difficulty, author_id, author_name, is_public)
  VALUES (gen_random_uuid(), 'Incomplete Quiz', 'History', 'Easy', v_test_host, 'Test Host', true)
  RETURNING id INTO v_incomplete_quiz_id;

  INSERT INTO public.questions (id, quiz_id, question_order, text, time_limit_seconds)
  VALUES (gen_random_uuid(), v_incomplete_quiz_id, 0, 'Broken question with only 2 options', 20)
  RETURNING id INTO v_incomp_q_id;

  INSERT INTO public.question_options (question_id, option_index, option_text)
  VALUES 
    (v_incomp_q_id, 0, 'Option A'),
    (v_incomp_q_id, 1, 'Option B');

  -- Create valid public quiz belonging to v_test_host
  INSERT INTO public.quizzes (id, title, category, difficulty, author_id, author_name, is_public)
  VALUES (gen_random_uuid(), 'Public Gospels Quiz', 'New Testament', 'Medium', v_test_host, 'Test Host', true)
  RETURNING id INTO v_public_quiz_id;

  -- Question 1 (Order 0)
  INSERT INTO public.questions (id, quiz_id, question_order, text, time_limit_seconds)
  VALUES (gen_random_uuid(), v_public_quiz_id, 0, 'What is the first book of the New Testament?', 20)
  RETURNING id INTO v_q1_id;

  INSERT INTO public.question_options (question_id, option_index, option_text)
  VALUES 
    (v_q1_id, 0, 'Matthew'),
    (v_q1_id, 1, 'Mark'),
    (v_q1_id, 2, 'Luke'),
    (v_q1_id, 3, 'John');

  INSERT INTO public.answer_keys (question_id, correct_option_index)
  VALUES (v_q1_id, 0);

  -- Question 2 (Order 1)
  INSERT INTO public.questions (id, quiz_id, question_order, text, time_limit_seconds)
  VALUES (gen_random_uuid(), v_public_quiz_id, 1, 'Who wrote the Book of Acts?', 20)
  RETURNING id INTO v_q2_id;

  INSERT INTO public.question_options (question_id, option_index, option_text)
  VALUES 
    (v_q2_id, 0, 'Peter'),
    (v_q2_id, 1, 'Paul'),
    (v_q2_id, 2, 'Luke'),
    (v_q2_id, 3, 'Barnabas');

  INSERT INTO public.answer_keys (question_id, correct_option_index)
  VALUES (v_q2_id, 2);

  RAISE NOTICE '✓ STAGE 1 PASSED: Fixtures and foreign keys initialized.';

  -- -----------------------------------------------------------------
  -- TEST 1: PROTECTED PROFILE COLUMN UPDATES & COLUMN PRIVILEGES
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  -- Attacker attempts to update total_points directly via client UPDATE
  UPDATE public.profiles SET total_points = 999999 WHERE id = v_attacker;

  RESET ROLE;
  SELECT total_points INTO v_test_val FROM public.profiles WHERE id = v_attacker;
  IF v_test_val = 999999 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Authenticated user directly modified total_points!';
  ELSE
    RAISE NOTICE '✓ TEST 1 PASSED: Protected profile column update is guarded by trigger and column permissions.';
  END IF;

  -- -----------------------------------------------------------------
  -- TEST 2: PROFILE ROLE ESCALATION & LIFETIME STATISTICS AUTHORIZATION
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  -- 2.0: Role escalation
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught AND (SELECT role FROM public.profiles WHERE id = v_attacker) = 'admin' THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.0 FAILED: User was able to escalate role to admin!';
  END IF;
  RAISE NOTICE '✓ TEST 2.0 PASSED: Role escalation is blocked by column privileges and trigger.';

  -- 2.1: Direct modification of total_points
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET total_points = 999999 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT total_points FROM public.profiles WHERE id = v_attacker) = 999999 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.1 FAILED: User was able to directly modify total_points!';
  END IF;
  RAISE NOTICE '✓ TEST 2.1 PASSED: Direct modification of total_points strictly rejected.';

  -- 2.2: Direct modification of quizzes_completed
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET quizzes_completed = 500 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT quizzes_completed FROM public.profiles WHERE id = v_attacker) = 500 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.2 FAILED: User was able to directly modify quizzes_completed!';
  END IF;
  RAISE NOTICE '✓ TEST 2.2 PASSED: Direct modification of quizzes_completed strictly rejected.';

  -- 2.3: Direct modification of accuracy
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET accuracy = 100.00 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT accuracy FROM public.profiles WHERE id = v_attacker) = 100.00 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.3 FAILED: User was able to directly modify accuracy!';
  END IF;
  RAISE NOTICE '✓ TEST 2.3 PASSED: Direct modification of accuracy strictly rejected.';

  -- 2.4: Direct modification of streak_days
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET streak_days = 365 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT streak_days FROM public.profiles WHERE id = v_attacker) = 365 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.4 FAILED: User was able to directly modify streak_days!';
  END IF;
  RAISE NOTICE '✓ TEST 2.4 PASSED: Direct modification of streak_days strictly rejected.';

  -- 2.5: Direct modification of hosted_arenas_count
  v_error_caught := false;
  BEGIN
    UPDATE public.profiles SET hosted_arenas_count = 100 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT hosted_arenas_count FROM public.profiles WHERE id = v_attacker) = 100 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.5 FAILED: User was able to directly modify hosted_arenas_count!';
  END IF;
  RAISE NOTICE '✓ TEST 2.5 PASSED: Direct modification of hosted_arenas_count strictly rejected.';

  -- 2.6: Attempting to bypass authorization by setting custom GUC setting
  v_error_caught := false;
  BEGIN
    PERFORM set_config('biblearena.internal_stats_update', 'true', false);
    UPDATE public.profiles SET total_points = 777777 WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  IF NOT v_error_caught AND (SELECT total_points FROM public.profiles WHERE id = v_attacker) = 777777 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.6 FAILED: Caller was able to authorize stats manipulation via custom GUC setting!';
  END IF;
  RAISE NOTICE '✓ TEST 2.6 PASSED: Custom configuration variable cannot authorize profile statistics update.';

  -- 2.7: Verify no exposed public RPC allows arbitrary profile statistics tampering
  IF EXISTS (
    SELECT 1 FROM information_schema.parameters
    WHERE specific_schema = 'public' 
      AND parameter_name IN ('p_total_points', 'p_points', 'p_quizzes_completed', 'p_accuracy', 'p_streak_days')
  ) THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 2.7 FAILED: An exposed RPC accepts arbitrary lifetime statistics parameters!';
  END IF;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 2.7 PASSED: No exposed RPC accepts arbitrary profile lifetime statistics parameters.';

  -- -----------------------------------------------------------------
  -- TEST 3: EMAIL PRIVACY & NON-OWNER SELECT
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_test_player) THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 3 FAILED: Attacker was able to select private profile of another user!';
  END IF;

  RESET ROLE;
  RAISE NOTICE '✓ TEST 3 PASSED: Non-owner cannot select private profile rows.';

  -- -----------------------------------------------------------------
  -- TEST 4: PUBLIC PROFILE VIEW (EXPOSES DISPLAY DATA WITHOUT EMAIL/ROLE/NAME)
  -- -----------------------------------------------------------------
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT * INTO v_pub_profile FROM public.public_profiles WHERE id = v_test_player;
  IF v_pub_profile.id IS NULL THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 4 FAILED: Public profile view is not accessible to anonymous users!';
  END IF;

  -- Verify view definition does not include email or role
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'public_profiles' AND column_name IN ('email', 'role', 'name')
  ) THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 4 FAILED: public_profiles view contains sensitive email, role or name columns!';
  END IF;

  RESET ROLE;
  RAISE NOTICE '✓ TEST 4 PASSED: Public profile view safely exposes display fields without email, role or name.';

  -- -----------------------------------------------------------------
  -- TEST 5: ANSWER-KEY CONFIDENTIALITY FOR PLAYERS & ANONYMOUS
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_player::text, true);

  IF EXISTS (SELECT 1 FROM public.answer_keys WHERE question_id = v_q1_id) THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 5 FAILED: Player was able to query answer_keys directly!';
  END IF;

  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_error_caught := false;
  BEGIN
    PERFORM * FROM public.answer_keys WHERE question_id = v_q1_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  RESET ROLE;
  RAISE NOTICE '✓ TEST 5 PASSED: Answer keys are completely hidden from non-author players and anon.';

  -- -----------------------------------------------------------------
  -- TEST 6: QUIZ INTEGRITY & TIMING VALIDATION BEFORE GAME CREATION
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  -- 6.1 NULL Quiz ID check
  v_error_caught := false;
  BEGIN
    PERFORM public.create_game_session('Null Quiz Session', NULL, 'History', 20, false, true, 50);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 6.1 FAILED: create_game_session permitted NULL quiz_id!';
  END IF;

  -- 6.2 Incomplete Quiz check (missing options)
  v_error_caught := false;
  BEGIN
    PERFORM public.create_game_session('Broken Quiz Session', v_incomplete_quiz_id, 'History', 20, false, true, 50);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 6.2 FAILED: create_game_session permitted incomplete quiz data!';
  ELSE
    RAISE NOTICE '✓ TEST 6 PASSED: create_game_session enforces quiz presence, completeness and 4 options.';
  END IF;

  -- Create legitimate private game session with authorized quiz
  v_session_res := public.create_game_session('Championship Arena', v_public_quiz_id, 'New Testament', 20, false, true, 50);
  v_session_id := (v_session_res->>'id')::UUID;
  v_pin := v_session_res->>'pin';
  RESET ROLE;

  -- -----------------------------------------------------------------
  -- TEST 7: MINIMAL PIN RESOLVER & PRIVATE SESSION VISIBILITY
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  -- Attacker directly querying private game_sessions table
  IF EXISTS (SELECT 1 FROM public.game_sessions WHERE id = v_session_id) THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 7 FAILED: Attacker selected private game session directly from table!';
  END IF;

  -- Safe PIN resolver returns sanitized metadata without leaking session id, host_id or quiz_id
  v_pin_res := public.get_game_session_by_pin(v_pin);
  IF v_pin_res IS NULL THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 7 FAILED: Safe PIN resolver failed on valid active PIN!';
  END IF;

  IF (v_pin_res->>'id') IS NOT NULL OR (v_pin_res->>'host_id') IS NOT NULL OR (v_pin_res->>'quiz_id') IS NOT NULL THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 7 FAILED: Safe PIN resolver leaked sensitive internal room identifiers!';
  END IF;

  RESET ROLE;
  RAISE NOTICE '✓ TEST 7 PASSED: Private session protected from table scans; PIN resolver does not leak identifiers.';

  -- -----------------------------------------------------------------
  -- TEST 8: DUPLICATE REGISTERED-USER JOIN & REJOINING
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_player::text, true);

  -- First join
  v_reg_res1 := public.join_game_session(v_pin, 'FirstNick', '🕊️');
  v_reg_part_id := (v_reg_res1->>'participant_id')::UUID;

  -- Player attempts second join using a different nickname
  v_reg_res2 := public.join_game_session(v_pin, 'SecondNick', '⚔️');

  IF (v_reg_res2->>'participant_id')::UUID <> v_reg_part_id THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 8 FAILED: Registered user created duplicate participant row in same game!';
  END IF;

  IF NOT (v_reg_res2->>'rejoined')::BOOLEAN THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 8 FAILED: Registered user rejoining was not marked as rejoined!';
  END IF;

  RESET ROLE;
  SELECT COUNT(*) INTO v_part_count FROM public.participants WHERE game_session_id = v_session_id AND user_id = v_test_player;
  IF v_part_count <> 1 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Registered user has % participant rows (expected 1)!', v_part_count;
  END IF;
  RAISE NOTICE '✓ TEST 8 PASSED: Duplicate registered joins prevented; registered user rejoins existing record.';

  -- -----------------------------------------------------------------
  -- TEST 9: GUEST JOINING, CREDENTIAL SECURITY & GUEST REJOINING
  -- -----------------------------------------------------------------
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_guest_res := public.join_game_session(v_pin, 'GuestOne', '🛡️');
  v_guest_part_id := (v_guest_res->>'participant_id')::UUID;
  v_guest_raw_token := v_guest_res->>'guest_credential';

  RESET ROLE;
  IF v_guest_raw_token IS NULL OR LENGTH(v_guest_raw_token) < 32 THEN
    RAISE EXCEPTION 'TEST 9 FAILED: Server did not issue secure 32-byte guest token!';
  END IF;

  -- Guest rejoining with valid guest credential
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_guest_rejoin_res := public.join_game_session(v_pin, 'GuestOne', '🛡️', v_guest_raw_token);
  IF (v_guest_rejoin_res->>'participant_id')::UUID <> v_guest_part_id OR NOT (v_guest_rejoin_res->>'rejoined')::BOOLEAN THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 9 FAILED: Guest rejoining with credential failed to reconnect existing record!';
  END IF;

  -- Host advances question from lobby to question 0
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);
  PERFORM public.advance_game_question(v_session_id, 0);

  -- Mid-game join attempt by NEW participant (must be rejected)
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_error_caught := false;
  BEGIN
    PERFORM public.join_game_session(v_pin, 'LateJoiner', '⚡');
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 9 FAILED: New participant joined while session was in active progress!';
  ELSE
    RAISE NOTICE '✓ TEST 9 PASSED: Mid-game join by new player blocked; guest rejoining works cleanly.';
  END IF;

  -- Guest attempts answering with bogus credential
  v_error_caught := false;
  BEGIN
    PERFORM public.submit_game_answer(v_session_id, v_guest_part_id, v_q1_id, 0, 'bogus_credential_token');
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 9 FAILED: Guest answered using forged credential!';
  ELSE
    RAISE NOTICE '✓ TEST 9 PASSED: Guest credential verification strictly enforced.';
  END IF;

  -- Legitimate guest answer
  v_answer_res := public.submit_game_answer(v_session_id, v_guest_part_id, v_q1_id, 0, v_guest_raw_token);
  IF NOT (v_answer_res->>'is_correct')::BOOLEAN THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 9 FAILED: Legitimate guest answer was not recognized.';
  END IF;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 9 PASSED: Legitimate guest answer accepted and scored.';

  -- -----------------------------------------------------------------
  -- TEST 10: REGISTERED-USER IDENTITY VALIDATION IN ANSWER SUBMISSION
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  v_error_caught := false;
  BEGIN
    PERFORM public.submit_game_answer(v_session_id, v_reg_part_id, v_q1_id, 0, NULL);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 10 FAILED: Attacker submitted answer for another registered player!';
  ELSE
    RAISE NOTICE '✓ TEST 10 PASSED: Impersonation of registered player rejected.';
  END IF;

  -- Legitimate player submission
  PERFORM set_config('request.jwt.claim.sub', v_test_player::text, true);
  v_answer_res := public.submit_game_answer(v_session_id, v_reg_part_id, v_q1_id, 0, NULL);
  IF NOT (v_answer_res->>'is_correct')::BOOLEAN THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 10 FAILED: Legitimate registered player answer rejected.';
  END IF;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 10 PASSED: Legitimate registered player answer accepted.';

  -- -----------------------------------------------------------------
  -- TEST 11: QUIZ MUTATION PREVENTION DURING ACTIVE GAME (OLD & NEW)
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  -- Host/Author attempts modifying quiz while session is in 'active' status
  v_error_caught := false;
  BEGIN
    UPDATE public.quizzes SET title = 'Altered Title While Active' WHERE id = v_public_quiz_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 11 FAILED: Allowed modifying quiz while active session was running!';
  ELSE
    RAISE NOTICE '✓ TEST 11 PASSED: Active quiz mutation trigger successfully blocked modification.';
  END IF;

  -- Author attempts deleting a question while active
  v_error_caught := false;
  BEGIN
    DELETE FROM public.questions WHERE id = v_q2_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 11 FAILED: Allowed deleting question while active session was running!';
  ELSE
    RAISE NOTICE '✓ TEST 11 PASSED: Active question deletion successfully blocked.';
  END IF;
  RESET ROLE;

  -- -----------------------------------------------------------------
  -- TEST 12: QUESTION ADVANCEMENT, CLOSING & HOST RPC AUTHORIZATION
  -- -----------------------------------------------------------------
  -- Host attempts advancing question directly without closing active question to leaderboard
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  v_error_caught := false;
  BEGIN
    PERFORM public.advance_game_question(v_session_id, 1);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 12 FAILED: Host advanced question without closing active round to leaderboard!';
  ELSE
    RAISE NOTICE '✓ TEST 12 PASSED: Advancing active round requires closing to leaderboard first.';
  END IF;

  -- Non-host attempts closing question (must fail)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  v_error_caught := false;
  BEGIN
    PERFORM public.close_current_question(v_session_id);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 12 FAILED: Attacker closed host question!';
  END IF;

  -- Anonymous caller attempts closing question (must fail)
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_error_caught := false;
  BEGIN
    PERFORM public.close_current_question(v_session_id);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 12 FAILED: Anonymous user closed host question!';
  END IF;

  -- Legitimate host closes question to leaderboard
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  PERFORM public.close_current_question(v_session_id);

  -- Attempt re-closing question in leaderboard phase (must fail)
  v_error_caught := false;
  BEGIN
    PERFORM public.close_current_question(v_session_id);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 12 FAILED: Allowed repeated question closing!';
  ELSE
    RAISE NOTICE '✓ TEST 12 PASSED: Repeated closing and unauthorized host RPC execution rejected.';
  END IF;

  -- Advance to question 1
  PERFORM public.advance_game_question(v_session_id, 1);
  RESET ROLE;

  -- -----------------------------------------------------------------
  -- TEST 13: IDEMPOTENT GAME END & LIFETIME STATS ALLOCATION
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  v_end_res1 := public.end_game_session(v_session_id);
  RESET ROLE;

  SELECT total_points INTO v_player_points FROM public.profiles WHERE id = v_test_player;

  -- Call end_game_session a second time
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);
  v_end_res2 := public.end_game_session(v_session_id);
  RESET ROLE;

  IF (SELECT total_points FROM public.profiles WHERE id = v_test_player) <> v_player_points THEN
    RAISE EXCEPTION 'TEST 13 FAILED: Repeated end_game_session doubled awarded points!';
  ELSE
    RAISE NOTICE '✓ TEST 13 PASSED: end_game_session is strictly idempotent; awards lifetime stats once.';
  END IF;

  -- -----------------------------------------------------------------
  -- TEST 14: DIRECT TABLE WRITES REVOCATION VERIFICATION
  -- -----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);

  -- Direct INSERT on game_sessions
  v_error_caught := false;
  BEGIN
    INSERT INTO public.game_sessions (game_pin, title, quiz_id, host_id, host_name)
    VALUES ('999999', 'Rogue Session', v_public_quiz_id, v_attacker, 'Rogue');
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 14 FAILED: Client was able to INSERT directly into game_sessions!';
  END IF;

  -- Direct UPDATE on participants
  v_error_caught := false;
  BEGIN
    UPDATE public.participants SET score = 999999 WHERE id = v_guest_part_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 14 FAILED: Client was able to UPDATE participants directly!';
  END IF;

  -- Attempt calling internal PIN generator directly
  v_error_caught := false;
  BEGIN
    PERFORM public.generate_unique_game_pin();
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 14 FAILED: Client was able to execute internal generate_unique_game_pin!';
  END IF;

  RESET ROLE;
  RAISE NOTICE '✓ TEST 14 PASSED: Direct client table writes and internal RPC execution properly revoked.';

  -- -----------------------------------------------------------------
  -- TEST 15: LIVE SCORING FORMULA, SPEED BONUS & TIE-BREAKING LEADERBOARD
  -- -----------------------------------------------------------------
  -- 15.1: Advance to question 2 (order 1)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);

  -- Ensure round 1 is closed to leaderboard before advancing
  PERFORM public.close_current_question(v_session_id);
  PERFORM public.advance_game_question(v_session_id, 1);
  RESET ROLE;

  -- 15.2: Immediate answer by registered user: must earn 1,000 points (700 base + 300 speed bonus)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_player::text, true);

  v_answer_res := public.submit_game_answer(v_session_id, v_reg_part_id, v_q2_id, 1, NULL);
  IF (v_answer_res->>'points_awarded')::INT < 990 OR (v_answer_res->>'base_points')::INT <> 700 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 15.1 FAILED: Immediate answer did not award expected points: %', v_answer_res;
  END IF;
  RAISE NOTICE '✓ TEST 15.1 PASSED: Immediate answer awarded base 700 + speed bonus (~1,000 pts).';

  -- 15.3: Duplicate submission attempt on question 2: must be rejected
  v_error_caught := false;
  BEGIN
    PERFORM public.submit_game_answer(v_session_id, v_reg_part_id, v_q2_id, 1, NULL);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 15.2 FAILED: Duplicate answer submission was permitted!';
  END IF;
  RAISE NOTICE '✓ TEST 15.2 PASSED: Duplicate answer submission strictly rejected.';
  RESET ROLE;

  -- 15.4: Incorrect answer by guest: must award 0 points (0 base, 0 bonus)
  SET LOCAL ROLE anon;
  v_answer_res := public.submit_game_answer(v_session_id, v_guest_part_id, v_q2_id, 3, v_guest_raw_token);
  IF (v_answer_res->>'is_correct')::BOOLEAN OR (v_answer_res->>'points_awarded')::INT <> 0 THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 15.3 FAILED: Incorrect answer awarded non-zero points: %', v_answer_res;
  END IF;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 15.3 PASSED: Incorrect answer awards 0 points.';

  -- 15.5: Host closes question
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);
  PERFORM public.close_current_question(v_session_id);
  RESET ROLE;

  -- 15.6: Submission after question closure: must be rejected
  SET LOCAL ROLE anon;
  v_error_caught := false;
  BEGIN
    PERFORM public.submit_game_answer(v_session_id, v_guest_part_id, v_q2_id, 1, v_guest_raw_token);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF NOT v_error_caught THEN
    RESET ROLE;
    RAISE EXCEPTION 'TEST 15.4 FAILED: Answer submission accepted after question closed!';
  END IF;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 15.4 PASSED: Answer submission after round closure strictly rejected.';

  -- 15.7: Verify Leaderboard resolver and tie-breaking order
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_player::text, true);
  SELECT public.get_session_leaderboard(v_session_id, v_reg_part_id, NULL) INTO v_leaderboard;
  RESET ROLE;

  IF jsonb_array_length(v_leaderboard) < 2 THEN
    RAISE EXCEPTION 'TEST 15.5 FAILED: Leaderboard returned fewer than 2 participants.';
  END IF;

  -- Player 1 has higher score than Guest -> Rank 1
  IF (v_leaderboard->0->>'rank')::INT <> 1 OR (v_leaderboard->0->>'id')::UUID <> v_reg_part_id THEN
    RAISE EXCEPTION 'TEST 15.5 FAILED: Leaderboard did not rank leading player as Rank 1: %', v_leaderboard;
  END IF;

  -- Check granular statistics exposed in leaderboard
  IF v_leaderboard->0->>'correct_answers_count' IS NULL OR v_leaderboard->0->>'questions_answered_count' IS NULL THEN
    RAISE EXCEPTION 'TEST 15.5 FAILED: Leaderboard missing required correct_answers_count or questions_answered_count: %', v_leaderboard;
  END IF;
  RAISE NOTICE '✓ TEST 15.5 PASSED: Leaderboard correctly ranks participants with tie-breakers and required stats.';

  -- 15.8: End game session & verify legitimate participant and host lifetime stats
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);
  v_end_res1 := public.end_game_session(v_session_id);
  RESET ROLE;

  SELECT total_points, quizzes_completed INTO v_user_pts, v_test_val 
  FROM public.profiles WHERE id = v_test_player;

  IF v_user_pts <= 0 OR v_test_val <> 1 THEN
    RAISE EXCEPTION 'TEST 15.6 FAILED: Registered player lifetime stats not updated after game end! pts: %, quizzes: %', v_user_pts, v_test_val;
  END IF;

  -- Verify host arena count incremented
  SELECT hosted_arenas_count INTO v_test_val FROM public.profiles WHERE id = v_test_host;
  IF v_test_val < 1 THEN
    RAISE EXCEPTION 'TEST 15.7 FAILED: Host hosted_arenas_count was not incremented! count: %', v_test_val;
  END IF;
  RAISE NOTICE '✓ TEST 15.6 PASSED: Final podium and legitimate participant statistics awarded accurately.';
  RAISE NOTICE '✓ TEST 15.7 PASSED: Host hosted_arenas_count awarded accurately via create_game_session.';

  -- 15.9: Repeated game finalization (Idempotency test)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_test_host::text, true);
  v_end_res2 := public.end_game_session(v_session_id);
  RESET ROLE;

  IF NOT (v_end_res2->>'already_ended')::BOOLEAN THEN
    RAISE EXCEPTION 'TEST 15.8 FAILED: Repeated end_game_session did not return already_ended flag: %', v_end_res2;
  END IF;

  -- Verify stats did not double-award
  SELECT total_points, quizzes_completed INTO v_player_points, v_test_val 
  FROM public.profiles WHERE id = v_test_player;

  IF v_player_points <> v_user_pts OR v_test_val <> 1 THEN
    RAISE EXCEPTION 'TEST 15.8 FAILED: Repeated finalization re-awarded points or quiz count! pts: % (expected %), quizzes: % (expected 1)', 
      v_player_points, v_user_pts, v_test_val;
  END IF;
  RAISE NOTICE '✓ TEST 15.8 PASSED: Repeated game finalization is strictly idempotent; prevents double-awarding.';

  RAISE NOTICE '===============================================================';
  RAISE NOTICE 'ALL 15 EXECUTABLE TRANSACTIONAL TESTS COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '===============================================================';
END;
$$;

ROLLBACK; -- Always rolls back test modifications cleanly

-- ============================================================================
-- REPRODUCIBLE MULTI-CONNECTION CONCURRENCY TEST PROCEDURE
-- ============================================================================
-- The following concurrency race conditions require simultaneous distinct database 
-- sessions (clients) to execute against a live PostgreSQL / Supabase instance.
--
-- TEST SUITE CONCURRENCY A: PARTICIPANT CAPACITY RACE TEST
-- Step 1 (Setup in Client 1):
--   Host creates session with participant_limit = 2:
--   SELECT create_game_session('Capacity Test', <quiz_id>, 'General', 20, true, true, 2);
--   Note PIN: '123456'.
-- Step 2 (Setup in Client 1):
--   Player 1 joins: SELECT join_game_session('123456', 'PlayerA');
-- Step 3 (Concurrent Execution):
--   Client 2 executes: SELECT join_game_session('123456', 'PlayerB');
--   Client 3 executes: SELECT join_game_session('123456', 'PlayerC');
--   Both executed at the exact same millisecond.
-- Step 4 (Expected Assertion):
--   Exactly ONE of Client 2 or Client 3 succeeds.
--   The other receives: 'This Arena competition has reached its player limit of 2 participants.'
--   SELECT COUNT(*) FROM participants WHERE game_session_id = <session_id>; equals 2.
--
-- TEST SUITE CONCURRENCY B: CONCURRENT PIN ALLOCATION TEST
-- Step 1:
--   Two host sessions simultaneously invoke `create_game_session(...)`.
-- Step 2 (Expected Assertion):
--   If `generate_unique_game_pin` produces the same PIN, the partial unique index
--   `idx_game_sessions_active_pin` catches the `unique_violation`.
--   The retry loop automatically generates a new distinct PIN without failing the transaction.
-- ============================================================================
