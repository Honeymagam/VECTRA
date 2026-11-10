/*
# Create practice question bank with seed questions

1. New Tables
- `practice_questions`
  - `id` (uuid, primary key)
  - `topic` (text) - percentages, time_and_work or number_series
  - `difficulty` (text) - easy, medium or hard
  - `question` (text) - the question shown to learners
  - `options` (text array) - exactly four answer choices
  - `correct_index` (smallint) - position of the correct choice, 0 to 3
  - `explanation` (text) - worked explanation shown after answering
  - `created_at` (timestamptz)

2. Seed data
- Inserts 18 questions (3 topics x 3 difficulty levels x 2 questions). Skipped automatically if the table already has rows.

3. Security
- Row level security is enabled.
- Learners can read questions, but only the question, topic, difficulty and options columns. `correct_index` and `explanation` are withheld so answers cannot be read before submitting.
- Answers are revealed through the submit function created in a separate migration.

4. Notes
- The question bank is shared and intentionally public, so the read policy uses `true`.
*/

CREATE TABLE IF NOT EXISTS practice_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL CHECK (topic IN ('percentages', 'time_and_work', 'number_series')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question text NOT NULL,
  options text[] NOT NULL CHECK (array_length(options, 1) = 4),
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_questions_topic_difficulty_idx ON practice_questions (topic, difficulty);

ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON practice_questions FROM anon, authenticated;
GRANT SELECT (id, topic, difficulty, question, options) ON practice_questions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_practice_questions" ON practice_questions;
CREATE POLICY "anon_select_practice_questions" ON practice_questions FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO practice_questions (topic, difficulty, question, options, correct_index, explanation)
SELECT v.topic, v.difficulty, v.question, v.options, v.correct_index, v.explanation
FROM (VALUES
  ('percentages', 'easy', 'What is 20% of 250?', ARRAY['40', '45', '50', '55']::text[], 2, '20% of 250 is 0.20 x 250 = 50.'),
  ('percentages', 'easy', 'A value rises from 80 to 100. What is the percentage increase?', ARRAY['15%', '20%', '25%', '30%']::text[], 2, 'The increase is 20 out of 80, which is 25%.'),
  ('percentages', 'medium', 'A price is cut by 20% and then raised by 25%. What is the net change?', ARRAY['No change', '5% increase', '5% decrease', '10% increase']::text[], 0, '0.80 x 1.25 = 1.00, so the price ends where it started.'),
  ('percentages', 'medium', 'A is 25% more than B. By what percentage is B less than A?', ARRAY['20%', '25%', '75%', '80%']::text[], 0, 'B = A / 1.25 = 0.8A, so B is 20% less than A.'),
  ('percentages', 'hard', 'A earns 20% more than B, and B earns 10% less than C. How does A compare with C?', ARRAY['8% more', '2% less', '10% more', '12% less']::text[], 0, 'Let C = 100. Then B = 90 and A = 108, so A is 8% more than C.'),
  ('percentages', 'hard', 'A population of 10,000 grows by 10% in year one and falls by 10% in year two. What is the population after two years?', ARRAY['9,900', '10,000', '9,800', '10,100']::text[], 0, '10,000 x 1.10 x 0.90 = 9,900.'),
  ('time_and_work', 'easy', 'A can finish a job in 10 days. What fraction of the job does A finish in one day?', ARRAY['1/5', '1/10', '1/9', '10']::text[], 1, 'One day out of a 10-day job is 1/10 of the work.'),
  ('time_and_work', 'easy', 'A finishes a job in 6 days and B in 3 days. Working together, how many days will they take?', ARRAY['2', '4.5', '3', '9']::text[], 0, 'The combined rate is 1/6 + 1/3 = 1/2, so they take 2 days.'),
  ('time_and_work', 'medium', 'A can do a task in 12 days and B in 18 days. They work together for 4 days. What fraction of the task is left?', ARRAY['4/9', '5/9', '1/3', '2/9']::text[], 0, 'Combined rate is 1/12 + 1/18 = 5/36 per day. In 4 days they finish 20/36 = 5/9, leaving 4/9.'),
  ('time_and_work', 'medium', 'A alone takes 15 days and B alone takes 10 days. A works alone for 3 days, then B joins. What is the total time taken?', ARRAY['7.8 days', '8 days', '6.5 days', '9 days']::text[], 0, 'A finishes 3/15 = 1/5 alone. The remaining 4/5 at a combined rate of 1/6 per day takes 4.8 days. Total: 3 + 4.8 = 7.8 days.'),
  ('time_and_work', 'hard', 'Pipe A fills a tank in 4 hours and pipe B empties it in 6 hours. With both open and the tank empty, how long does it take to fill?', ARRAY['10 hours', '12 hours', '8 hours', '24 hours']::text[], 1, 'The net rate is 1/4 - 1/6 = 1/12 per hour, so the tank fills in 12 hours.'),
  ('time_and_work', 'hard', '12 workers finish a job in 18 days. How many workers are needed to finish it in 9 days?', ARRAY['16', '20', '24', '36']::text[], 2, 'Worker-days stay constant: 12 x 18 = 216, and 216 / 9 = 24.'),
  ('number_series', 'easy', 'What comes next: 2, 4, 8, 16, ?', ARRAY['24', '32', '30', '20']::text[], 1, 'Each term is double the previous one, so 16 x 2 = 32.'),
  ('number_series', 'easy', 'What comes next: 3, 6, 9, 12, ?', ARRAY['13', '14', '15', '16']::text[], 2, 'The series adds 3 each time, so 12 + 3 = 15.'),
  ('number_series', 'medium', 'What comes next: 1, 4, 9, 16, 25, ?', ARRAY['30', '36', '49', '32']::text[], 1, 'These are consecutive squares, so the next term is 6 x 6 = 36.'),
  ('number_series', 'medium', 'What comes next: 2, 3, 5, 9, 17, ?', ARRAY['25', '31', '33', '35']::text[], 2, 'The gaps double each time: +1, +2, +4, +8, so the next gap is +16 and 17 + 16 = 33.'),
  ('number_series', 'hard', 'What comes next: 5, 11, 23, 47, ?', ARRAY['91', '93', '95', '97']::text[], 2, 'Each term is double the previous one plus 1: 47 x 2 + 1 = 95.'),
  ('number_series', 'hard', 'What comes next: 6, 13, 27, 55, ?', ARRAY['109', '111', '115', '119']::text[], 1, 'Each term is double the previous one plus 1: 55 x 2 + 1 = 111.')
) AS v(topic, difficulty, question, options, correct_index, explanation)
WHERE NOT EXISTS (SELECT 1 FROM practice_questions);
