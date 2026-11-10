/*
# Tie practice and mock test results to signed-in learners

## 1. Summary
Learners now sign in before taking practice questions or mock tests. Every saved result is attached to the learner who submitted it, and learners can only read their own results.

## 2. Changes to existing tables
- `practice_attempts`: new `user_id` column that records the learner who answered. It is filled automatically from the signed-in session and linked to the auth user table, so deleting an account removes its attempts.
- `mock_test_results`: new `user_id` column with the same behaviour.
- Results saved before this change have no owner. They stay in the database but are not shown to any learner.

## 3. Security changes
- Both results tables are readable only by their owner (signed-in users, own rows only). Nobody can write to them directly.
- The answer-checking and mock test grading functions now require a signed-in learner and reject anonymous calls.
- Anonymous users can no longer run either function.

## 4. Important notes
1. The question bank stays readable by everyone, since it contains no personal data.
2. Correct answers and explanations are still hidden from the question table and only returned by the grading functions.
3. Existing function names and their inputs and outputs are unchanged.
*/

ALTER TABLE practice_attempts
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE mock_test_results
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS practice_attempts_user_id_created_at_idx ON practice_attempts (user_id, created_at);
CREATE INDEX IF NOT EXISTS mock_test_results_user_id_created_at_idx ON mock_test_results (user_id, created_at);

GRANT SELECT ON practice_attempts TO authenticated;
GRANT SELECT ON mock_test_results TO authenticated;

DROP POLICY IF EXISTS "select_own_practice_attempts" ON practice_attempts;
CREATE POLICY "select_own_practice_attempts" ON practice_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_mock_test_results" ON mock_test_results;
CREATE POLICY "select_own_mock_test_results" ON mock_test_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION submit_practice_answer(p_question_id uuid, p_selected_index smallint)
RETURNS TABLE (answer_is_correct boolean, answer_correct_index smallint, answer_explanation text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  q practice_questions%ROWTYPE;
  v_is_correct boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;

  IF p_selected_index IS NULL OR p_selected_index NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'Selected option must be between 0 and 3' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO q FROM practice_questions WHERE id = p_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice question not found' USING ERRCODE = 'P0002';
  END IF;

  v_is_correct := (q.correct_index = p_selected_index);

  INSERT INTO practice_attempts (user_id, question_id, selected_index, is_correct)
  VALUES (v_user, q.id, p_selected_index, v_is_correct);

  RETURN QUERY SELECT v_is_correct, q.correct_index, q.explanation;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_practice_answer(uuid, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_practice_answer(uuid, smallint) TO authenticated;

CREATE OR REPLACE FUNCTION submit_mock_test(p_answers jsonb, p_duration_seconds integer)
RETURNS TABLE (
  r_question_id uuid,
  r_selected_index smallint,
  r_is_correct boolean,
  r_correct_index smallint,
  r_explanation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total integer;
  v_correct integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Answers must be a list of 1 to 100 entries' USING ERRCODE = '22023';
  END IF;

  IF p_duration_seconds IS NULL OR p_duration_seconds NOT BETWEEN 0 AND 86400 THEN
    RAISE EXCEPTION 'Duration must be between 0 and 86400 seconds' USING ERRCODE = '22023';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE q.correct_index = a.selected_index)
    INTO v_total, v_correct
  FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, selected_index smallint)
  JOIN practice_questions q ON q.id = a.question_id
  WHERE a.selected_index IS NULL OR a.selected_index BETWEEN 0 AND 3;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No valid questions were submitted' USING ERRCODE = '22023';
  END IF;

  INSERT INTO mock_test_results (user_id, total_questions, correct_answers, duration_seconds)
  VALUES (v_user, v_total, v_correct, p_duration_seconds);

  RETURN QUERY
  SELECT a.question_id, a.selected_index, COALESCE(q.correct_index = a.selected_index, false), q.correct_index, q.explanation
  FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, selected_index smallint)
  JOIN practice_questions q ON q.id = a.question_id
  WHERE a.selected_index IS NULL OR a.selected_index BETWEEN 0 AND 3;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_mock_test(jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_mock_test(jsonb, integer) TO authenticated;
