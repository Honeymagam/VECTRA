/*
# Add practice attempts log and answer submission function

1. New Tables
- `practice_attempts`
  - `id` (uuid, primary key)
  - `question_id` (uuid, references practice_questions, deleted with its question)
  - `selected_index` (smallint, 0 to 3)
  - `is_correct` (boolean)
  - `created_at` (timestamptz)

2. New Function
- `submit_practice_answer(question id, selected option)` checks the answer on the server, records the attempt, and returns whether it was correct along with the correct option and explanation.
- Runs with elevated rights so learners never need direct access to answers or the attempt log.

3. Security
- Row level security is enabled on `practice_attempts` with no client policies, so learners cannot read or write the log directly.
- The submit function is callable by anonymous and signed-in users only. Public execute permission is removed.

4. Notes
- The app has no sign-in, so attempts are recorded without a learner identity.
*/

CREATE TABLE IF NOT EXISTS practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES practice_questions (id) ON DELETE CASCADE,
  selected_index smallint NOT NULL CHECK (selected_index BETWEEN 0 AND 3),
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_attempts_question_id_idx ON practice_attempts (question_id);

ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON practice_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION submit_practice_answer(p_question_id uuid, p_selected_index smallint)
RETURNS TABLE (answer_is_correct boolean, answer_correct_index smallint, answer_explanation text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q practice_questions%ROWTYPE;
  v_is_correct boolean;
BEGIN
  IF p_selected_index IS NULL OR p_selected_index NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'Selected option must be between 0 and 3' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO q FROM practice_questions WHERE id = p_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice question not found' USING ERRCODE = 'P0002';
  END IF;

  v_is_correct := (q.correct_index = p_selected_index);

  INSERT INTO practice_attempts (question_id, selected_index, is_correct)
  VALUES (q.id, p_selected_index, v_is_correct);

  RETURN QUERY SELECT v_is_correct, q.correct_index, q.explanation;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_practice_answer(uuid, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_practice_answer(uuid, smallint) TO anon, authenticated;
