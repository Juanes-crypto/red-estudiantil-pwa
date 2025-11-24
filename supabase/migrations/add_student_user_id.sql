-- ================================================
-- ADD user_id TO students TABLE
-- ================================================
-- Allows students to login directly with their own auth account
-- Date: 2025-11-23
-- ================================================

-- Add user_id column (links to auth.users)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Add unique constraint (one student = one auth account)
ALTER TABLE students 
ADD CONSTRAINT unique_student_user_id UNIQUE (user_id);

-- Update RLS policies for ICFES to use user_id
-- Drop old policies
DROP POLICY IF EXISTS "allow_all_attempts" ON icfes_attempts;

-- Students can only read their own attempts
CREATE POLICY "read_own_icfes_attempts" ON icfes_attempts FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Students can only insert their own attempts
CREATE POLICY "insert_own_icfes_attempts" ON icfes_attempts FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Verification
SELECT 
  'user_id column added!' as status,
  COUNT(*) as total_students
FROM students;
