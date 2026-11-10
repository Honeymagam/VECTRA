/*
# Add mock test results and grading function

1. New Tables
- `mock_test_results`
  - `id` (uuid, primary key)
  - `total_questions` (smallint) - number of questions graded in the test
  - `correct_answers` (smallint) - number answered correctly
  - `duration_seconds` (integer) - time taken, from 0 to 86400
  - `created_at` (timestamptz)

2. New Function
- `submit_mock_test(answers, duration)` grades a full mock test in one call. It takes a list of question and chosen-option pairs, records the score summary, and returns the correct answer and explanation for each question.
- Runs with elevated rights so correct answers are never readable before submission.

3. Security
- Row level security is enabled on `mock_test_results` with no client policies, so the results log cannot be read or written directly.
- The grading function is callable by anonymous and signed-in users only. Public execute permission is removed.

4. Notes
- The app has no sign-in, so results are recorded without a learner identity.
- Options outside 0 to 3 and unknown question IDs are ignored.
*/

CREATE TABLE IF NOT EXISTS mock_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_questions smallint NOT NULL CHECK (total_questions > 0),
  correct_answers smallint NOT NULL CHECK (correct_answers >= 0),
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 0 AND 86400),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (correct_answers <= total_questions)
);

ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON mock_test_results FROM anon, authenticated;

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
  v_total integer;
  v_correct integer;
BEGIN
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
  WHERE a.selected_index BETWEEN 0 AND 3;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No valid answers were submitted' USING ERRCODE = '22023';
  END IF;

  INSERT INTO mock_test_results (total_questions, correct_answers, duration_seconds)
  VALUES (v_total, v_correct, p_duration_seconds);

  RETURN QUERY
  SELECT a.question_id, a.selected_index, (q.correct_index = a.selected_index), q.correct_index, q.explanation
  FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, selected_index smallint)
  JOIN practice_questions q ON q.id = a.question_id
  WHERE a.selected_index BETWEEN 0 AND 3;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_mock_test(jsonb, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_mock_test(jsonb, integer) TO anon, authenticated;
