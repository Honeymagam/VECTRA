/*
# Grade unanswered mock test questions

1. Modified Function
- `submit_mock_test(answers, duration)` now accepts a null chosen option. Unanswered questions are graded as incorrect and still return their correct option and explanation, so learners can review what they missed.

2. Notes
- Options outside 0 to 3 are still ignored.
- The stored summary counts every graded question, so a test that was left unanswered scores lower rather than being skipped.
- No table or permission changes.
*/

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
  WHERE a.selected_index IS NULL OR a.selected_index BETWEEN 0 AND 3;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No valid questions were submitted' USING ERRCODE = '22023';
  END IF;

  INSERT INTO mock_test_results (total_questions, correct_answers, duration_seconds)
  VALUES (v_total, v_correct, p_duration_seconds);

  RETURN QUERY
  SELECT a.question_id, a.selected_index, COALESCE(q.correct_index = a.selected_index, false), q.correct_index, q.explanation
  FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, selected_index smallint)
  JOIN practice_questions q ON q.id = a.question_id
  WHERE a.selected_index IS NULL OR a.selected_index BETWEEN 0 AND 3;
END;
$$;
